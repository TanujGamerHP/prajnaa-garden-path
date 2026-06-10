import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/marketing/layout";
import { ProductCard } from "@/components/store/product-card";
import { categoryBySlug, categories } from "@/lib/mock/categories";
import { productsByCategory } from "@/lib/mock/products";

export const Route = createFileRoute("/category/$slug")({
  loader: ({ params }) => {
    const cat = categoryBySlug(params.slug);
    if (!cat) throw notFound();
    return { cat, items: productsByCategory(params.slug) };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.cat.name} — Prajnaa Farm` },
          { name: "description", content: `${loaderData.cat.description} Shop ${loaderData.cat.name.toLowerCase()} from verified Indian farmers.` },
          { property: "og:title", content: `${loaderData.cat.name} — Prajnaa Farm` },
          { property: "og:description", content: loaderData.cat.description },
          { property: "og:url", content: `/category/${loaderData.cat.slug}` },
        ]
      : [],
    links: loaderData ? [{ rel: "canonical", href: `/category/${loaderData.cat.slug}` }] : [],
  }),
  component: CategoryPage,
});

function CategoryPage() {
  const { cat, items } = Route.useLoaderData();
  return (
    <MarketingLayout>
      <div className="container-prj pt-12 md:pt-16">
        <p className="font-subhead text-xs uppercase tracking-[0.18em] text-primary">Category</p>
        <h1 className="font-display mt-2 text-4xl font-semibold md:text-5xl">{cat.name}</h1>
        <p className="mt-3 max-w-xl text-muted-foreground">{cat.description}</p>

        <div className="mt-8 flex flex-wrap gap-2">
          {categories.map((c) => (
            <Link
              key={c.slug}
              to="/category/$slug"
              params={{ slug: c.slug }}
              className={`font-subhead rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                c.slug === cat.slug ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-secondary"
              }`}
            >
              {c.name}
            </Link>
          ))}
        </div>

        {items.length === 0 ? (
          <div className="mt-16 rounded-2xl border border-border bg-secondary/50 p-12 text-center">
            <p className="font-display text-xl">No products in this category yet.</p>
            <p className="mt-2 text-sm text-muted-foreground">Check back soon — new harvests are listed weekly.</p>
          </div>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((p) => <ProductCard key={p.slug} product={p} />)}
          </div>
        )}
      </div>
    </MarketingLayout>
  );
}
