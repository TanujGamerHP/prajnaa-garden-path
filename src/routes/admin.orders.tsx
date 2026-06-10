import { createFileRoute } from "@tanstack/react-router";
import { orders } from "@/lib/mock/orders";
import { inr } from "@/lib/format";

const statusTone: Record<string, string> = {
  pending: "bg-warning/15 text-warning",
  packed: "bg-accent/15 text-accent",
  shipped: "bg-primary/10 text-primary",
  delivered: "bg-success/15 text-success",
  cancelled: "bg-destructive/15 text-destructive",
};

export const Route = createFileRoute("/admin/orders")({
  component: AdminOrders,
});

function AdminOrders() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-3xl font-semibold">Orders</h2>
        <p className="mt-1 text-sm text-muted-foreground">All platform orders.</p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-border bg-background">
        <table className="w-full text-sm">
          <thead className="bg-secondary/40">
            <tr className="font-subhead text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              <th className="px-5 py-3 text-left">Order</th>
              <th className="text-left">Date</th>
              <th className="text-left">Customer</th>
              <th className="text-left">Items</th>
              <th className="text-left">Payment</th>
              <th className="text-left">Status</th>
              <th className="px-5 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-t border-border">
                <td className="px-5 py-4 font-medium">{o.id}</td>
                <td className="text-muted-foreground">{o.date}</td>
                <td>{o.customer}</td>
                <td className="text-muted-foreground">{o.items.length}</td>
                <td className="text-muted-foreground">{o.payment}</td>
                <td><span className={`font-subhead rounded-full px-2.5 py-1 text-[11px] uppercase tracking-[0.1em] ${statusTone[o.status]}`}>{o.status}</span></td>
                <td className="px-5 text-right font-medium">{inr(o.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
