import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search } from "lucide-react";
import { AccountPageHeader } from "@/components/account/page-header";
import { orders as mockOrders } from "@/lib/mock/orders";
import { inr } from "@/lib/format";

export const Route = createFileRoute("/account/orders")({
  component: OrdersList,
});

const FILTERS = ["All", "Pending", "Packed", "Shipped", "Delivered", "Cancelled"] as const;
type Filter = (typeof FILTERS)[number];

function OrdersList() {
  const [filter, setFilter] = useState<Filter>("All");
  const [query, setQuery] = useState("");

  const filtered = mockOrders.filter((o) => {
    if (filter !== "All" && o.status.toLowerCase() !== filter.toLowerCase()) return false;
    if (query && !o.id.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  return (
    <>
      <AccountPageHeader title="Your orders" description="Track shipments, view invoices, and reorder favorites." />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by order ID"
            className="input-prj pl-9"
            aria-label="Search orders"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`font-subhead rounded-full border px-3 py-1.5 text-xs uppercase tracking-[0.12em] transition-colors ${
                filter === f
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:bg-secondary"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-4">
          {filtered.map((o) => (
            <article key={o.id} className="rounded-2xl border border-border bg-card p-5">
              <header className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-subhead text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                    Placed {o.date} · {o.payment}
                  </p>
                  <h2 className="font-display mt-1 text-base font-medium">Order {o.id}</h2>
                </div>
                <StatusPill status={o.status} />
              </header>
              <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
                <p className="text-sm text-muted-foreground">{o.items.length} item(s)</p>
                <p className="font-display text-lg font-semibold">{inr(o.total)}</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  to="/orders/$id"
                  params={{ id: o.id }}
                  className="font-subhead inline-flex h-9 items-center rounded-full border border-border px-4 text-xs uppercase tracking-[0.14em] hover:bg-secondary"
                >
                  View details
                </Link>
                <Link
                  to="/track-order"
                  className="font-subhead inline-flex h-9 items-center rounded-full border border-border px-4 text-xs uppercase tracking-[0.14em] hover:bg-secondary"
                >
                  Track
                </Link>
                <button className="font-subhead inline-flex h-9 items-center rounded-full border border-border px-4 text-xs uppercase tracking-[0.14em] hover:bg-secondary">
                  Buy again
                </button>
                <button className="font-subhead inline-flex h-9 items-center rounded-full border border-border px-4 text-xs uppercase tracking-[0.14em] hover:bg-secondary">
                  Invoice
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
      <p className="font-display text-lg font-semibold">No orders match</p>
      <p className="mt-1 text-sm text-muted-foreground">Try a different filter or search term.</p>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-warning/15 text-warning",
    packed: "bg-accent/15 text-accent",
    shipped: "bg-primary/10 text-primary",
    delivered: "bg-success/15 text-success",
    cancelled: "bg-destructive/15 text-destructive",
  };
  return (
    <span
      className={`font-subhead rounded-full px-2.5 py-1 text-[11px] uppercase tracking-[0.12em] ${
        map[status] ?? "bg-secondary"
      }`}
    >
      {status}
    </span>
  );
}
