import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { MarketingLayout } from "@/components/marketing/layout";
import { useCart, cartTotals } from "@/lib/cart-store";
import { inr } from "@/lib/format";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [{ title: "Checkout — Prajnaa Farm" }, { name: "robots", content: "noindex" }],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const items = useCart((s) => s.items);
  const clear = useCart((s) => s.clear);
  const { subtotal, shipping, total } = cartTotals(items);
  const navigate = useNavigate();
  const [payment, setPayment] = useState<"UPI" | "Card" | "COD">("UPI");
  const [placing, setPlacing] = useState(false);

  const onPlace = (e: React.FormEvent) => {
    e.preventDefault();
    setPlacing(true);
    setTimeout(() => {
      const orderId = `PRJ-${Math.floor(10000 + Math.random() * 89999)}`;
      clear();
      toast.success("Order placed!");
      navigate({ to: "/order-confirmation", search: { id: orderId } });
    }, 700);
  };

  if (items.length === 0) {
    return (
      <MarketingLayout>
        <div className="container-prj pt-12 md:pt-16">
          <h1 className="font-display text-3xl font-semibold">Your cart is empty.</h1>
          <p className="mt-2 text-muted-foreground">Add something before checking out.</p>
        </div>
      </MarketingLayout>
    );
  }

  return (
    <MarketingLayout>
      <div className="container-prj pt-12 md:pt-16">
        <h1 className="font-display text-4xl font-semibold md:text-5xl">Checkout</h1>
        <form onSubmit={onPlace} className="mt-10 grid gap-10 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            <section>
              <h2 className="font-display text-xl font-semibold">Contact</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Field label="Full name" required defaultValue="Meera Sharma" />
                <Field label="Phone" type="tel" required defaultValue="+91 98765 43210" />
                <Field label="Email" type="email" required className="sm:col-span-2" defaultValue="meera@example.com" />
              </div>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold">Shipping address</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Field label="Address line 1" required className="sm:col-span-2" defaultValue="42, Indiranagar 1st Stage" />
                <Field label="Address line 2" />
                <Field label="Landmark" />
                <Field label="City" required defaultValue="Bengaluru" />
                <Field label="State" required defaultValue="Karnataka" />
                <Field label="Pincode" required defaultValue="560038" />
              </div>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold">Payment</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {(["UPI", "Card", "COD"] as const).map((m) => (
                  <label key={m} className={`font-subhead flex cursor-pointer items-center gap-3 rounded-2xl border p-4 text-sm transition-colors ${payment === m ? "border-primary bg-primary/5" : "border-border bg-background hover:bg-secondary"}`}>
                    <input type="radio" name="pay" checked={payment === m} onChange={() => setPayment(m)} className="accent-[var(--primary)]" />
                    <span>{m === "COD" ? "Cash on delivery" : m === "UPI" ? "UPI" : "Card"}</span>
                  </label>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">Demo only — no payment will be charged.</p>
            </section>
          </div>

          <aside className="h-fit rounded-2xl border border-border bg-secondary/40 p-6">
            <h2 className="font-display text-xl font-semibold">Summary</h2>
            <ul className="mt-4 space-y-3">
              {items.map((i) => (
                <li key={i.slug} className="flex gap-3 text-sm">
                  <img src={i.image} alt={i.name} className="h-12 w-12 rounded-lg object-cover" />
                  <div className="flex-1">
                    <p className="font-subhead">{i.name}</p>
                    <p className="text-xs text-muted-foreground">Qty {i.qty} · {i.weight}</p>
                  </div>
                  <p className="font-subhead">{inr(i.price * i.qty)}</p>
                </li>
              ))}
            </ul>
            <dl className="mt-6 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd>{inr(subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Shipping</dt><dd>{shipping === 0 ? "Free" : inr(shipping)}</dd></div>
              <div className="my-2 h-px bg-border" />
              <div className="flex justify-between text-base"><dt className="font-display font-semibold">Total</dt><dd className="font-display font-semibold">{inr(total)}</dd></div>
            </dl>
            <button type="submit" disabled={placing} className="font-subhead mt-6 block w-full rounded-full bg-primary py-3 text-center text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60">
              {placing ? "Placing order…" : `Place order · ${inr(total)}`}
            </button>
          </aside>
        </form>
      </div>
    </MarketingLayout>
  );
}

function Field({ label, className = "", ...rest }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="font-subhead text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
      <input
        {...rest}
        className="font-subhead mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3.5 text-sm outline-none transition-colors focus:border-primary"
      />
    </label>
  );
}
