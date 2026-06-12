import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { Search, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MarketingLayout } from "@/components/marketing/layout";
import { ProductCard } from "@/components/store/product-card";
import { allProducts } from "@/lib/mock/products";
import { categories } from "@/lib/mock/categories";
import { z } from "zod";

const shopSearchSchema = z.object({
  q: z.string().optional().catch(""),
  cat: z.string().optional().catch("all"),
});

export const Route = createFileRoute("/shop")({
  validateSearch: shopSearchSchema,
  head: () => ({
    meta: [
      { title: "Shop all — Prajnaa Farm" },
      {
        name: "description",
        content: "Browse all natural farm produce from verified Indian farmers.",
      },
      { property: "og:title", content: "Shop all — Prajnaa Farm" },
      {
        property: "og:description",
        content: "Browse all natural farm produce from verified Indian farmers.",
      },
      { property: "og:url", content: "/shop" },
    ],
    links: [{ rel: "canonical", href: "/shop" }],
  }),
  component: ShopPage,
});

function ShopPage() {
  const search = Route.useSearch();
  const [q, setQ] = useState(search.q || "");
  const [cat, setCat] = useState(search.cat || "all");

  // Sync state if URL changes
  useEffect(() => {
    if (search.q !== undefined) setQ(search.q);
    if (search.cat !== undefined) setCat(search.cat);
  }, [search.q, search.cat]);

  const [sort, setSort] = useState<"featured" | "price-asc" | "price-desc" | "rating">("featured");

  const { data: dbProducts = [], isLoading } = useQuery({
    queryKey: ["public-all-products"],
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
        .eq("status", "published");
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

  const combinedProducts = useMemo(() => {
    return [...allProducts, ...mappedDbProducts];
  }, [mappedDbProducts]);

  const items = useMemo(() => {
    let list = combinedProducts.filter((p) => (cat === "all" ? true : p.category === cat));
    if (q.trim()) {
      const t = q.toLowerCase();
      list = list.filter(
        (p) => p.name.toLowerCase().includes(t) || p.description.toLowerCase().includes(t),
      );
    }
    if (sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
    if (sort === "rating") list = [...list].sort((a, b) => b.rating - a.rating);
    return list;
  }, [q, cat, sort, combinedProducts]);

  return (
    <MarketingLayout>
      <div className="container-prj pt-12 md:pt-16">
        <p className="font-subhead text-xs uppercase tracking-[0.18em] text-primary">
          All products
        </p>
        <h1 className="font-display mt-2 text-4xl font-semibold md:text-5xl">Shop the harvest.</h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          {combinedProducts.length} products from {categories.length} categories.
        </p>

        <div className="mt-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search produce, spices, pickles…"
              className="font-subhead h-11 w-full rounded-full border border-border bg-background pl-10 pr-4 text-sm outline-none transition-colors focus:border-primary"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={cat}
              onChange={(e) => setCat(e.target.value)}
              className="font-subhead h-11 rounded-full border border-border bg-background px-4 text-sm outline-none focus:border-primary"
            >
              <option value="all">All categories</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              className="font-subhead h-11 rounded-full border border-border bg-background px-4 text-sm outline-none focus:border-primary"
            >
              <option value="featured">Featured</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="rating">Top rated</option>
            </select>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          <Chip active={cat === "all"} onClick={() => setCat("all")}>
            All
          </Chip>
          {categories.map((c) => (
            <Chip key={c.slug} active={cat === c.slug} onClick={() => setCat(c.slug)}>
              {c.name}
            </Chip>
          ))}
        </div>

        {items.length === 0 ? (
          <div className="mt-16 rounded-2xl border border-border bg-secondary/50 p-12 text-center">
            <p className="font-display text-xl">No products matched your search.</p>
            <button
              onClick={() => {
                setQ("");
                setCat("all");
              }}
              className="font-subhead mt-4 text-sm text-primary underline"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        )}

        <div className="mt-16 text-sm text-muted-foreground">
          Looking for a specific farmer?{" "}
          <Link to="/farmers" className="text-primary underline">
            Browse farmers
          </Link>
          .
        </div>
      </div>
    </MarketingLayout>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`font-subhead rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background hover:bg-secondary"
      }`}
    >
      {children}
    </button>
  );
}
