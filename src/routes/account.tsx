import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Loader2, LogOut } from "lucide-react";
import { MarketingLayout } from "@/components/marketing/layout";
import { orders } from "@/lib/mock/orders";
import { allProducts } from "@/lib/mock/products";
import { inr } from "@/lib/format";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

const tabs = ["Orders", "Profile", "Addresses", "Wishlist"] as const;
type Tab = typeof tabs[number];

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
};

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [{ title: "Account — Prajnaa Farm" }, { name: "robots", content: "noindex" }],
  }),
  component: AccountPage,
});

function AccountPage() {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const [tab, setTab] = useState<Tab>("Orders");
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth/login", replace: true });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => setProfile(data as Profile | null));
  }, [user]);

  if (loading || !user) {
    return (
      <MarketingLayout>
        <div className="container-prj grid place-items-center py-32">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </MarketingLayout>
    );
  }

  const displayName = profile?.full_name || user.email?.split("@")[0] || "there";

  return (
    <MarketingLayout>
      <div className="container-prj pt-12 md:pt-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-subhead text-xs uppercase tracking-[0.18em] text-primary">Account</p>
            <h1 className="font-display mt-2 text-4xl font-semibold md:text-5xl">Welcome back, {displayName}.</h1>
          </div>
          <button
            onClick={async () => { await signOut(); toast.success("Signed out"); navigate({ to: "/" }); }}
            className="font-subhead inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs uppercase tracking-[0.14em] hover:bg-secondary"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>

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

        <div className="mt-8 pb-16">
          {tab === "Orders" && <OrdersTab />}
          {tab === "Profile" && <ProfileTab profile={profile} email={user.email ?? null} onSaved={setProfile} userId={user.id} />}
          {tab === "Addresses" && <AddressesTab profile={profile} onSaved={setProfile} userId={user.id} />}
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

const profileSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name").max(80),
  phone: z.string().trim().regex(/^\+?[1-9]\d{7,14}$/, "Use international format").or(z.literal("")).optional(),
});

function ProfileTab({ profile, email, userId, onSaved }: { profile: Profile | null; email: string | null; userId: string; onSaved: (p: Profile) => void }) {
  const [saving, setSaving] = useState(false);
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = profileSchema.safeParse({ full_name: fd.get("full_name"), phone: fd.get("phone") || "" });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setSaving(true);
    const { data, error } = await supabase
      .from("profiles")
      .upsert({ id: userId, full_name: parsed.data.full_name, phone: parsed.data.phone || null, email })
      .select()
      .single();
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    onSaved(data as Profile);
    toast.success("Profile updated");
  };
  return (
    <form onSubmit={onSubmit} className="grid max-w-2xl gap-4 sm:grid-cols-2">
      <Field label="Full name"><input name="full_name" defaultValue={profile?.full_name ?? ""} required className="input-prj" /></Field>
      <Field label="Email"><input value={email ?? ""} disabled className="input-prj opacity-70" /></Field>
      <Field label="Phone"><input name="phone" defaultValue={profile?.phone ?? ""} placeholder="+91…" className="input-prj" /></Field>
      <div className="sm:col-span-2">
        <button disabled={saving} className="font-subhead inline-flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save changes
        </button>
      </div>
    </form>
  );
}

function AddressesTab({ profile, userId, onSaved }: { profile: Profile | null; userId: string; onSaved: (p: Profile) => void }) {
  const [saving, setSaving] = useState(false);
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setSaving(true);
    const { data, error } = await supabase
      .from("profiles")
      .upsert({
        id: userId,
        address_line1: String(fd.get("address_line1") || "").trim() || null,
        address_line2: String(fd.get("address_line2") || "").trim() || null,
        city: String(fd.get("city") || "").trim() || null,
        state: String(fd.get("state") || "").trim() || null,
        postal_code: String(fd.get("postal_code") || "").trim() || null,
        country: String(fd.get("country") || "IN").trim() || "IN",
      })
      .select()
      .single();
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    onSaved(data as Profile);
    toast.success("Address saved");
  };
  return (
    <form onSubmit={onSubmit} className="grid max-w-2xl gap-4 sm:grid-cols-2">
      <Field label="Address line 1" full><input name="address_line1" defaultValue={profile?.address_line1 ?? ""} className="input-prj" /></Field>
      <Field label="Address line 2" full><input name="address_line2" defaultValue={profile?.address_line2 ?? ""} className="input-prj" /></Field>
      <Field label="City"><input name="city" defaultValue={profile?.city ?? ""} className="input-prj" /></Field>
      <Field label="State"><input name="state" defaultValue={profile?.state ?? ""} className="input-prj" /></Field>
      <Field label="Postal code"><input name="postal_code" defaultValue={profile?.postal_code ?? ""} className="input-prj" /></Field>
      <Field label="Country"><input name="country" defaultValue={profile?.country ?? "IN"} className="input-prj" /></Field>
      <div className="sm:col-span-2">
        <button disabled={saving} className="font-subhead inline-flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save address
        </button>
      </div>
    </form>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={`block ${full ? "sm:col-span-2" : ""}`}>
      <span className="font-subhead text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
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
