import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { MarketingLayout } from "@/components/marketing/layout";
import { orders } from "@/lib/mock/orders";
import { allProducts } from "@/lib/mock/products";
import { inr } from "@/lib/format";

const tabs = ["Orders", "Profile", "Addresses", "Wishlist"] as const;
type Tab = typeof tabs[number];

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [{ title: "Account — Prajnaa Farm" }, { name: "robots", content: "noindex" }],
  }),
  component: AccountPage,
});

function AccountPage() {
  const [tab, setTab] = useState<Tab>("Orders");
  return (
    <MarketingLayout>
      <div className="container-prj pt-12 md:pt-16">
        <p className="font-subhead text-xs uppercase tracking-[0.18em] text-primary">Account</p>
        <h1 className="font-display mt-2 text-4xl font-semibold md:text-5xl">Welcome back, Meera.</h1>

        <div className="mt-8 flex flex-wrap gap-2 border-b border-border">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`font-subhead -mb-px border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${
                tab === t ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mt-8">
          {tab === "Orders" && <OrdersTab />}
          {tab === "Profile" && <ProfileTab />}
          {tab === "Addresses" && <AddressesTab />}
          {tab === "Wishlist" && <WishlistTab />}
        </div>
      </div>
    </MarketingLayout>
  );
}

function OrdersTab() {
  return (
    <div className="space-y-4">
      {orders.slice(0, 5).map((o) => (
        <div key={o.id} className="rounded-2xl border border-border bg-background p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-subhead text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{o.date}</p>
              <p className="font-display mt-1 text-base font-medium">Order {o.id}</p>
            </div>
            <StatusPill status={o.status} />
          </div>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
            <p className="text-sm text-muted-foreground">{o.items.length} item(s) · {o.payment}</p>
            <p className="font-display text-lg font-semibold">{inr(o.total)}</p>
          </div>
        </div>
      ))}
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
  return <span className={`font-subhead rounded-full px-2.5 py-1 text-[11px] uppercase tracking-[0.12em] ${map[status] ?? "bg-secondary"}`}>{status}</span>;
}

function ProfileTab() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 max-w-2xl">
      {[
        ["Name", "Meera Sharma"],
        ["Email", "meera@example.com"],
        ["Phone", "+91 98765 43210"],
        ["Joined", "November 2025"],
      ].map(([k, v]) => (
        <div key={k} className="rounded-2xl border border-border bg-background p-5">
          <p className="font-subhead text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{k}</p>
          <p className="font-display mt-1 text-base">{v}</p>
        </div>
      ))}
    </div>
  );
}

function AddressesTab() {
  return (
    <div className="rounded-2xl border border-border bg-background p-6 max-w-2xl">
      <p className="font-subhead text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Default</p>
      <p className="font-display mt-2 text-lg font-medium">Meera Sharma</p>
      <p className="mt-1 text-sm text-muted-foreground">42, Indiranagar 1st Stage, Bengaluru, Karnataka — 560038</p>
      <p className="text-sm text-muted-foreground">+91 98765 43210</p>
    </div>
  );
}

function WishlistTab() {
  const items = allProducts.slice(0, 3);
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((p) => (
        <Link key={p.slug} to="/product/$slug" params={{ slug: p.slug }} className="flex gap-3 rounded-2xl border border-border bg-background p-3 hover:bg-secondary/50">
          <img src={p.image} alt={p.name} className="h-16 w-16 rounded-lg object-cover" />
          <div>
            <p className="font-display text-sm font-medium">{p.name}</p>
            <p className="font-subhead mt-1 text-xs text-muted-foreground">{inr(p.price)} · {p.weight}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
