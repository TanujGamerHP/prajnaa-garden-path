import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, MapPin } from "lucide-react";
import { MarketingLayout } from "@/components/marketing/layout";
import { PageHero } from "@/components/marketing/page-hero";
import { Reveal } from "@/components/reveal";

const roles = [
  { t: "Farmer Onboarding Lead", team: "Sourcing", loc: "Bengaluru · On-site", type: "Full-time" },
  { t: "Senior Backend Engineer (NestJS)", team: "Engineering", loc: "Remote, India", type: "Full-time" },
  { t: "Brand Designer", team: "Brand", loc: "Mumbai · Hybrid", type: "Full-time" },
  { t: "Warehouse Operations Manager", team: "Operations", loc: "Anand, Gujarat", type: "Full-time" },
  { t: "Content Editor — The Journal", team: "Brand", loc: "Remote, India", type: "Contract" },
  { t: "Customer Care Associate", team: "Care", loc: "Bengaluru · On-site", type: "Full-time" },
];

const values = [
  { t: "Soil first", d: "Every product decision starts at the farm. If it's not good for the soil, it's not on Prajnaa." },
  { t: "Traceable by default", d: "We can name every farmer, every batch, every test. If we can't, we don't ship it." },
  { t: "Honest economics", d: "Farmers know our margin. Customers know our cost. No fine print, ever." },
  { t: "Quietly excellent", d: "Loud marketing is easy. We'd rather the jar in your kitchen do the talking." },
];

export const Route = createFileRoute("/careers")({
  head: () => ({
    meta: [
      { title: "Careers — Prajnaa Farm" },
      { name: "description", content: "Open roles at Prajnaa Farm. Build the supply chain for the next generation of Indian food." },
      { property: "og:title", content: "Careers — Prajnaa Farm" },
      { property: "og:description", content: "Open roles. Build farmer-first commerce with us." },
    ],
  }),
  component: CareersPage,
});

function CareersPage() {
  return (
    <MarketingLayout>
      <PageHero
        eyebrow="Careers"
        title={<>Build food commerce <span className="text-primary">that pays the grower.</span></>}
        subtitle="We're a small team in Bengaluru, Anand and the field — building the supply chain India should have had a decade ago."
      />

      <section className="container-prj py-20">
        <Reveal>
          <h2 className="font-display text-2xl font-semibold md:text-3xl">What we stand for</h2>
        </Reveal>
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {values.map((v, i) => (
            <Reveal key={v.t} delay={i * 70}>
              <div className="h-full rounded-2xl border border-border bg-background p-6">
                <p className="font-display text-lg font-medium">{v.t}</p>
                <p className="mt-2 text-sm text-muted-foreground">{v.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="container-prj pb-24">
        <Reveal>
          <div className="flex items-end justify-between">
            <h2 className="font-display text-2xl font-semibold md:text-3xl">Open roles</h2>
            <p className="font-subhead hidden text-xs uppercase tracking-[0.16em] text-muted-foreground md:block">{roles.length} positions</p>
          </div>
        </Reveal>
        <ul className="mt-8 divide-y divide-border overflow-hidden rounded-3xl border border-border bg-background">
          {roles.map((r, i) => (
            <Reveal as="li" key={r.t} delay={i * 50}>
              <Link to="/contact" className="group flex flex-col gap-3 p-6 transition-colors hover:bg-secondary/30 md:flex-row md:items-center md:justify-between md:p-7">
                <div>
                  <p className="font-subhead text-[11px] uppercase tracking-[0.16em] text-accent">{r.team}</p>
                  <h3 className="font-display mt-1.5 text-lg font-medium md:text-xl">{r.t}</h3>
                  <p className="font-subhead mt-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {r.loc} · {r.type}
                  </p>
                </div>
                <span className="font-subhead inline-flex items-center gap-1.5 text-sm font-medium text-primary group-hover:underline">
                  Apply <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            </Reveal>
          ))}
        </ul>
      </section>
    </MarketingLayout>
  );
}
