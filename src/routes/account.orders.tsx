import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Package, Loader2, Calendar, CreditCard, ChevronRight, X, RotateCcw, AlertTriangle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AccountPageHeader } from "@/components/account/page-header";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { inr } from "@/lib/format";
import { toast } from "sonner";
import { sendAdminEmailNotification } from "@/lib/api/notifications.server";

export const Route = createFileRoute("/account/orders")({
  component: OrdersList,
});

const FILTERS = ["All", "Pending", "Confirmed", "Packed", "Shipped", "Delivered", "Cancelled"] as const;
type Filter = (typeof FILTERS)[number];

function OrdersList() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<Filter>("All");
  const [query, setQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState("");
  const qc = useQueryClient();

  const cancelMut = useMutation({
    mutationFn: async (order: any) => {
      if (!order) return;
      const now = new Date().toISOString();

      const newHistoryLog = {
        status: "cancelled",
        title: "Order Cancelled by Customer",
        description: "The customer cancelled this shipment. Inventory stock has been returned to farmers.",
        timestamp: now,
      };

      const patch = {
        status: "cancelled",
        payment_status: order.payment_status === "paid" ? "refunded" : "cancelled",
        tracking_history: [...(order.tracking_history || []), newHistoryLog],
        updated_at: now,
      };

      const { error: orderError } = await supabase.from("orders").update(patch).eq("id", order.id);
      if (orderError) throw orderError;

      // Save system notification for admin
      await supabase.from("system_notifications").insert({
        type: "order_cancelled",
        title: "Order Cancelled by Customer",
        message: `Order "${order.order_id || order.id}" has been cancelled by customer "${order.customer_name}".`,
        read: false,
        metadata: {
          order_id: order.order_id || order.id,
          customer_name: order.customer_name,
          total: order.total,
        }
      });

      // Send email notification to admin
      try {
        await sendAdminEmailNotification({
          data: {
            subject: `[Cancellation] Order Cancelled by Customer - ${order.order_id || order.id}`,
            body: `Customer "${order.customer_name}" has cancelled their order.\n\nOrder Details:\n- Order ID: ${order.order_id || order.id}\n- Refund Status: ${order.payment_status === "paid" ? "Refund Initiated (Online)" : "COD Order Cancelled"}\n- Amount: ${inr(order.total)}\n- Address: ${order.shipping_address}\n\nInventory has been returned to the respective farmers.`,
          }
        });
      } catch (emailErr) {
        console.warn("Failed to send email notification to admin:", emailErr);
      }

      // Return stocks back
      for (const item of order.items || []) {
        const { data: prod } = await supabase
          .from("farmer_products")
          .select("stock")
          .eq("slug", item.slug)
          .maybeSingle();

        if (prod) {
          const currentStock = Number(prod.stock || 0);
          const newStock = currentStock + Number(item.qty || 1);
          await supabase
            .from("farmer_products")
            .update({ stock: String(newStock) })
            .eq("slug", item.slug);
        }
      }
    },
    onSuccess: () => {
      toast.success("Order cancelled successfully!");
      setShowCancelModal(false);
      setSelectedOrder(null);
      qc.invalidateQueries({ queryKey: ["customer-orders", user?.id] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to cancel order");
    },
  });

  const returnMut = useMutation({
    mutationFn: async ({ order, reason }: { order: any; reason: string }) => {
      if (!order) return;
      const now = new Date().toISOString();

      const newHistoryLog = {
        status: "returned",
        title: "Return Requested by Customer",
        description: `Customer requested a return. Reason: ${reason || "No reason provided"}`,
        timestamp: now,
      };

      const patch = {
        status: "returned",
        payment_status: "refunded",
        tracking_history: [...(order.tracking_history || []), newHistoryLog],
        updated_at: now,
      };

      const { error: orderError } = await supabase.from("orders").update(patch).eq("id", order.id);
      if (orderError) throw orderError;

      // Save system notification for admin
      await supabase.from("system_notifications").insert({
        type: "order_returned",
        title: "Order Return Requested",
        message: `Order "${order.order_id || order.id}" has been returned by customer "${order.customer_name}". Reason: ${reason || "No reason provided"}`,
        read: false,
        metadata: {
          order_id: order.order_id || order.id,
          customer_name: order.customer_name,
          total: order.total,
          reason: reason,
        }
      });

      // Send email notification to admin
      try {
        await sendAdminEmailNotification({
          data: {
            subject: `[Return] Order Return Requested - ${order.order_id || order.id}`,
            body: `Customer "${order.customer_name}" has requested a return for their order.\n\nOrder Details:\n- Order ID: ${order.order_id || order.id}\n- Amount: ${inr(order.total)}\n- Return Reason: ${reason || "No reason provided"}\n- Address: ${order.shipping_address}\n\nPlease process the return and verification on the admin dashboard.`,
          }
        });
      } catch (emailErr) {
        console.warn("Failed to send email notification to admin:", emailErr);
      }

      // Return stocks back
      for (const item of order.items || []) {
        const { data: prod } = await supabase
          .from("farmer_products")
          .select("stock")
          .eq("slug", item.slug)
          .maybeSingle();

        if (prod) {
          const currentStock = Number(prod.stock || 0);
          const newStock = currentStock + Number(item.qty || 1);
          await supabase
            .from("farmer_products")
            .update({ stock: String(newStock) })
            .eq("slug", item.slug);
        }
      }
    },
    onSuccess: () => {
      toast.success("Return initiated successfully!");
      setShowReturnModal(false);
      setReturnReason("");
      setSelectedOrder(null);
      qc.invalidateQueries({ queryKey: ["customer-orders", user?.id] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to initiate return");
    },
  });

  const { data: orders = [], isLoading } = useQuery({
    enabled: !!user?.id,
    queryKey: ["customer-orders", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = orders.filter((o: any) => {
    if (filter !== "All" && o.status.toLowerCase() !== filter.toLowerCase()) return false;
    if (query) {
      const q = query.toLowerCase();
      const matchOrderId = o.order_id?.toLowerCase().includes(q) || o.id?.toLowerCase().includes(q);
      const matchItem = o.items?.some((i: any) => i.name.toLowerCase().includes(q));
      return matchOrderId || matchItem;
    }
    return true;
  });

  return (
    <>
      <AccountPageHeader
        title="Your orders"
        description="Track active shipments, view order details, and check delivery dates."
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by order ID or product name..."
            className="font-subhead h-10 w-full rounded-xl border border-border bg-background pl-9 pr-4 text-xs outline-none focus:border-primary transition"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`font-subhead rounded-full px-3 py-1.5 text-[10px] uppercase tracking-[0.12em] font-semibold transition cursor-pointer border ${
                filter === f
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border text-muted-foreground hover:bg-secondary/40"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState isSearch={!!query || filter !== "All"} />
      ) : (
        <div className="space-y-4">
          {filtered.map((o: any) => {
            const date = o.created_at
              ? new Date(o.created_at).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : "—";
            const orderId = o.order_id || o.id?.slice(0, 8).toUpperCase();
            const itemsList = o.items || [];

            return (
              <article
                key={o.id}
                className="rounded-2xl border border-border bg-card p-5 transition hover:border-muted-foreground/30 shadow-sm animate-fade-up"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-subhead text-[10px] uppercase tracking-wider text-muted-foreground">Order ID</p>
                      <p className="font-display text-sm font-semibold text-foreground mt-0.5">{orderId}</p>
                    </div>
                    <div className="border-l border-border pl-4">
                      <p className="font-subhead text-[10px] uppercase tracking-wider text-muted-foreground">Date Placed</p>
                      <p className="font-subhead text-xs mt-0.5 text-foreground">{date}</p>
                    </div>
                    <div className="border-l border-border pl-4">
                      <p className="font-subhead text-[10px] uppercase tracking-wider text-muted-foreground">Amount</p>
                      <p className="font-display text-sm font-bold text-foreground mt-0.5">{inr(Number(o.total))}</p>
                    </div>
                  </div>
                  <div>
                    <StatusPill status={o.status} />
                  </div>
                </div>

                {/* Items in this order */}
                <div className="py-4 space-y-3">
                  {itemsList.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-3">
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-10 w-10 rounded-lg object-cover border border-border shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-display font-medium text-xs text-foreground truncate">{item.name}</p>
                        <p className="text-[10px] text-muted-foreground font-subhead mt-0.5">
                          Qty: {item.qty} · {item.weight}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tracking info & link to details */}
                <div className="flex flex-wrap items-center justify-between border-t border-border pt-4 text-xs font-subhead mt-1 gap-3">
                  <div className="text-muted-foreground">
                    {o.status === "pending" ? (
                      <span className="flex items-center gap-1.5 text-warning font-semibold">
                        Awaiting route & delivery date allocation
                      </span>
                    ) : o.delivery_date ? (
                      <span className="flex items-center gap-1 text-primary">
                        <Calendar className="h-3.5 w-3.5" /> Est. Delivery: {new Date(o.delivery_date).toLocaleDateString("en-IN")}
                      </span>
                    ) : (
                      <span>Processing order</span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    {(o.status === "pending" || o.status === "confirmed") && (
                      <button
                        onClick={() => {
                          setSelectedOrder(o);
                          setShowCancelModal(true);
                        }}
                        className="text-destructive font-semibold hover:underline cursor-pointer flex items-center gap-1 border-0 bg-transparent p-0"
                      >
                        <X className="h-3.5 w-3.5" /> Cancel Order
                      </button>
                    )}
                    {o.status === "delivered" && (
                      <button
                        onClick={() => {
                          setSelectedOrder(o);
                          setShowReturnModal(true);
                        }}
                        className="text-warning font-semibold hover:underline cursor-pointer flex items-center gap-1 border-0 bg-transparent p-0"
                      >
                        <RotateCcw className="h-3.5 w-3.5" /> Return Order
                      </button>
                    )}
                    <Link
                      to="/orders/$id"
                      params={{ id: o.id }}
                      className="inline-flex items-center gap-1 text-primary font-semibold hover:underline"
                    >
                      Track Shipment <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelModal && selectedOrder && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-background border border-border rounded-3xl p-6 space-y-6 shadow-lift animate-fade-up">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-foreground">Cancel Order</h3>
                <p className="text-xs text-muted-foreground mt-0.5">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to cancel order <span className="font-semibold text-foreground">{selectedOrder.order_id || selectedOrder.id?.slice(0, 8).toUpperCase()}</span>? Farmer crop reserves will be returned, and online payments will be refunded.
            </p>

            <div className="flex gap-2.5">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setSelectedOrder(null);
                }}
                className="font-subhead h-10 flex-1 rounded-full border border-border text-xs font-semibold hover:bg-secondary transition cursor-pointer text-foreground"
              >
                No, keep order
              </button>
              <button
                onClick={() => cancelMut.mutate(selectedOrder)}
                disabled={cancelMut.isPending}
                className="font-subhead h-10 flex-1 rounded-full bg-destructive text-xs font-bold text-destructive-foreground hover:opacity-90 disabled:opacity-50 transition cursor-pointer"
              >
                {cancelMut.isPending ? "Cancelling..." : "Yes, cancel order"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return Confirmation Modal */}
      {showReturnModal && selectedOrder && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-background border border-border rounded-3xl p-6 space-y-6 shadow-lift animate-fade-up">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-warning/10 text-warning flex items-center justify-center shrink-0">
                <RotateCcw className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-foreground">Return Order</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Please provide a reason for return.</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-subhead text-[10px] uppercase tracking-wider text-muted-foreground">Reason for Return</label>
              <textarea
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                placeholder="e.g. Received damaged products, items missing, incorrect order..."
                rows={3}
                className="w-full rounded-xl border border-border p-3 text-xs outline-none focus:border-primary transition resize-none bg-background text-foreground"
              />
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={() => {
                  setShowReturnModal(false);
                  setReturnReason("");
                  setSelectedOrder(null);
                }}
                className="font-subhead h-10 flex-1 rounded-full border border-border text-xs font-semibold hover:bg-secondary transition cursor-pointer text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={() => returnMut.mutate({ order: selectedOrder, reason: returnReason })}
                disabled={returnMut.isPending || !returnReason.trim()}
                className="font-subhead h-10 flex-1 rounded-full bg-warning text-xs font-bold text-warning-foreground hover:opacity-90 disabled:opacity-50 transition cursor-pointer"
              >
                {returnMut.isPending ? "Submitting..." : "Submit Return"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function EmptyState({ isSearch }: { isSearch: boolean }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
      <Package className="mx-auto h-8 w-8 text-muted-foreground/45" />
      <p className="font-display text-lg font-semibold mt-3">
        {isSearch ? "No orders match" : "No orders yet"}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        {isSearch
          ? "Try adjusting your search queries or status filters."
          : "You haven't placed any orders on Prajnaa Market yet."}
      </p>
      {!isSearch && (
        <Link
          to="/shop"
          className="font-subhead mt-4 inline-flex h-9 items-center rounded-full bg-primary px-5 text-xs uppercase tracking-[0.14em] font-semibold text-primary-foreground hover:opacity-90 cursor-pointer"
        >
          Explore Shop
        </Link>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-warning/15 text-warning border border-warning/10",
    confirmed: "bg-accent/15 text-accent border border-accent/10 font-semibold",
    packed: "bg-primary/10 text-primary border border-primary/10",
    shipped: "bg-primary/20 text-primary border border-primary/20",
    delivered: "bg-success/15 text-success border border-success/10",
    cancelled: "bg-destructive/15 text-destructive border border-destructive/10",
  };
  return (
    <span
      className={`font-subhead rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-[0.12em] font-semibold border ${
        map[status] ?? "bg-secondary border-border"
      }`}
    >
      {status}
    </span>
  );
}
