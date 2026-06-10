import { createFileRoute } from "@tanstack/react-router";
import { StatCard } from "@/components/dashboard/shell";
import { orders } from "@/lib/mock/orders";
import { allProducts } from "@/lib/mock/products";
import { inr } from "@/lib/format";

export const Route = createFileRoute("/farmer-portal/dashboard")({
  component: FarmerDashboard,
});

function FarmerDashboard() {
  const recent = orders.slice(0, 5);
  const lowStock = allProducts.filter((p) => p.stock < 50).slice(0, 4);
  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-3xl font-semibold">Good morning, Asha.</h2>
        <p className="mt-1 text-sm text-muted-foreground">Here's how your farm performed this week.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Sales this month" value={inr(48650)} delta="+18% vs last month" />
        <StatCard label="Orders this week" value="32" delta="+4 vs last week" />
        <StatCard label="Active listings" value="6" />
        <StatCard label="Next payout" value={inr(18420)} delta="Settles Jul 8" deltaTone="up" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-background p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">Recent orders</h3>
            <a href="/farmer-portal/orders" className="font-subhead text-xs text-primary">View all</a>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="font-subhead text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  <th className="py-2 text-left">Order</th>
                  <th className="text-left">Customer</th>
                  <th className="text-left">Status</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((o) => (
                  <tr key={o.id} className="border-t border-border">
                    <td className="py-3 font-medium">{o.id}</td>
                    <td>{o.customer}</td>
                    <td className="capitalize text-muted-foreground">{o.status}</td>
                    <td className="text-right font-medium">{inr(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-background p-5">
          <h3 className="font-display text-lg font-semibold">Low stock</h3>
          <ul className="mt-4 space-y-3">
            {lowStock.map((p) => (
              <li key={p.slug} className="flex items-center gap-3">
                <img src={p.image} alt={p.name} className="h-10 w-10 rounded-lg object-cover" />
                <div className="flex-1">
                  <p className="font-subhead text-sm">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.stock} left</p>
                </div>
                <button className="font-subhead text-xs text-primary">Restock</button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
