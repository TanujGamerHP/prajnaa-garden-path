import { createFileRoute } from "@tanstack/react-router";
import { StatCard } from "@/components/dashboard/shell";
import { orders } from "@/lib/mock/orders";
import { inr } from "@/lib/format";

export const Route = createFileRoute("/admin/dashboard")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-3xl font-semibold">Platform overview</h2>
        <p className="mt-1 text-sm text-muted-foreground">Snapshot of the marketplace this week.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="GMV (week)" value={inr(totalRevenue * 14)} delta="+22% vs last week" />
        <StatCard label="Orders" value={String(orders.length * 14)} delta="+18%" />
        <StatCard label="Active farmers" value="124" delta="+3 this week" />
        <StatCard label="New customers" value="216" delta="+11%" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-background p-5">
          <h3 className="font-display text-lg font-semibold">Top farmers</h3>
          <ol className="mt-4 space-y-3 text-sm">
            {[
              ["Asha Patel", inr(48650)],
              ["Vikram Rao", inr(42180)],
              ["Ramesh Singh", inr(38420)],
              ["Lakshmi Devi", inr(31200)],
            ].map(([n, v], i) => (
              <li key={n} className="flex items-center gap-3">
                <span className="font-display w-6 text-muted-foreground">{i + 1}</span>
                <span className="flex-1 font-medium">{n}</span>
                <span className="font-subhead text-muted-foreground">{v}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="rounded-2xl border border-border bg-background p-5">
          <h3 className="font-display text-lg font-semibold">Top categories</h3>
          <ol className="mt-4 space-y-3 text-sm">
            {[
              ["Dry Fruits", "32%"],
              ["Spices", "21%"],
              ["Pickles", "16%"],
              ["Masalas", "12%"],
            ].map(([n, v]) => (
              <li key={n} className="flex items-center gap-3">
                <span className="flex-1 font-medium">{n}</span>
                <span className="font-subhead text-muted-foreground">{v}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
