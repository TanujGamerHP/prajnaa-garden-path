import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, Leaf, MapPin, Loader2 } from "lucide-react";
import { MarketingLayout } from "@/components/marketing/layout";
import { ProductCard } from "@/components/store/product-card";
import { farmerBySlug } from "@/lib/mock/farmers";
import { productsByFarmer } from "@/lib/mock/products";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/farmer/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} — Prajnaa Farm` },
      { property: "og:title", content: `${params.slug} — Prajnaa Farm` },
    ],
    links: [{ rel: "canonical", href: `/farmer/${params.slug}` }],
  }),
  component: FarmerPage,
});

function FarmerPage() {
  const { slug } = Route.useParams();

  // Try DB first (approved farmers only — anon RLS allows reads of approved profiles)
  const { data: dbFarmer, isLoading } = useQuery({
    queryKey: ["public-farmer", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("farmer_profiles")
        .select(
          "id,user_id,slug,full_name,farm_name,village,district,state,pincode,farm_size_acres,years_farming,farming_method,crops,headline,story,cover_image_url,portrait_url,status,approved_at,created_at,updated_at",
        )
        .eq("slug", slug)
        .eq("status", "approved")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: dbProducts = [] } = useQuery({
    enabled: !!dbFarmer?.id,
    queryKey: ["public-farmer-products", dbFarmer?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("farmer_products")
        .select("*")
        .eq("farmer_id", dbFarmer!.id)
        .eq("status", "published");
      if (error) throw error;
      return data ?? [];
    },
  });

  if (isLoading) {
    return (
      <MarketingLayout>
        <div className="container-prj grid place-items-center py-32">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </MarketingLayout>
    );
  }

  if (dbFarmer) return <DbFarmerView farmer={dbFarmer} products={dbProducts} />;

  // Fallback to mock farmers
  const mock = farmerBySlug(slug);
  if (!mock) throw notFound();
  const mockProducts = productsByFarmer(slug);
  return <MockFarmerView farmer={mock} products={mockProducts} />;
}

function DbFarmerView({ farmer, products }: { farmer: any; products: any[] }) {
  return (
    <MarketingLayout>
      <section className="container-prj pt-10 md:pt-14">
        <div className="grid items-center gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <div className="overflow-hidden rounded-3xl bg-secondary">
              {farmer.portrait_url ? (
                <img src={farmer.portrait_url} alt={farmer.full_name} className="aspect-[4/5] w-full object-cover" />
              ) : (
                <div className="grid aspect-[4/5] w-full place-items-center bg-secondary">
                  <span className="font-display text-6xl text-muted-foreground">
                    {farmer.full_name.charAt(0)}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="md:col-span-7">
            <p className="font-subhead inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.18em] text-primary">
              <MapPin className="h-3 w-3" /> {farmer.village}, {farmer.state}
            </p>
            <h1 className="font-display mt-3 text-5xl font-semibold leading-[1.02] md:text-6xl">
              {farmer.farm_name}
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">by {farmer.full_name}</p>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="font-subhead inline-flex items-center gap-1.5 rounded-full bg-success/15 px-3 py-1 text-xs font-medium text-success">
                <ShieldCheck className="h-3.5 w-3.5" /> KYC verified
              </span>
              {farmer.farming_method && (
                <span className="font-subhead inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs capitalize">
                  <Leaf className="h-3.5 w-3.5" /> {farmer.farming_method}
                </span>
              )}
              {farmer.years_farming && (
                <span className="font-subhead rounded-full bg-secondary px-3 py-1 text-xs">
                  {farmer.years_farming} years farming
                </span>
              )}
            </div>

            <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-sm">
              {farmer.farm_size_acres && (
                <div>
                  <dt className="font-subhead text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Farm size</dt>
                  <dd className="font-display mt-1 text-lg font-medium">{farmer.farm_size_acres} acres</dd>
                </div>
              )}
              <div>
                <dt className="font-subhead text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Available products</dt>
                <dd className="font-display mt-1 text-lg font-medium">{products.length}</dd>
              </div>
            </dl>

            {(farmer.headline || farmer.story) && (
              <div className="mt-8 max-w-prose space-y-4 text-[15px] leading-relaxed text-foreground/85">
                {farmer.headline && <p className="font-display text-xl text-foreground">{farmer.headline}</p>}
                {farmer.story && <p>{farmer.story}</p>}
              </div>
            )}

            {farmer.crops && farmer.crops.length > 0 && (
              <div className="mt-6">
                <p className="font-subhead text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Crops</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {farmer.crops.map((c: string) => (
                    <span key={c} className="font-subhead rounded-full border border-border px-3 py-1 text-xs capitalize">{c}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="container-prj mt-20">
        <h2 className="font-display text-2xl font-semibold">Products from this farm</h2>
        {products.length === 0 ? (
          <p className="mt-4 text-muted-foreground">No active listings right now. Check back after the next harvest.</p>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((p) => (
              <div key={p.id} className="rounded-2xl border border-border bg-background overflow-hidden hover:shadow-md transition-shadow">
                <Link to="/product/$slug" params={{ slug: p.slug }}>
                  <div className="aspect-square bg-secondary">
                    {p.images?.[0] && <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover" />}
                  </div>
                  <div className="p-4">
                    <p className="font-display text-sm font-semibold">{p.name}</p>
                    <p className="font-subhead mt-1 text-xs text-muted-foreground capitalize">{p.category}</p>
                    <p className="font-display mt-2 text-base font-semibold">₹{Number(p.price).toFixed(0)} <span className="font-subhead text-xs text-muted-foreground">/ {p.unit}</span></p>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </MarketingLayout>
  );
}

function MockFarmerView({ farmer, products }: { farmer: any; products: any[] }) {
  return (
    <MarketingLayout>
      <section className="container-prj pt-10 md:pt-14">
        <div className="grid items-center gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <div className="overflow-hidden rounded-3xl bg-secondary">
              <img src={farmer.image} alt={farmer.name} width={800} height={1000} className="aspect-[4/5] w-full object-cover" />
            </div>
          </div>
          <div className="md:col-span-7">
            <p className="font-subhead text-xs uppercase tracking-[0.18em] text-primary">
              {farmer.village}, {farmer.state} · {farmer.region}
            </p>
            <h1 className="font-display mt-3 text-5xl font-semibold leading-[1.02] md:text-6xl">{farmer.name}</h1>
            <div className="mt-4">
              <span className="font-subhead inline-flex items-center gap-1.5 rounded-full bg-success/15 px-3 py-1 text-xs font-medium text-success">
                <ShieldCheck className="h-3.5 w-3.5" /> KYC verified
              </span>
            </div>
            <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-sm">
              <div>
                <dt className="font-subhead text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Experience</dt>
                <dd className="font-display mt-1 text-lg font-medium">{farmer.yearsExperience} years</dd>
              </div>
              <div>
                <dt className="font-subhead text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Method</dt>
                <dd className="font-display mt-1 text-lg font-medium">{farmer.method}</dd>
              </div>
              <div>
                <dt className="font-subhead text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Available products</dt>
                <dd className="font-display mt-1 text-lg font-medium">{products.length}</dd>
              </div>
            </dl>
            <div className="mt-8 max-w-prose space-y-4 text-[15px] leading-relaxed text-foreground/85">
              <p className="font-display text-xl text-foreground">{farmer.storyPreview}</p>
              <p>{farmer.story}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="container-prj mt-20">
        <h2 className="font-display text-2xl font-semibold">Upcoming harvests</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {farmer.upcomingHarvests.map((h: string) => (
            <div key={h} className="font-subhead rounded-2xl border border-dashed border-border bg-secondary/40 p-5 text-sm">
              {h}
            </div>
          ))}
        </div>
      </section>

      <section className="container-prj mt-20">
        <h2 className="font-display text-2xl font-semibold">Products from this farm</h2>
        {products.length === 0 ? (
          <p className="mt-4 text-muted-foreground">No active listings right now. Check back after the next harvest.</p>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((p: typeof products[number]) => <ProductCard key={p.slug} product={p} />)}
          </div>
        )}
      </section>
    </MarketingLayout>
  );
}
