import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { StatCard } from "@/components/dashboard/shell";
import { supabase } from "@/integrations/supabase/client";
import { useFarmerProfile } from "@/lib/farmer/use-farmer";
import { inr } from "@/lib/format";

export const Route = createFileRoute("/farmer-portal/dashboard")({ component: FarmerDashboard });

function FarmerDashboard() {
  const { data: farmer } = useFarmerProfile();
  const farmerId = farmer?.id;

  const { data: products = [], isLoading: pLoading } = useQuery({
    enabled: !!farmerId,
    queryKey: ["farmer-products", farmerId],
    queryFn: async () => {
      const { data, error } = await supabase.from("farmer_products").select("*").eq("farmer_id", farmerId!);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: payouts = [] } = useQuery({
    enabled: !!farmerId,
    queryKey: ["farmer-payouts", farmerId],
    queryFn: async () => {
      const { data, error } = await supabase.from("farmer_payouts").select("*").eq("farmer_id", farmerId!).order("period_end", { ascending: false }).limit(3);
      if (error) throw error;
      return data ?? [];
    },
  });

  if (!farmer) return null;

  const active = products.filter((p) => p.status === "published").length;
  const lowStock = products.filter((p) => p.stock < 10);
  const nextPayout = payouts.find((p) => p.status !== "paid");
  const lifetime = payouts.filter((p) => p.status === "paid").reduce((s, p) => s + Number(p.net_amount), 0);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-3xl font-semibold">Good day, {farmer.full_name.split(" ")[0]}.</h2>
        <p className="mt-1 text-sm text-muted-foreground">Here's how your farm is doing today.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Lifetime earnings" value={inr(lifetime)} />
        <StatCard label="Active listings" value={String(active)} />
        <StatCard label="Total listings" value={String(products.length)} />
        <StatCard label="Next payout" value={nextPayout ? inr(Number(nextPayout.net_amount)) : "—"} delta={nextPayout ? `Settles ${new Date(nextPayout.period_end).toLocaleDateString()}` : "No pending payout"} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-background p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">Your products</h3>
            <Link to="/farmer-portal/products" className="font-subhead text-xs text-primary">Manage all</Link>
          </div>
          {pLoading ? (
            <div className="grid place-items-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : products.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-border p-8 text-center">
              <p className="text-sm text-muted-foreground">No products yet.</p>
              <Link to="/farmer-portal/products" className="font-subhead mt-3 inline-block rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground">Add your first product</Link>
            </div>
          ) : (
            <table className="mt-4 w-full text-sm">
              <thead>
                <tr className="font-subhead text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  <th className="py-2 text-left">Product</th><th className="text-left">Status</th><th className="text-right">Stock</th><th className="text-right">Price</th>
                </tr>
              </thead>
              <tbody>
                {products.slice(0, 6).map((p) => (
                  <tr key={p.id} className="border-t border-border">
                    <td className="py-3 font-medium">{p.name}</td>
                    <td className="capitalize text-muted-foreground">{p.status}</td>
                    <td className="text-right">{p.stock} {p.unit}</td>
                    <td className="text-right font-medium">{inr(Number(p.price))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-background p-5">
          <h3 className="font-display text-lg font-semibold">Low stock</h3>
          {lowStock.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">All listings well-stocked.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {lowStock.slice(0, 5).map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium">{p.name}</span>
                  <span className="text-destructive">{p.stock} left</span>
                </li>
              ))}
            </ul>
          )}
          <Link to="/farmer-portal/inventory" className="font-subhead mt-4 inline-block text-xs text-primary">Update inventory →</Link>
        </div>
      </div>
    </div>
  );
}
