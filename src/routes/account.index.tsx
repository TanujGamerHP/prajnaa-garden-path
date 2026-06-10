import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ShoppingBag,
  Heart,
  MapPin,
  CreditCard,
  Bell,
  Star,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { AccountPageHeader } from "@/components/account/page-header";
import { orders as mockOrders } from "@/lib/mock/orders";
import { inr } from "@/lib/format";

export const Route = createFileRoute("/account/")({
  component: AccountOverview,
});

type Counts = { wishlist: number; addresses: number; payments: number; reviews: number };

function AccountOverview() {
  const { user } = useAuth();
  const [counts, setCounts] = useState<Counts>({ wishlist: 0, addresses: 0, payments: 0, reviews: 0 });
  const [fullName, setFullName] = useState<string>("");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [wl, addr, pm, rv, prof] = await Promise.all([
        supabase.from("wishlist_items").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("addresses").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("payment_methods").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("product_reviews").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
      ]);
      setCounts({
        wishlist: wl.count ?? 0,
        addresses: addr.count ?? 0,
        payments: pm.count ?? 0,
        reviews: rv.count ?? 0,
      });
      setFullName((prof.data as { full_name?: string } | null)?.full_name ?? "");
    })();
  }, [user]);

  const displayName = fullName || user?.email?.split("@")[0] || "there";
  const recent = mockOrders.slice(0, 3);

  const cards = [
    { to: "/account/orders", label: "Your orders", icon: ShoppingBag, value: `${mockOrders.length} total`, hint: "Track, return, or buy again" },
    { to: "/account/wishlist", label: "Wishlist", icon: Heart, value: `${counts.wishlist} saved`, hint: "Items you love" },
    { to: "/account/addresses", label: "Addresses", icon: MapPin, value: `${counts.addresses} on file`, hint: "Manage delivery addresses" },
    { to: "/account/payments", label: "Payment methods", icon: CreditCard, value: `${counts.payments} on file`, hint: "Add or remove cards" },
    { to: "/account/reviews", label: "Your reviews", icon: Star, value: `${counts.reviews} written`, hint: "Edit your ratings" },
    { to: "/account/notifications", label: "Notifications", icon: Bell, value: "Preferences", hint: "Email & SMS settings" },
  ] as const;

  return (
    <>
      <AccountPageHeader
        eyebrow="Account"
        title={`Welcome back, ${displayName}.`}
        description="Manage your orders, addresses, payments, and personal information."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(({ to, label, icon: Icon, value, hint }) => (
          <Link
            key={to}
            to={to}
            className="group flex flex-col rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40 hover:bg-card/80"
          >
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-primary/10 p-2 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </div>
            <p className="font-display mt-4 text-base font-semibold">{label}</p>
            <p className="mt-1 text-sm text-muted-foreground">{value}</p>
            <p className="mt-3 text-xs text-muted-foreground">{hint}</p>
          </Link>
        ))}
      </div>

      <section className="mt-10">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="font-display text-xl font-semibold">Recent orders</h2>
          <Link to="/account/orders" className="text-xs font-medium text-primary hover:underline">
            View all
          </Link>
        </div>
        <div className="space-y-3">
          {recent.map((o) => (
            <Link
              key={o.id}
              to="/orders/$id"
              params={{ id: o.id }}
              className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-secondary/40"
            >
              <div>
                <p className="font-subhead text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  {o.date} · {o.status}
                </p>
                <p className="font-display mt-1 text-sm font-medium">Order {o.id}</p>
                <p className="text-xs text-muted-foreground">{o.items.length} item(s) · {o.payment}</p>
              </div>
              <p className="font-display text-base font-semibold">{inr(o.total)}</p>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
