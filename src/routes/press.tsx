import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { MarketingLayout } from "@/components/marketing/layout";
import { PageHero } from "@/components/marketing/page-hero";
import { Reveal } from "@/components/reveal";

const features = [
  {
    outlet: "Vogue India",
    date: "May 2026",
    headline: "How Prajnaa is rewriting the supply chain for Indian pantry staples",
    url: "#",
  },
  {
    outlet: "Forbes India",
    date: "Apr 2026",
    headline: "The farmer-first marketplace that pays growers 4× the going rate",
    url: "#",
  },
  {
    outlet: "Mint Lounge",
    date: "Mar 2026",
    headline: "From a Himalayan field to your kitchen, with the batch code to prove it",
    url: "#",
  },
  {
    outlet: "YourStory",
    date: "Feb 2026",
    headline: "Inside Prajnaa's 4-step farmer onboarding — and why it works",
    url: "#",
  },
  {
    outlet: "The Hindu",
    date: "Jan 2026",
    headline: "A traceable jar of pickle, and the small farms behind it",
    url: "#",
  },
  {
    outlet: "Conde Nast Traveller",
    date: "Dec 2025",
    headline: "Eight Indian regions, eight harvests — a year in pantry travel",
    url: "#",
  },
];

const awards = [
  { y: "2026", t: "Most ethical D2C brand", who: "ET BrandEquity" },
  { y: "2025", t: "Best in supply-chain transparency", who: "FSSAI Awards" },
  { y: "2025", t: "Top 10 D2C food brands to watch", who: "YourStory" },
  { y: "2024", t: "Sustainable packaging innovator", who: "PaperCon India" },
];

export const Route = createFileRoute("/press")({
  head: () => ({
    meta: [
      { title: "Press — Prajnaa Farm" },
      {
        name: "description",
        content: "Press features, awards, and brand resources for Prajnaa Farm.",
      },
      { property: "og:title", content: "Press — Prajnaa Farm" },
      { property: "og:description", content: "Selected press features and brand resources." },
    ],
  }),
  component: PressPage,
});

function PressPage() {
  return (
    <MarketingLayout>
      <PageHero
        eyebrow="Press"
        title={
          <>
            In their <span className="text-primary">words.</span>
          </>
        }
        subtitle="Selected stories about Prajnaa and the farmers we work with. Press enquiries: press@prajnaa.in"
      />

      <section className="container-prj py-20">
        <Reveal>
          <h2 className="font-display text-2xl font-semibold md:text-3xl">Featured in</h2>
        </Reveal>
        <ul className="mt-8 divide-y divide-border rounded-3xl border border-border bg-background">
          {features.map((f, i) => (
            <Reveal as="li" key={f.headline} delay={i * 40}>
              <a
                href={f.url}
                className="group flex items-start justify-between gap-6 p-6 transition-colors hover:bg-secondary/30 md:p-7"
              >
                <div>
                  <p className="font-subhead text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    {f.outlet} · {f.date}
                  </p>
                  <h3 className="font-display mt-2 text-lg font-medium md:text-xl">{f.headline}</h3>
                </div>
                <ArrowUpRight className="h-5 w-5 shrink-0 text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
              </a>
            </Reveal>
          ))}
        </ul>
      </section>

      <section className="container-prj pb-24">
        <Reveal>
          <h2 className="font-display text-2xl font-semibold md:text-3xl">Recognition</h2>
        </Reveal>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {awards.map((a, i) => (
            <Reveal key={a.t} delay={i * 70}>
              <div className="h-full rounded-2xl border border-border bg-background p-6">
                <p className="font-display text-3xl font-semibold text-primary">{a.y}</p>
                <h3 className="font-display mt-4 text-base font-medium">{a.t}</h3>
                <p className="font-subhead mt-2 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  {a.who}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </MarketingLayout>
  );
}
