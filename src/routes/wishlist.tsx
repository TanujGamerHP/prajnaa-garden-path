import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import { MarketingLayout } from "@/components/marketing/layout";
import { PageHero } from "@/components/marketing/page-hero";
import { Reveal } from "@/components/reveal";
import { allProducts } from "@/lib/mock/products";
import { inr } from "@/lib/format";
import { useCart } from "@/lib/cart-store";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/wishlist")({
  head: () => ({
    meta: [
      { title: "Wishlist — Prajnaa Farm" },
      { name: "description", content: "Your saved products at Prajnaa Farm." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WishlistPage,
});

function WishlistPage() {
  // Demo wishlist: first 4 products
  const [items, setItems] = useState(allProducts.slice(0, 4));
  const add = useCart((s) => s.add);

  return (
    <MarketingLayout>
      <PageHero
        eyebrow="Wishlist"
        title={<>Saved for <span className="text-primary">later.</span></>}
        subtitle="Products you've heart-marked. Move them to your cart when you're ready."
      />

      <section className="container-prj py-20">
        {items.length === 0 ? (
          <Reveal>
            <div className="mx-auto max-w-md rounded-3xl border border-border bg-background p-12 text-center">
              <Heart className="mx-auto h-8 w-8 text-muted-foreground" />
              <h2 className="font-display mt-5 text-2xl font-semibold">Nothing saved yet</h2>
              <p className="mt-2 text-sm text-muted-foreground">Browse the shop and tap the heart on anything you'd like to come back to.</p>
              <Link to="/shop" className="font-subhead mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:-translate-y-0.5 hover:shadow-lg transition-all">
                Browse the shop
              </Link>
            </div>
          </Reveal>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {items.map((p, i) => (
              <Reveal key={p.slug} delay={(i % 4) * 80}>
                <div className="group flex h-full flex-col rounded-2xl border border-border bg-background p-3 transition-shadow hover:shadow-[0_20px_50px_-20px_oklch(0.34_0.06_156_/_0.25)]">
                  <Link to="/product/$slug" params={{ slug: p.slug }} className="relative block overflow-hidden rounded-xl bg-secondary">
                    <img src={p.image} alt={p.name} className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                  </Link>
                  <div className="mt-4 flex flex-1 flex-col px-1 pb-1">
                    <Link to="/product/$slug" params={{ slug: p.slug }}>
                      <h3 className="font-display text-base font-medium leading-snug">{p.name}</h3>
                    </Link>
                    <p className="font-subhead mt-1 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{p.weight}</p>
                    <div className="mt-auto flex items-center justify-between pt-4">
                      <span className="font-display text-lg font-semibold">{inr(p.price)}</span>
                      <div className="flex items-center gap-1">
                        <button
                          aria-label={`Remove ${p.name} from wishlist`}
                          onClick={() => { setItems((s) => s.filter((x) => x.slug !== p.slug)); toast("Removed from wishlist"); }}
                          className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-secondary"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => { add({ slug: p.slug, name: p.name, image: p.image, price: p.price, weight: p.weight }); toast.success(`${p.name} added to cart`); }}
                          className="font-subhead inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition-all hover:-translate-y-0.5"
                        >
                          <ShoppingBag className="h-3.5 w-3.5" /> Add
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </section>
    </MarketingLayout>
  );
}
