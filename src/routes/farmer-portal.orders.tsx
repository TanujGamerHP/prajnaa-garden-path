import { createFileRoute } from "@tanstack/react-router";
import { ShoppingBag } from "lucide-react";

export const Route = createFileRoute("/farmer-portal/orders")({ component: OrdersPage });

function OrdersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-semibold">Orders</h2>
        <p className="text-sm text-muted-foreground">Manage incoming orders for your produce.</p>
      </div>
      <div className="grid place-items-center rounded-2xl border border-dashed border-border bg-background py-20 text-center">
        <ShoppingBag className="h-8 w-8 text-muted-foreground" />
        <p className="mt-4 max-w-sm text-sm text-muted-foreground">
          You'll see customer orders here once the checkout flow is wired to your published products.
        </p>
      </div>
    </div>
  );
}
