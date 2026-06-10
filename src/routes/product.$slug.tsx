import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { Minus, Plus, Star, Truck, ShieldCheck, Sprout } from "lucide-react";
import { toast } from "sonner";
import { MarketingLayout } from "@/components/marketing/layout";
import { ProductCard } from "@/components/store/product-card";
import { productBySlug, productsByCategory } from "@/lib/mock/products";
import { farmerBySlug } from "@/lib/mock/farmers";
import { productReviews } from "@/lib/mock/reviews";
import { inr } from "@/lib/format";
import { useCart } from "@/lib/cart-store";

export const Route = createFileRoute("/product/$slug")({
  loader: ({ params }) => {
    const product = productBySlug(params.slug);
    if (!product) throw notFound();
    return { product, farmer: farmerBySlug(product.farmerSlug)!, related: productsByCategory(product.category).filter((p) => p.slug !== product.slug).slice(0, 4) };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.product.name} — Prajnaa Farm` },
          { name: "description", content: loaderData.product.description },
          { property: "og:title", content: `${loaderData.product.name} — Prajnaa Farm` },
          { property: "og:description", content: loaderData.product.description },
          { property: "og:type", content: "product" },
          { property: "og:image", content: loaderData.product.image },
          { property: "og:url", content: `/product/${loaderData.product.slug}` },
        ]
      : [],
    links: loaderData ? [{ rel: "canonical", href: `/product/${loaderData.product.slug}` }] : [],
    scripts: loaderData
      ? [{
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: loaderData.product.name,
            description: loaderData.product.description,
            image: loaderData.product.image,
            brand: { "@type": "Brand", name: "Prajnaa Farm" },
            offers: { "@type": "Offer", priceCurrency: "INR", price: loaderData.product.price, availability: "https://schema.org/InStock" },
            aggregateRating: { "@type": "AggregateRating", ratingValue: loaderData.product.rating, reviewCount: loaderData.product.reviews },
          }),
        }]
      : [],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { product, farmer, related } = Route.useLoaderData();
  const [qty, setQty] = useState(1);
  const add = useCart((s) => s.add);

  return (
    <MarketingLayout>
      <div className="container-prj pt-10 md:pt-14">
        <nav className="font-subhead mb-6 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <span>/</span>
          <Link to="/shop" className="hover:text-foreground">Shop</Link>
          <span>/</span>
          <Link to="/category/$slug" params={{ slug: product.category }} className="hover:text-foreground capitalize">{product.category.replace("-", " ")}</Link>
          <span>/</span>
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="grid gap-10 md:grid-cols-2 md:gap-14">
          <div className="overflow-hidden rounded-3xl bg-secondary">
            <img src={product.image} alt={product.name} width={800} height={800} className="aspect-square w-full object-cover" />
          </div>
          <div>
            <p className="font-subhead text-xs uppercase tracking-[0.18em] text-primary capitalize">{product.category.replace("-", " ")}</p>
            <h1 className="font-display mt-2 text-4xl font-semibold leading-[1.05] md:text-5xl">{product.name}</h1>
            <div className="mt-3 flex items-center gap-2 text-sm">
              <div className="flex items-center gap-1 text-accent">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < Math.round(product.rating) ? "fill-accent" : "opacity-30"}`} />
                ))}
              </div>
              <span className="font-subhead">{product.rating}</span>
              <span className="text-muted-foreground">({product.reviews} reviews)</span>
            </div>

            <div className="mt-6 flex items-end gap-3">
              <span className="font-display text-3xl font-semibold">{inr(product.price)}</span>
              {product.mrp && product.mrp > product.price && (
                <span className="text-base text-muted-foreground line-through">{inr(product.mrp)}</span>
              )}
              <span className="font-subhead text-sm text-muted-foreground">/ {product.weight}</span>
            </div>

            <p className="mt-6 max-w-prose text-[15px] leading-relaxed text-foreground/80">{product.description}</p>

            <div className="mt-6 flex flex-wrap gap-2">
              {product.badges?.map((b: string) => (
                <span key={b} className="font-subhead rounded-full bg-secondary px-3 py-1 text-[11px] uppercase tracking-[0.12em] text-foreground/75">
                  {b}
                </span>
              ))}
            </div>

            <div className="mt-8 flex items-center gap-3">
              <div className="flex h-12 items-center rounded-full border border-border">
                <button onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Decrease" className="grid h-12 w-12 place-items-center text-muted-foreground hover:text-foreground"><Minus className="h-4 w-4" /></button>
                <span className="font-subhead w-8 text-center text-sm">{qty}</span>
                <button onClick={() => setQty(qty + 1)} aria-label="Increase" className="grid h-12 w-12 place-items-center text-muted-foreground hover:text-foreground"><Plus className="h-4 w-4" /></button>
              </div>
              <button
                onClick={() => {
                  add({ slug: product.slug, name: product.name, image: product.image, price: product.price, weight: product.weight }, qty);
                  toast.success(`${product.name} added to cart`);
                }}
                className="font-subhead h-12 flex-1 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                Add to cart
              </button>
              <Link
                to="/checkout"
                onClick={() => add({ slug: product.slug, name: product.name, image: product.image, price: product.price, weight: product.weight }, qty)}
                className="font-subhead h-12 inline-flex items-center justify-center rounded-full border border-border px-6 text-sm font-medium transition-colors hover:bg-secondary"
              >
                Buy now
              </Link>
            </div>

            <ul className="mt-8 grid gap-3 sm:grid-cols-3">
              <li className="font-subhead flex items-center gap-2 text-xs text-muted-foreground"><Truck className="h-4 w-4 text-primary" /> Free shipping above ₹999</li>
              <li className="font-subhead flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4 text-primary" /> Quality guarantee</li>
              <li className="font-subhead flex items-center gap-2 text-xs text-muted-foreground"><Sprout className="h-4 w-4 text-primary" /> Naturally grown</li>
            </ul>

            {/* Farmer card */}
            <Link
              to="/farmer/$slug"
              params={{ slug: farmer.slug }}
              className="mt-8 flex items-center gap-4 rounded-2xl border border-border bg-secondary/50 p-4 transition-colors hover:bg-secondary"
            >
              <img src={farmer.image} alt={farmer.name} className="h-14 w-14 rounded-full object-cover" />
              <div className="flex-1">
                <p className="font-subhead text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Grown by</p>
                <p className="font-display text-base font-medium">{farmer.name}</p>
                <p className="text-xs text-muted-foreground">{farmer.village}, {farmer.state} · {farmer.method}</p>
              </div>
              <span className="font-subhead text-xs text-primary">Read story →</span>
            </Link>
          </div>
        </div>

        {/* Reviews */}
        <section className="mt-20">
          <h2 className="font-display text-2xl font-semibold">Reviews</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {productReviews.map((r) => (
              <figure key={r.id} className="rounded-2xl border border-border bg-background p-5">
                <div className="flex items-center gap-0.5 text-accent">
                  {Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-accent" />)}
                </div>
                <blockquote className="mt-3 text-sm text-foreground/85">"{r.text}"</blockquote>
                <figcaption className="font-subhead mt-4 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{r.author} · {r.location}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-20">
            <h2 className="font-display text-2xl font-semibold">You may also like</h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((p: typeof related[number]) => <ProductCard key={p.slug} product={p} />)}
            </div>
          </section>
        )}
      </div>
    </MarketingLayout>
  );
}
