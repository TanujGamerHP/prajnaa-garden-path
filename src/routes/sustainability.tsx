import { createFileRoute } from "@tanstack/react-router";
import { Leaf, Droplets, Recycle, Wind, HandHeart, Sprout } from "lucide-react";
import { MarketingLayout } from "@/components/marketing/layout";
import { PageHero } from "@/components/marketing/page-hero";
import { Reveal } from "@/components/reveal";

const pillars = [
  {
    icon: Leaf,
    t: "Naturally grown",
    d: "We work only with farmers using natural and regenerative practices — no synthetic inputs, no shortcuts.",
  },
  {
    icon: Droplets,
    t: "Water-aware sourcing",
    d: "Crops are matched to their climate. We don't move water-thirsty crops to rain-fed regions.",
  },
  {
    icon: Recycle,
    t: "Compostable packs",
    d: "Our jars are reusable glass. Our pouches are home-compostable. Our cartons are 100% recycled paper.",
  },
  {
    icon: Wind,
    t: "Lower-carbon logistics",
    d: "Surface shipping by default. Air-freight only when freshness genuinely demands it.",
  },
  {
    icon: HandHeart,
    t: "Fair farmer payout",
    d: "78 paise of every rupee, on average, goes back to the farmer — versus 18 paise in conventional retail.",
  },
  {
    icon: Sprout,
    t: "Soil-first contracts",
    d: "We pay growers for crop rotation, cover-cropping and biodiversity — not just yield.",
  },
];

const metrics = [
  { k: "78%", v: "Of revenue paid to farmers" },
  { k: "92%", v: "Pack materials compostable / recycled" },
  { k: "0", v: "Synthetic preservatives, ever" },
  { k: "−41%", v: "Plastic per order vs 2024" },
];

export const Route = createFileRoute("/sustainability")({
  head: () => ({
    meta: [
      { title: "Sustainability — Prajnaa Farm" },
      {
        name: "description",
        content: "How we grow, source, pack, and ship — with the soil first.",
      },
      { property: "og:title", content: "Sustainability — Prajnaa Farm" },
      {
        property: "og:description",
        content: "Soil-first sourcing, compostable packs, fair farmer payouts.",
      },
    ],
  }),
  component: SustainabilityPage,
});

function SustainabilityPage() {
  return (
    <MarketingLayout>
      <PageHero
        eyebrow="Sustainability"
        title={
          <>
            If the soil is well, <span className="text-primary">we all are.</span>
          </>
        }
        subtitle="Six pillars guide every product on Prajnaa. They are not aspirations. They are the rules we ship by."
      />

      <section className="container-prj py-20">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {pillars.map((p, i) => (
            <Reveal key={p.t} delay={(i % 3) * 80}>
              <div className="group relative h-full overflow-hidden rounded-2xl border border-border bg-background p-7 transition-all hover:-translate-y-1 hover:shadow-[0_20px_50px_-20px_oklch(0.34_0.06_156_/_0.3)]">
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/5 transition-transform duration-500 group-hover:scale-125" />
                <div className="relative">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <p.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display mt-5 text-lg font-medium">{p.t}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{p.d}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="container-prj pb-24">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-primary p-10 text-primary-foreground md:p-14">
            <div aria-hidden className="pointer-events-none absolute inset-0">
              <div className="absolute -top-24 -right-10 h-80 w-80 rounded-full bg-accent/25 blur-3xl animate-blob" />
            </div>
            <div className="relative grid items-end gap-10 md:grid-cols-[1fr_2fr]">
              <div>
                <p className="font-subhead text-xs uppercase tracking-[0.18em] text-accent">
                  By the numbers
                </p>
                <h2 className="font-display mt-3 text-3xl font-semibold leading-[1.05] md:text-4xl">
                  Where our last year went.
                </h2>
              </div>
              <dl className="grid grid-cols-2 gap-y-8 md:grid-cols-4">
                {metrics.map((m, i) => (
                  <Reveal key={m.v} delay={i * 70} inline>
                    <dt className="font-display text-3xl font-semibold md:text-4xl">{m.k}</dt>
                    <dd className="font-subhead mt-1 text-xs uppercase tracking-[0.12em] opacity-80">
                      {m.v}
                    </dd>
                  </Reveal>
                ))}
              </dl>
            </div>
          </div>
        </Reveal>
      </section>
    </MarketingLayout>
  );
}
