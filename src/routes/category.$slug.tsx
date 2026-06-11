import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
          {
            name: "description",
            content: `${loaderData.cat.description} Shop ${loaderData.cat.name.toLowerCase()} from verified Indian farmers.`,
          },
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
  const { cat, items: mockItems } = Route.useLoaderData();

  const { data: dbProducts = [], isLoading } = useQuery({
    queryKey: ["category-products", cat.slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("farmer_products")
        .select(`
          *,
          farmer_profiles:farmer_id (
            slug,
            full_name,
            village,
            state
          )
        `)
        .eq("status", "published")
        .eq("category", cat.slug);
      if (error) throw error;
      return data ?? [];
    },
  });

  const mappedDbProducts = useMemo(() => {
    return dbProducts.map((p: any) => ({
      slug: p.slug,
      name: p.name,
      category: p.category,
      farmerSlug: p.farmer_profiles?.slug || "lakshmi-devi",
      image: p.images?.[0] || "",
      price: Math.ceil(Number(p.price || 0) * 1.10), // Adding 10% commission
      weight: p.unit || "unit",
      rating: 4.8,
      reviews: 0,
      description: p.description || "",
      farmerName: p.farmer_profiles?.full_name,
      farmerLocation: p.farmer_profiles ? `${p.farmer_profiles.village}, ${p.farmer_profiles.state}` : undefined,
    }));
  }, [dbProducts]);

  const combinedItems = useMemo(() => {
    return [...mockItems, ...mappedDbProducts];
  }, [mockItems, mappedDbProducts]);
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
                c.slug === cat.slug
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background hover:bg-secondary"
              }`}
            >
              {c.name}
            </Link>
          ))}
        </div>

        {combinedItems.length === 0 ? (
          <div className="mt-16 rounded-2xl border border-border bg-secondary/50 p-12 text-center">
            <p className="font-display text-xl">No products in this category yet.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Check back soon — new harvests are listed weekly.
            </p>
          </div>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {combinedItems.map((p: any) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        )}
      </div>
    </MarketingLayout>
  );
}
