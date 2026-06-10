import { createFileRoute } from "@tanstack/react-router";
import { customers } from "@/lib/mock/orders";

export const Route = createFileRoute("/admin/customers")({
  component: AdminCustomers,
});

function AdminCustomers() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-3xl font-semibold">Customers</h2>
        <p className="mt-1 text-sm text-muted-foreground">{customers.length} registered customers.</p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-border bg-background">
        <table className="w-full text-sm">
          <thead className="bg-secondary/40">
            <tr className="font-subhead text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              <th className="px-5 py-3 text-left">Name</th>
              <th className="text-left">Email</th>
              <th className="text-left">Phone</th>
              <th className="text-right">Orders</th>
              <th className="px-5 text-right">Joined</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className="border-t border-border">
                <td className="px-5 py-4 font-medium">{c.name}</td>
                <td className="text-muted-foreground">{c.email}</td>
                <td className="text-muted-foreground">{c.phone}</td>
                <td className="text-right">{c.orders}</td>
                <td className="px-5 text-right text-muted-foreground">{c.joined}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
