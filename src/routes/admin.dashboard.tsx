import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { StatCard } from "@/components/dashboard/shell";
import { supabase } from "@/integrations/supabase/client";
import { inr } from "@/lib/format";

export const Route = createFileRoute("/admin/dashboard")({ component: AdminDashboard });

function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const [farmers, products, payouts, customers, orders, notifications] = await Promise.all([
        supabase.from("farmer_profiles").select("id,status,full_name,village,state,created_at"),
        supabase.from("farmer_products").select("id,name,price,stock,status,category,farmer_id"),
        supabase.from("farmer_payouts").select("net_amount,status,settled_at,farmer_id"),
        supabase.from("profiles").select("id,created_at"),
        supabase.from("orders").select("id,total,subtotal,status,payment_status,created_at,items"),
        supabase.from("system_notifications").select("*").order("created_at", { ascending: false }).limit(10),
      ]);
      if (farmers.error) throw farmers.error;
      if (products.error) throw products.error;
      if (payouts.error) throw payouts.error;
      if (customers.error) throw customers.error;
      if (orders.error) throw orders.error;

      const notificationsData = notifications.error ? [] : (notifications.data ?? []);
      return {
        farmers: farmers.data ?? [],
        products: products.data ?? [],
        payouts: payouts.data ?? [],
        customers: customers.data ?? [],
        orders: orders.data ?? [],
        notifications: notificationsData,
      };
    },
  });

  if (isLoading || !data) {
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const approvedFarmers = data.farmers.filter((f: any) => f.status === "approved").length;
  const pendingFarmers = data.farmers.filter((f: any) => f.status === "pending").length;
  const publishedProducts = data.products.filter((p: any) => p.status === "published").length;
  
  // Calculate dynamic sales and payouts from orders (excluding cancelled orders)
  const activeOrders = data.orders.filter((o: any) => o.status !== "cancelled");
  
  // Platform Lifetime Revenue (Sum of total of all non-cancelled orders)
  const lifetimeSales = activeOrders.reduce((s: number, o: any) => s + Number(o.total || 0), 0);
  
  // Completed/Paid Revenue (Sum of total of paid non-cancelled orders)
  const paidSales = activeOrders
    .filter((o: any) => o.payment_status === "paid")
    .reduce((s: number, o: any) => s + Number(o.total || 0), 0);
    
  // Pending Revenue (COD orders or pending payment orders)
  const pendingSales = activeOrders
    .filter((o: any) => o.payment_status === "pending" || o.payment_status === "failed")
    .reduce((s: number, o: any) => s + Number(o.total || 0), 0);

  const last7 = data.customers.filter(
    (c: any) => new Date(c.created_at).getTime() > Date.now() - 7 * 864e5,
  ).length;

  // top farmers by real-time order earnings (excluding cancelled orders)
  const earningsByFarmer = new Map<string, number>();
  activeOrders.forEach((o: any) => {
    (o.items || []).forEach((item: any) => {
      const farmerId = item.farmer_id || "farmer_1";
      const itemRevenue = Number(item.price || 0) * Number(item.qty || 1);
      earningsByFarmer.set(
        farmerId,
        (earningsByFarmer.get(farmerId) ?? 0) + itemRevenue
      );
    });
  });

  const topFarmers = [...earningsByFarmer.entries()]
    .map(([id, total]) => ({ farmer: data.farmers.find((f: any) => f.id === id), total }))
    .filter((x: any) => x.farmer)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  // top categories
  const byCat = new Map<string, number>();
  data.products
    .filter((p: any) => p.status === "published")
    .forEach((p: any) => byCat.set(p.category, (byCat.get(p.category) ?? 0) + 1));
  const topCats = [...byCat.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const totalPub = Math.max(publishedProducts, 1);

  return (
    <div className="space-y-8 animate-fade-up">
      <div>
        <h2 className="font-display text-3xl font-semibold">Platform overview</h2>
        <p className="mt-1 text-sm text-muted-foreground">Live snapshot from the marketplace.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Lifetime sales"
          value={inr(lifetimeSales)}
          delta={`${activeOrders.length} active orders`}
        />
        <StatCard
          label="Paid revenue"
          value={inr(paidSales)}
          delta={`Signature verified`}
        />
        <StatCard
          label="Pending revenue"
          value={inr(pendingSales)}
          delta={`COD & pending capture`}
        />
        <StatCard
          label="Approved farmers"
          value={String(approvedFarmers)}
          delta={pendingFarmers > 0 ? `${pendingFarmers} pending review` : "All caught up"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Span (2 Columns): Farmers & Category Stats */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-border bg-background p-5">
            <h3 className="font-display text-lg font-semibold">Top farmers by earnings</h3>
            {topFarmers.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">No active sales yet.</p>
            ) : (
              <ol className="mt-4 space-y-3 text-sm">
                {topFarmers.map(({ farmer, total }, i) => (
                  <li key={farmer!.id} className="flex items-center gap-3">
                    <span className="font-display w-6 text-muted-foreground">{i + 1}</span>
                    <span className="flex-1 font-medium">{farmer!.full_name}</span>
                    <span className="font-subhead text-muted-foreground">{inr(total)}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-background p-5">
            <h3 className="font-display text-lg font-semibold">Top categories</h3>
            {topCats.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">No published products yet.</p>
            ) : (
              <ol className="mt-4 space-y-3 text-sm">
                {topCats.map(([cat, n]) => (
                  <li key={cat} className="flex items-center gap-3">
                    <span className="flex-1 font-medium capitalize">{cat.replace(/-/g, " ")}</span>
                    <span className="font-subhead text-muted-foreground">
                      {Math.round((n / totalPub) * 100)}%
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>

        {/* Right Span (1 Column): Live Operations Feed */}
        <div className="rounded-2xl border border-border bg-background p-5 flex flex-col h-fit">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <h3 className="font-display text-lg font-semibold">Live Operations Feed</h3>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Real-time platform activity log.</p>

          {data.notifications.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-xs text-muted-foreground">No operations alerts recorded yet.</p>
            </div>
          ) : (
            <div className="mt-4 space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {data.notifications.map((n: any) => {
                const dateStr = n.created_at ? new Date(n.created_at).toLocaleTimeString("en-IN") : "";
                const isKyc = n.type === "farmer_kyc_submission";
                const isCancelled = n.type === "order_cancelled";
                return (
                  <div key={n.id} className="p-3 bg-secondary/20 rounded-xl border border-border/40 text-xs space-y-1.5 hover:bg-secondary/45 transition">
                    <div className="flex justify-between items-center">
                      <span className={`font-subhead text-[8px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full border ${
                        isKyc 
                          ? "bg-primary/10 text-primary border-primary/20" 
                          : isCancelled 
                            ? "bg-destructive/10 text-destructive border-destructive/20" 
                            : "bg-success/10 text-success border-success/20"
                      }`}>
                        {isKyc ? "KYC SUBMISSION" : isCancelled ? "CANCELLED" : "NEW ORDER"}
                      </span>
                      <span className="text-[9px] text-muted-foreground font-subhead">{dateStr}</span>
                    </div>
                    <p className="font-display font-semibold text-foreground">{n.title}</p>
                    <p className="text-[11px] text-muted-foreground leading-normal">{n.message}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
