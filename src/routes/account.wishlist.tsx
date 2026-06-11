import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Trash2, ShoppingCart } from "lucide-react";
import { AccountPageHeader } from "@/components/account/page-header";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { allProducts } from "@/lib/mock/products";
import { inr } from "@/lib/format";
import { useCart } from "@/lib/cart-store";

export const Route = createFileRoute("/account/wishlist")({
  component: WishlistPage,
});

function WishlistPage() {
  const { user } = useAuth();
  const [slugs, setSlugs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const addToCart = useCart((s) => s.add);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("wishlist_items")
      .select("product_slug, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setLoading(false);
    if (error) return toast.error(error.message);
    setSlugs((data ?? []).map((r: { product_slug: string }) => r.product_slug));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const remove = async (slug: string) => {
    if (!user) return;
    const { error } = await supabase
      .from("wishlist_items")
      .delete()
      .eq("user_id", user.id)
      .eq("product_slug", slug);
    if (error) return toast.error(error.message);
    setSlugs((prev) => prev.filter((s) => s !== slug));
  };

  const items = slugs
    .map((slug) => allProducts.find((p) => p.slug === slug))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  return (
    <>
      <AccountPageHeader
        title="Your wishlist"
        description="Saved items, synced across devices when you're signed in."
      />

      {loading ? (
        <div className="grid place-items-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <p className="font-display text-lg font-semibold">Nothing saved yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Tap the heart on any product to save it here.
          </p>
          <Link
            to="/shop"
            className="font-subhead mt-4 inline-flex h-10 items-center rounded-full bg-primary px-5 text-xs uppercase tracking-[0.14em] text-primary-foreground hover:opacity-90"
          >
            Browse the shop
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((p) => (
            <article
              key={p.slug}
              className="flex gap-4 rounded-2xl border border-border bg-card p-4"
            >
              <Link to="/product/$slug" params={{ slug: p.slug }} className="shrink-0">
                <img src={p.image} alt={p.name} className="h-24 w-24 rounded-xl object-cover" />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <Link
                  to="/product/$slug"
                  params={{ slug: p.slug }}
                  className="font-display truncate text-base font-medium hover:underline"
                >
                  {p.name}
                </Link>
                <p className="mt-0.5 text-xs text-muted-foreground">{p.weight}</p>
                <p className="font-display mt-2 text-lg font-semibold">{inr(p.price)}</p>
                <div className="mt-auto flex flex-wrap gap-2 pt-3">
                  <button
                    onClick={() => {
                      addToCart(
                        {
                          slug: p.slug,
                          name: p.name,
                          image: p.image,
                          price: p.price,
                          weight: p.weight,
                        },
                        1,
                      );
                      toast.success("Added to cart");
                    }}
                    className="font-subhead inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-3 text-xs uppercase tracking-[0.14em] text-primary-foreground hover:opacity-90"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" /> Add to cart
                  </button>
                  <button
                    onClick={() => remove(p.slug)}
                    className="font-subhead inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-xs uppercase tracking-[0.14em] text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
