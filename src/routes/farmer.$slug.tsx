import { createFileRoute, notFound } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/marketing/layout";
import { ProductCard } from "@/components/store/product-card";
import { farmerBySlug } from "@/lib/mock/farmers";
import { productsByFarmer } from "@/lib/mock/products";

export const Route = createFileRoute("/farmer/$slug")({
  loader: ({ params }) => {
    const farmer = farmerBySlug(params.slug);
    if (!farmer) throw notFound();
    return { farmer, products: productsByFarmer(params.slug) };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.farmer.name} — Prajnaa Farm` },
          { name: "description", content: loaderData.farmer.storyPreview },
          { property: "og:title", content: `${loaderData.farmer.name} — Prajnaa Farm` },
          { property: "og:description", content: loaderData.farmer.storyPreview },
          { property: "og:image", content: loaderData.farmer.image },
          { property: "og:type", content: "profile" },
          { property: "og:url", content: `/farmer/${loaderData.farmer.slug}` },
        ]
      : [],
    links: loaderData ? [{ rel: "canonical", href: `/farmer/${loaderData.farmer.slug}` }] : [],
  }),
  component: FarmerPage,
});

function FarmerPage() {
  const { farmer, products } = Route.useLoaderData();
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
          {farmer.upcomingHarvests.map((h) => (
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
            {products.map((p) => <ProductCard key={p.slug} product={p} />)}
          </div>
        )}
      </section>
    </MarketingLayout>
  );
}
