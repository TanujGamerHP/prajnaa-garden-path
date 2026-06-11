import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Loader2, Plus, Trash2, Star, CreditCard } from "lucide-react";
import { AccountPageHeader } from "@/components/account/page-header";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/account/payments")({
  component: PaymentsPage,
});

type Card = {
  id: string;
  nickname: string | null;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
};

const BRANDS = ["Visa", "Mastercard", "Amex", "Rupay", "Discover"] as const;
const schema = z.object({
  nickname: z.string().trim().max(40).optional().or(z.literal("")),
  brand: z.enum(BRANDS),
  last4: z.string().regex(/^\d{4}$/, "Enter the last 4 digits"),
  exp_month: z.coerce.number().int().min(1).max(12),
  exp_year: z.coerce.number().int().min(2024).max(2100),
  is_default: z.boolean(),
});

function PaymentsPage() {
  const { user } = useAuth();
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("payment_methods")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });
    setLoading(false);
    if (error) return toast.error(error.message);
    setCards((data ?? []) as Card[]);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const remove = async (id: string) => {
    if (!confirm("Remove this payment method?")) return;
    const { error } = await supabase.from("payment_methods").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Removed");
    load();
  };

  const setDefault = async (id: string) => {
    const { error } = await supabase
      .from("payment_methods")
      .update({ is_default: true })
      .eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <>
      <AccountPageHeader
        title="Payment methods"
        description="Saved card placeholders for faster checkout. We don't store full card numbers."
        action={
          <button
            onClick={() => setAdding(true)}
            className="font-subhead inline-flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-xs uppercase tracking-[0.14em] text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> Add card
          </button>
        }
      />

      {loading ? (
        <div className="grid place-items-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : cards.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <CreditCard className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="font-display mt-3 text-lg font-semibold">No saved cards</p>
          <p className="mt-1 text-sm text-muted-foreground">Add a card to check out in seconds.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {cards.map((c) => (
            <article
              key={c.id}
              className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-card to-card p-5"
            >
              <div className="flex items-start justify-between">
                <span className="font-subhead text-[11px] uppercase tracking-[0.18em] text-primary">
                  {c.brand}
                </span>
                {c.is_default && (
                  <span className="font-subhead inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-primary">
                    <Star className="h-3 w-3" /> Default
                  </span>
                )}
              </div>
              <p className="font-display mt-6 text-xl tracking-[0.2em]">•••• •••• •••• {c.last4}</p>
              <div className="mt-2 flex items-end justify-between text-xs text-muted-foreground">
                <span>{c.nickname || "Card"}</span>
                <span>
                  {String(c.exp_month).padStart(2, "0")}/{String(c.exp_year).slice(-2)}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {!c.is_default && (
                  <button
                    onClick={() => setDefault(c.id)}
                    className="font-subhead inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-background/80 px-3 text-xs uppercase tracking-[0.14em] hover:bg-secondary"
                  >
                    <Star className="h-3.5 w-3.5" /> Default
                  </button>
                )}
                <button
                  onClick={() => remove(c.id)}
                  className="font-subhead inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-background/80 px-3 text-xs uppercase tracking-[0.14em] text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Remove
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {adding && user && (
        <AddCardDialog
          userId={user.id}
          onClose={() => setAdding(false)}
          onSaved={() => {
            setAdding(false);
            load();
          }}
        />
      )}
    </>
  );
}

function AddCardDialog({
  userId,
  onClose,
  onSaved,
}: {
  userId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = schema.safeParse({
      nickname: fd.get("nickname") || "",
      brand: fd.get("brand"),
      last4: String(fd.get("card_number") || "").slice(-4),
      exp_month: fd.get("exp_month"),
      exp_year: fd.get("exp_year"),
      is_default: fd.get("is_default") === "on",
    });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);

    setSaving(true);
    const { error } = await supabase.from("payment_methods").insert({
      ...parsed.data,
      nickname: parsed.data.nickname || null,
      user_id: userId,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Card saved");
    onSaved();
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <form
        onSubmit={onSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-xl"
      >
        <h2 className="font-display text-xl font-semibold">Add card</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          We only keep the last 4 digits as a label. No full card data is stored.
        </p>
        <div className="mt-5 grid gap-4">
          <label className="block">
            <span className="font-subhead text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Brand
            </span>
            <select name="brand" required defaultValue="Visa" className="input-prj mt-2">
              {BRANDS.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="font-subhead text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Card number
            </span>
            <input
              name="card_number"
              required
              inputMode="numeric"
              pattern="\d{4,19}"
              placeholder="Last 4 digits used"
              className="input-prj mt-2"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="font-subhead text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                Exp month
              </span>
              <input
                name="exp_month"
                required
                type="number"
                min={1}
                max={12}
                className="input-prj mt-2"
              />
            </label>
            <label className="block">
              <span className="font-subhead text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                Exp year
              </span>
              <input
                name="exp_year"
                required
                type="number"
                min={2024}
                max={2100}
                className="input-prj mt-2"
              />
            </label>
          </div>
          <label className="block">
            <span className="font-subhead text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Nickname
            </span>
            <input name="nickname" placeholder="Personal Visa" className="input-prj mt-2" />
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="is_default" className="h-4 w-4 rounded border-border" />
            <span className="text-sm">Set as default</span>
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="font-subhead inline-flex h-10 items-center rounded-full border border-border px-4 text-xs uppercase tracking-[0.14em] hover:bg-secondary"
          >
            Cancel
          </button>
          <button
            disabled={saving}
            className="font-subhead inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-xs uppercase tracking-[0.14em] text-primary-foreground hover:opacity-90 disabled:opacity-60"
          >
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Save card
          </button>
        </div>
      </form>
    </div>
  );
}
