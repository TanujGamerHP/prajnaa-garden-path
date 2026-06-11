import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  Search,
  Package,
  Eye,
  ChevronDown,
  ChevronUp,
  Truck,
  MapPin,
  Calendar,
  Layers,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { inr } from "@/lib/format";
import { sendAdminEmailNotification } from "@/lib/api/notifications.server";

export const Route = createFileRoute("/admin/orders")({
  component: AdminOrders,
});

const STATUS_TABS = ["all", "pending", "confirmed", "packed", "shipped", "delivered", "cancelled"] as const;
type StatusTab = (typeof STATUS_TABS)[number];

const statusTone: Record<string, string> = {
  pending: "bg-warning/15 text-warning",
  confirmed: "bg-accent/15 text-accent font-semibold",
  packed: "bg-primary/10 text-primary",
  shipped: "bg-primary/20 text-primary border border-primary/20",
  delivered: "bg-success/15 text-success",
  cancelled: "bg-destructive/15 text-destructive",
};

function AdminOrders() {
  const [tab, setTab] = useState<StatusTab>("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["admin-orders", tab],
    queryFn: async () => {
      let builder = supabase.from("orders").select("*");
      if (tab !== "all") {
        builder = builder.eq("status", tab);
      }
      builder = builder.order("created_at", { ascending: false });
      const { data, error } = await builder;
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = orders.filter((o: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      o.id?.toLowerCase().includes(q) ||
      o.order_id?.toLowerCase().includes(q) ||
      o.customer_name?.toLowerCase().includes(q) ||
      o.customer_email?.toLowerCase().includes(q)
    );
  });

  const updateStatus = async (orderId: string, newStatus: string, existingHistory: any[] = []) => {
    const now = new Date().toISOString();
    let title = "";
    let description = "";

    switch (newStatus) {
      case "confirmed":
        title = "Order Confirmed";
        description = "Admin confirmed the order and verified details.";
        break;
      case "packed":
        title = "Packed by Farmer";
        description = "All products have been packaged and verified for transit.";
        break;
      case "shipped":
        title = "Shipped";
        description = "Fulfillment package is in transit via courier.";
        break;
      case "delivered":
        title = "Delivered Successfully";
        description = "Shipment delivered to customer's address.";
        break;
      case "cancelled":
        title = "Order Cancelled";
        description = "This order has been cancelled.";
        break;
    }

    const newLog = {
      status: newStatus,
      title,
      description,
      timestamp: now,
    };

    const patch: any = {
      status: newStatus,
      updated_at: now,
      tracking_history: [...(existingHistory || []), newLog]
    };
    if (newStatus === "delivered") patch.delivered_at = now;
    if (newStatus === "shipped") patch.shipped_at = now;

    // Handle stock recovery and payment cancellation when cancelled by Admin
    if (newStatus === "cancelled") {
      try {
        const { data: order } = await supabase
          .from("orders")
          .select("items, payment_status, total, customer_name, order_id")
          .eq("id", orderId)
          .maybeSingle();

        if (order) {
          // Revert stock for all items
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
          // Set appropriate payment status
          patch.payment_status = order.payment_status === "paid" ? "refunded" : "cancelled";

          // Save system notification for admin
          await supabase.from("system_notifications").insert({
            type: "order_cancelled",
            title: "Order Cancelled by Admin",
            message: `Order "${order.order_id || orderId}" has been cancelled by Admin.`,
            read: false,
            metadata: {
              order_id: order.order_id || orderId,
              customer_name: order.customer_name,
              total: order.total,
            }
          });

          // Send email notification to admin
          try {
            await sendAdminEmailNotification({
              data: {
                subject: `[Cancellation] Order Cancelled by Admin - ${order.order_id || orderId}`,
                body: `An administrator has cancelled Order "${order.order_id || orderId}" for customer "${order.customer_name}".\n\nOrder Details:\n- Total: ${inr(order.total)}\n- Payment Status updated to: ${order.payment_status === "paid" ? "refunded" : "cancelled"}\n\nInventory has been returned to the respective farmers.`,
              }
            });
          } catch (emailErr) {
            console.warn("Failed to send email notification to admin:", emailErr);
          }
        }
      } catch (err: any) {
        console.error("Error reverting stock on admin cancellation:", err);
      }
    }

    const { error } = await supabase.from("orders").update(patch).eq("id", orderId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Order status updated to ${newStatus}`);
    qc.invalidateQueries({ queryKey: ["admin-orders"] });
  };

  const confirmFulfillment = async (
    orderId: string,
    data: {
      delivery_date: string;
      delivery_route: string;
      carrier_name: string;
      tracking_number: string;
    },
    existingHistory: any[]
  ) => {
    const now = new Date().toISOString();
    const newLog = {
      status: "confirmed",
      title: "Order Confirmed & Route Assigned",
      description: `Delivery route [${data.delivery_route}] assigned. Shipped via ${data.carrier_name} (Tracking ID: ${data.tracking_number}). Est delivery: ${new Date(data.delivery_date).toLocaleDateString("en-IN")}`,
      timestamp: now,
    };

    const patch = {
      status: "confirmed",
      delivery_date: data.delivery_date,
      delivery_route: data.delivery_route,
      carrier_name: data.carrier_name,
      tracking_number: data.tracking_number,
      tracking_history: [...(existingHistory || []), newLog],
      updated_at: now,
    };

    const { error } = await supabase.from("orders").update(patch).eq("id", orderId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Order confirmed and shipping route assigned!");
    qc.invalidateQueries({ queryKey: ["admin-orders"] });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-semibold">Order Administration</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage customer orders, decide routes, delivery dates, and assign carrier tracking IDs.
          </p>
        </div>
        
        {/* Total stats */}
        <div className="flex gap-3 text-xs bg-secondary/35 border border-border p-3 rounded-2xl">
          <div>
            <span className="text-muted-foreground uppercase font-subhead tracking-wider block">Total Orders</span>
            <span className="font-display text-base font-bold">{orders.length}</span>
          </div>
          <div className="border-l border-border px-3">
            <span className="text-muted-foreground uppercase font-subhead tracking-wider block">Pending Review</span>
            <span className="font-display text-base font-bold text-warning">
              {orders.filter((o: any) => o.status === "pending").length}
            </span>
          </div>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`font-subhead inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs capitalize transition cursor-pointer ${
              tab === t
                ? "bg-primary text-primary-foreground font-semibold"
                : "border border-border bg-background hover:bg-secondary/40 text-muted-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by order ID, customer name or email"
          className="font-subhead h-11 w-full rounded-xl border border-border bg-background pl-9 pr-4 text-sm outline-none focus:border-primary transition"
        />
      </div>

      {/* Orders list */}
      <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
        {isLoading ? (
          <div className="grid place-items-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Package className="mx-auto h-10 w-10 text-muted-foreground/30" />
            <p className="mt-3 text-sm text-muted-foreground">
              {orders.length === 0
                ? "No customer orders placed yet."
                : "No orders match your search."}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-secondary/35 border-b border-border">
              <tr className="font-subhead text-[10px] uppercase tracking-[0.14em] text-muted-foreground text-left">
                <th className="px-5 py-3.5">Order ID</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Payment</th>
                <th>Status</th>
                <th className="px-5 text-right">Total</th>
                <th className="px-4 text-center">Fulfillment</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o: any) => {
                const items = o.items ?? [];
                const isExpanded = expandedId === o.id;
                return (
                  <OrderRow
                    key={o.id}
                    order={o}
                    items={items}
                    isExpanded={isExpanded}
                    onToggle={() => setExpandedId(isExpanded ? null : o.id)}
                    onUpdateStatus={(id, status) => updateStatus(id, status, o.tracking_history)}
                    onConfirmFulfillment={(id, data) => confirmFulfillment(id, data, o.tracking_history)}
                  />
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function OrderRow({
  order,
  items,
  isExpanded,
  onToggle,
  onUpdateStatus,
  onConfirmFulfillment,
}: {
  order: any;
  items: any[];
  isExpanded: boolean;
  onToggle: () => void;
  onUpdateStatus: (id: string, status: string) => void;
  onConfirmFulfillment: (id: string, data: any) => void;
}) {
  const orderId = order.order_id || order.id?.slice(0, 8).toUpperCase();
  const date = order.created_at
    ? new Date(order.created_at).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

  // Fulfillment form states
  const [route, setRoute] = useState(order.delivery_route || "Central Hub -> Bengaluru East Direct Route");
  const [delDate, setDelDate] = useState(
    order.delivery_date
      ? order.delivery_date.split("T")[0]
      : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [carrier, setCarrier] = useState(order.carrier_name || "DTDC");
  const [trackingNo, setTrackingNo] = useState(
    order.tracking_number || `TRK-DTDC-${Math.floor(100000 + Math.random() * 899900)}`
  );

  const handleSubmitFulfillment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!route.trim()) return toast.error("Please enter a delivery route");
    if (!delDate) return toast.error("Please enter an estimated delivery date");
    if (!trackingNo.trim()) return toast.error("Please enter a tracking number");

    onConfirmFulfillment(order.id, {
      delivery_date: new Date(delDate).toISOString(),
      delivery_route: route,
      carrier_name: carrier,
      tracking_number: trackingNo,
    });
  };

  return (
    <>
      <tr className="border-t border-border hover:bg-secondary/10 transition-colors">
        <td className="px-5 py-4 font-display font-medium text-foreground">{orderId}</td>
        <td className="text-muted-foreground font-subhead text-xs">{date}</td>
        <td>
          <p className="font-medium text-foreground text-sm">{order.customer_name || "—"}</p>
          <p className="text-xs text-muted-foreground font-subhead">{order.customer_email || ""}</p>
        </td>
        <td>
          <span className="text-xs uppercase tracking-wider font-subhead font-semibold bg-secondary/50 px-2 py-0.5 rounded-md text-foreground">
            {order.payment_method || "—"}
          </span>
          <span className={`text-[10px] font-subhead block mt-1 ${order.payment_status === "paid" ? "text-success font-semibold" : "text-muted-foreground"}`}>
            {order.payment_status === "paid" ? "Paid" : "COD Pending"}
          </span>
        </td>
        <td>
          <span
            className={`font-subhead rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-[0.1em] font-semibold border ${
              statusTone[order.status] ?? "bg-secondary text-muted-foreground"
            }`}
          >
            {order.status}
          </span>
        </td>
        <td className="px-5 text-right font-display font-semibold text-foreground">{inr(Number(order.total || 0))}</td>
        <td className="px-3 text-center">
          <button
            onClick={onToggle}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-subhead font-medium transition cursor-pointer mx-auto ${
              isExpanded 
                ? "bg-secondary text-foreground border-border" 
                : order.status === "pending"
                  ? "bg-primary/10 border-primary/20 text-primary hover:bg-primary/15"
                  : "bg-background border-border hover:bg-secondary/40 text-muted-foreground"
            }`}
          >
            {order.status === "pending" ? "Verify & Route" : "Details"}
            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </td>
      </tr>
      {isExpanded && (
        <tr className="border-t border-border bg-secondary/15">
          <td colSpan={7} className="px-5 py-6">
            <div className="grid gap-6 lg:grid-cols-2">
              
              {/* Order Items list */}
              <div className="space-y-3">
                <p className="font-subhead text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-bold flex items-center gap-1.5">
                  <Package className="h-4 w-4" /> Ordered Products ({items.length})
                </p>
                {items.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No item details available.</p>
                ) : (
                  <ul className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                    {items.map((item: any, idx: number) => (
                      <li
                        key={idx}
                        className="flex items-center gap-3 rounded-2xl border border-border bg-background p-3"
                      >
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-10 w-10 rounded-xl object-cover border border-border shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-display font-medium text-xs text-foreground truncate">{item.name}</p>
                          <p className="text-[10px] text-muted-foreground font-subhead">
                            Qty: {item.qty} · {item.weight || ""}
                          </p>
                        </div>
                        <p className="font-display font-semibold text-xs shrink-0 text-foreground">
                          {inr(Number(item.price || 0) * Number(item.qty || 1))}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Shipping Details & Assign Fulfillment Form */}
              <div className="space-y-5">
                <div>
                  <p className="font-subhead text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-bold flex items-center gap-1.5 mb-2.5">
                    <MapPin className="h-4 w-4" /> Shipping Address
                  </p>
                  <div className="rounded-2xl border border-border bg-background p-4 text-xs space-y-1">
                    <p className="font-semibold text-foreground">{order.shipping_name || order.customer_name || "—"}</p>
                    <p className="text-muted-foreground leading-relaxed">
                      {order.shipping_address || "No address provided"}
                    </p>
                    {order.customer_phone && (
                      <p className="text-muted-foreground mt-2 font-medium">📞 {order.customer_phone}</p>
                    )}
                  </div>
                </div>

                {/* Fulfillment workflow conditional UI */}
                {order.status === "pending" ? (
                  // pending status: Assign route, date & confirm
                  <form onSubmit={handleSubmitFulfillment} className="bg-background rounded-2xl border border-border p-4 space-y-4">
                    <div className="flex items-center gap-2 border-b border-border pb-2">
                      <AlertTriangle className="h-4.5 w-4.5 text-warning shrink-0" />
                      <h4 className="font-display font-semibold text-sm text-foreground">Pending Dispatch Decision</h4>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-[9px] uppercase tracking-wider text-muted-foreground font-subhead font-semibold mb-1">
                          Delivery Route
                        </label>
                        <input
                          type="text"
                          required
                          value={route}
                          onChange={(e) => setRoute(e.target.value)}
                          className="font-subhead h-9 w-full rounded-lg border border-border bg-background px-3 text-xs outline-none focus:border-primary"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[9px] uppercase tracking-wider text-muted-foreground font-subhead font-semibold mb-1">
                            Est. Delivery Date
                          </label>
                          <input
                            type="date"
                            required
                            value={delDate}
                            onChange={(e) => setDelDate(e.target.value)}
                            className="font-subhead h-9 w-full rounded-lg border border-border bg-background px-3 text-xs outline-none focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] uppercase tracking-wider text-muted-foreground font-subhead font-semibold mb-1">
                            Carrier Partner
                          </label>
                          <select
                            value={carrier}
                            onChange={(e) => setCarrier(e.target.value)}
                            className="font-subhead h-9 w-full rounded-lg border border-border bg-background px-2 text-xs outline-none focus:border-primary"
                          >
                            <option value="DTDC">DTDC Express</option>
                            <option value="BlueDart">BlueDart Aviation</option>
                            <option value="Delhivery">Delhivery Logistics</option>
                            <option value="SpeedPost">India SpeedPost</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[9px] uppercase tracking-wider text-muted-foreground font-subhead font-semibold mb-1">
                          Carrier Tracking ID
                        </label>
                        <input
                          type="text"
                          required
                          value={trackingNo}
                          onChange={(e) => setTrackingNo(e.target.value)}
                          className="font-subhead h-9 w-full rounded-lg border border-border bg-background px-3 text-xs outline-none focus:border-primary"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="font-subhead h-9 w-full rounded-full bg-primary text-xs font-semibold text-primary-foreground hover:opacity-90 transition mt-2 cursor-pointer"
                    >
                      Assign Delivery Partners & Confirm Order
                    </button>
                  </form>
                ) : (
                  // already confirmed/shipped: show values & update statuses
                  <div className="space-y-4">
                    <div className="bg-background rounded-2xl border border-border p-4 space-y-2.5 text-xs">
                      <p className="font-subhead font-bold text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Truck className="h-4 w-4" /> Transit Information
                      </p>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div>
                          <span className="text-muted-foreground block font-subhead">Route:</span>
                          <span className="font-semibold text-foreground truncate block">{order.delivery_route}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block font-subhead">Partner:</span>
                          <span className="font-semibold text-foreground block">{order.carrier_name}</span>
                        </div>
                        <div className="mt-1">
                          <span className="text-muted-foreground block font-subhead">Estimated Delivery:</span>
                          <span className="font-semibold text-foreground block">
                            {order.delivery_date ? new Date(order.delivery_date).toLocaleDateString("en-IN") : "—"}
                          </span>
                        </div>
                        <div className="mt-1">
                          <span className="text-muted-foreground block font-subhead">Tracking ID:</span>
                          <span className="font-mono text-[11px] font-semibold text-foreground block">{order.tracking_number}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 bg-background rounded-2xl border border-border p-4">
                      <p className="font-subhead font-semibold text-[10px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                        <Layers className="h-4 w-4" /> Advance Shipping Progress
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {["packed", "shipped", "delivered", "cancelled"].map((s) => (
                          <button
                            key={s}
                            disabled={order.status === s}
                            onClick={() => onUpdateStatus(order.id, s)}
                            className={`font-subhead inline-flex items-center rounded-full px-3.5 py-1.5 text-[10px] font-bold capitalize transition disabled:opacity-30 cursor-pointer ${
                              s === "cancelled"
                                ? "border border-destructive text-destructive hover:bg-destructive/10"
                                : s === "delivered"
                                  ? "border border-success text-success hover:bg-success/10"
                                  : "border border-border hover:bg-secondary/50 text-muted-foreground"
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </td>
        </tr>
      )}
    </>
  );
}
