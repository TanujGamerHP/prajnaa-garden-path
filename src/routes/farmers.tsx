import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/marketing/layout";
import { FarmerCard } from "@/components/store/farmer-card";
import { farmers } from "@/lib/mock/farmers";

export const Route = createFileRoute("/farmers")({
  head: () => ({
    meta: [
      { title: "Our farmers — Prajnaa Farm" },
      { name: "description", content: "Meet the verified farmers behind every jar." },
      { property: "og:title", content: "Our farmers — Prajnaa Farm" },
      { property: "og:description", content: "Meet the verified farmers behind every jar." },
      { property: "og:url", content: "/farmers" },
    ],
    links: [{ rel: "canonical", href: "/farmers" }],
  }),
  component: FarmersPage,
});

function FarmersPage() {
  return (
    <MarketingLayout>
      <div className="container-prj pt-12 md:pt-16">
        <p className="font-subhead text-xs uppercase tracking-[0.18em] text-primary">Our farmers</p>
        <h1 className="font-display mt-2 text-4xl font-semibold md:text-5xl">The people behind your produce.</h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          A growing network of {farmers.length} farms across India. Every product on Prajnaa is traceable to one of these names.
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {farmers.map((f) => <FarmerCard key={f.slug} farmer={f} />)}
        </div>
      </div>
    </MarketingLayout>
  );
}
