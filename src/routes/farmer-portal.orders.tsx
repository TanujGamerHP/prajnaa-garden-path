import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, ShoppingBag, MapPin, Check, PackageCheck, Truck, User } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useFarmerProfile } from "@/lib/farmer/use-farmer";
import { inr } from "@/lib/format";

export const Route = createFileRoute("/farmer-portal/orders")({ component: OrdersPage });

const TABS = ["all", "to-pack", "shipped"] as const;
type Tab = (typeof TABS)[number];

function OrdersPage() {
  const { data: farmer } = useFarmerProfile();
  const [tab, setTab] = useState<Tab>("all");
  const qc = useQueryClient();

  const { data: orders = [], isLoading } = useQuery({
    enabled: !!farmer?.slug,
    queryKey: ["farmer-orders", farmer?.slug],
    queryFn: async () => {
      // Fetch all orders from Firestore.
      // We will filter client-side because Firestore doesn't easily support 
      // querying inner elements of JSON arrays (items) directly without composite indices.
      // Client-side filtering is fast and robust for this scale.
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      
      // Keep only orders containing this farmer's products
      return (data ?? []).filter((o: any) => 
        o.items?.some((item: any) => item.farmer_slug === farmer?.slug)
      );
    },
  });

  const updateItemStatus = async (orderId: string, itemSlug: string, newStatus: string, orderData: any) => {
    const now = new Date().toISOString();
    
    // Update target item status
    const updatedItems = orderData.items.map((it: any) => {
      if (it.slug === itemSlug) {
        return { ...it, status: newStatus };
      }
      return it;
    });

    const farmerName = farmer?.full_name || "Farmer";
    const newHistory = [
      ...(orderData.tracking_history || []),
      {
        status: orderData.status,
        title: `Product ${newStatus === "packed" ? "Packed" : "In Transit"}`,
        description: `Item [${orderData.items.find((i: any) => i.slug === itemSlug)?.name}] marked as ${newStatus} by farmer ${farmerName}.`,
        timestamp: now,
      }
    ];

    const patch: any = {
      items: updatedItems,
      tracking_history: newHistory,
      updated_at: now,
    };

    // Auto-advance main order status if all items are packed by their farmers
    const allItemsPackedOrShipped = updatedItems.every((it: any) => it.status === "packed" || it.status === "shipped");
    if (allItemsPackedOrShipped && orderData.status === "confirmed") {
      patch.status = "packed";
      newHistory.push({
        status: "packed",
        title: "Order Fully Packed",
        description: "All products from this shipment are packed and ready for dispatch courier pickup.",
        timestamp: now,
      });
    }

    try {
      const { error } = await supabase.from("orders").update(patch).eq("id", orderId);
      if (error) throw error;
      toast.success(`Product marked as ${newStatus}!`);
      qc.invalidateQueries({ queryKey: ["farmer-orders"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to update item status");
    }
  };

  if (!farmer) return null;

  // Filter orders based on tabs
  const filtered = orders.filter((o: any) => {
    // get farmer's specific items in this order
    const farmerItems = o.items.filter((i: any) => i.farmer_slug === farmer.slug);
    if (tab === "to-pack") {
      return farmerItems.some((i: any) => i.status === "pending" || i.status === "confirmed");
    }
    if (tab === "shipped") {
      return farmerItems.every((i: any) => i.status === "packed" || i.status === "shipped" || i.status === "delivered");
    }
    return true;
  });

  // Calculate quick stats
  const totalIncomingItems = orders.reduce((acc: number, o: any) => {
    const farmerItems = o.items.filter((i: any) => i.farmer_slug === farmer.slug);
    return acc + farmerItems.reduce((s: number, i: any) => s + i.qty, 0);
  }, 0);

  const pendingPackCount = orders.filter((o: any) => 
    o.items.some((i: any) => i.farmer_slug === farmer.slug && (i.status === "pending" || i.status === "confirmed"))
  ).length;

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-semibold">Fulfillment Orders</h2>
          <p className="text-sm text-muted-foreground">Manage and pack incoming orders for your crops.</p>
        </div>

        {/* Stats */}
        <div className="flex gap-4 bg-background border border-border p-4 rounded-2xl shrink-0">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-subhead block font-semibold">Pending Packing</span>
            <span className="font-display text-lg font-bold text-warning block mt-0.5">{pendingPackCount} orders</span>
          </div>
          <div className="border-l border-border pl-4">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-subhead block font-semibold">Total Produce Units</span>
            <span className="font-display text-lg font-bold text-foreground block mt-0.5">{totalIncomingItems} units</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`font-subhead rounded-full px-4 py-1.5 text-xs capitalize font-semibold transition cursor-pointer border ${
              tab === t
                ? "bg-primary border-primary text-primary-foreground"
                : "bg-background border-border text-muted-foreground hover:bg-secondary/40"
            }`}
          >
            {t === "to-pack" ? "To Pack ⚠️" : t}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="grid place-items-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="grid place-items-center rounded-2xl border border-dashed border-border bg-background py-20 text-center">
          <ShoppingBag className="h-8 w-8 text-muted-foreground/30" />
          <p className="mt-4 max-w-sm text-sm text-muted-foreground font-subhead font-semibold">
            {orders.length === 0 
              ? "You don't have any incoming customer orders yet."
              : "No orders match your selected filter."}
          </p>
        </div>
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
            
            // Get only current farmer's items
            const farmerItems = o.items.filter((item: any) => item.farmer_slug === farmer.slug);

            return (
              <article
                key={o.id}
                className="rounded-2xl border border-border bg-background p-5 md:p-6 space-y-5 shadow-sm"
              >
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                  <div>
                    <span className="text-[10px] text-muted-foreground font-subhead uppercase tracking-wider">Order Reference</span>
                    <h3 className="font-display text-sm font-bold text-foreground mt-0.5">{orderId}</h3>
                  </div>
                  <div className="flex gap-4 text-xs font-subhead">
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Ordered Date</span>
                      <span className="font-medium text-foreground mt-0.5 block">{date}</span>
                    </div>
                    <div className="border-l border-border pl-4">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Fulfillment</span>
                      <span className="font-semibold text-primary mt-0.5 block uppercase tracking-wide">
                        {o.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Grid */}
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Products belonging to this farmer */}
                  <div className="space-y-3">
                    <p className="font-subhead text-[10px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1.5">
                      Produce to pack
                    </p>
                    <div className="space-y-2">
                      {farmerItems.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between border border-border rounded-xl p-3 bg-secondary/10">
                          <div className="flex items-center gap-3">
                            <img src={item.image} alt={item.name} className="h-10 w-10 rounded-lg object-cover border border-border" />
                            <div>
                              <p className="font-display font-medium text-xs text-foreground">{item.name}</p>
                              <p className="text-[9px] font-subhead text-muted-foreground mt-0.5">
                                Qty: <span className="font-bold text-foreground text-xs">{item.qty}</span> · {item.weight}
                              </p>
                            </div>
                          </div>
                          
                          {/* Item action */}
                          <div className="flex items-center gap-2 shrink-0">
                            {item.status === "pending" || item.status === "confirmed" ? (
                              <button
                                onClick={() => updateItemStatus(o.id, item.slug, "packed", o)}
                                className="font-subhead text-[10px] uppercase font-bold tracking-wider text-primary bg-primary/10 hover:bg-primary/20 px-2.5 py-1 rounded-full flex items-center gap-1 cursor-pointer transition border border-primary/15"
                              >
                                <PackageCheck className="h-3 w-3" /> Mark Packed
                              </button>
                            ) : item.status === "packed" ? (
                              <button
                                onClick={() => updateItemStatus(o.id, item.slug, "shipped", o)}
                                className="font-subhead text-[10px] uppercase font-bold tracking-wider text-foreground bg-accent hover:opacity-90 px-2.5 py-1 rounded-full flex items-center gap-1 cursor-pointer transition"
                              >
                                <Truck className="h-3 w-3" /> Ship Produce
                              </button>
                            ) : (
                              <span className="font-subhead text-[10px] uppercase font-bold text-success bg-success/10 border border-success/15 px-2.5 py-1 rounded-full flex items-center gap-1">
                                <Check className="h-3 w-3" /> {item.status}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Customer shipping summary */}
                  <div className="space-y-3">
                    <p className="font-subhead text-[10px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1.5">
                      Shipping recipient & route
                    </p>
                    <div className="rounded-xl border border-border bg-secondary/5 p-4 text-xs space-y-1.5">
                      <p className="font-semibold text-foreground flex items-center gap-1">
                        <User className="h-3.5 w-3.5 text-muted-foreground" /> {o.shipping_name || o.customer_name}
                      </p>
                      <p className="text-muted-foreground flex items-start gap-1">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                        <span>{o.shipping_address}</span>
                      </p>
                      {o.delivery_route && (
                        <p className="text-primary font-semibold mt-3 pt-2 border-t border-border/80">
                          Assigned Route: {o.delivery_route}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
