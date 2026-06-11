import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
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
  const { data: dbFarmers = [] } = useQuery({
    queryKey: ["public-all-farmers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("farmer_profiles")
        .select("id,full_name,farm_name,village,state,crops,headline,story,portrait_url,slug,years_farming,farming_method")
        .eq("status", "approved");
      if (error) throw error;
      return data ?? [];
    },
  });

  const mappedDbFarmers = useMemo(() => {
    return dbFarmers.map((f: any) => ({
      slug: f.slug || "unknown",
      name: f.full_name,
      image: f.portrait_url || "",
      village: f.village || "India",
      state: f.state || "Farm",
      region: "Local Farm",
      yearsExperience: f.years_farming || 0,
      method: f.farming_method || "Natural Farming",
      storyPreview: f.headline || "",
      story: f.story || "",
      upcomingHarvests: f.crops || [],
      productSlugs: [],
    }));
  }, [dbFarmers]);

  const combinedFarmers = useMemo(() => {
    return [...farmers, ...mappedDbFarmers];
  }, [mappedDbFarmers]);

  return (
    <MarketingLayout>
      <div className="container-prj pt-12 md:pt-16">
        <p className="font-subhead text-xs uppercase tracking-[0.18em] text-primary">Our farmers</p>
        <h1 className="font-display mt-2 text-4xl font-semibold md:text-5xl">
          The people behind your produce.
        </h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          A growing network of {combinedFarmers.length} farms across India. Every product on Prajnaa is
          traceable to one of these names.
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {combinedFarmers.map((f) => (
            <FarmerCard key={f.slug} farmer={f as any} />
          ))}
        </div>
      </div>
    </MarketingLayout>
  );
}
