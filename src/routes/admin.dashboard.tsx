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
      const [farmers, products, payouts, customers] = await Promise.all([
        supabase.from("farmer_profiles").select("id,status,full_name,village,state,created_at"),
        supabase.from("farmer_products").select("id,name,price,stock,status,category,farmer_id"),
        supabase.from("farmer_payouts").select("net_amount,status,settled_at,farmer_id"),
        supabase.from("profiles").select("id,created_at"),
      ]);
      if (farmers.error) throw farmers.error;
      if (products.error) throw products.error;
      if (payouts.error) throw payouts.error;
      if (customers.error) throw customers.error;
      return {
        farmers: farmers.data ?? [],
        products: products.data ?? [],
        payouts: payouts.data ?? [],
        customers: customers.data ?? [],
      };
    },
  });

  if (isLoading || !data) {
    return <div className="grid place-items-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  const approvedFarmers = data.farmers.filter((f) => f.status === "approved").length;
  const pendingFarmers = data.farmers.filter((f) => f.status === "pending").length;
  const publishedProducts = data.products.filter((p) => p.status === "published").length;
  const lifetimePayouts = data.payouts.filter((p) => p.status === "paid").reduce((s, p) => s + Number(p.net_amount), 0);
  const pendingPayouts = data.payouts.filter((p) => p.status !== "paid").reduce((s, p) => s + Number(p.net_amount), 0);
  const last7 = data.customers.filter((c) => new Date(c.created_at).getTime() > Date.now() - 7 * 864e5).length;

  // top farmers by paid payouts
  const earningsByFarmer = new Map<string, number>();
  data.payouts.filter((p) => p.status === "paid").forEach((p) => {
    earningsByFarmer.set(p.farmer_id, (earningsByFarmer.get(p.farmer_id) ?? 0) + Number(p.net_amount));
  });
  const topFarmers = [...earningsByFarmer.entries()]
    .map(([id, total]) => ({ farmer: data.farmers.find((f) => f.id === id), total }))
    .filter((x) => x.farmer)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  // top categories
  const byCat = new Map<string, number>();
  data.products.filter((p) => p.status === "published").forEach((p) => byCat.set(p.category, (byCat.get(p.category) ?? 0) + 1));
  const topCats = [...byCat.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const totalPub = Math.max(publishedProducts, 1);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-3xl font-semibold">Platform overview</h2>
        <p className="mt-1 text-sm text-muted-foreground">Live snapshot from the marketplace.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Approved farmers" value={String(approvedFarmers)} delta={pendingFarmers > 0 ? `${pendingFarmers} pending review` : "All caught up"} />
        <StatCard label="Live products" value={String(publishedProducts)} delta={`${data.products.length} total`} />
        <StatCard label="Customers" value={String(data.customers.length)} delta={`+${last7} this week`} />
        <StatCard label="Pending payouts" value={inr(pendingPayouts)} delta={`Lifetime paid ${inr(lifetimePayouts)}`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-background p-5">
          <h3 className="font-display text-lg font-semibold">Top farmers by earnings</h3>
          {topFarmers.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No paid settlements yet.</p>
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
                  <span className="font-subhead text-muted-foreground">{Math.round((n / totalPub) * 100)}%</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
