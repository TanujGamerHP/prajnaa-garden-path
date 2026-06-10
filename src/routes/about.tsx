import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/marketing/layout";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Prajnaa Farm" },
      { name: "description", content: "Prajnaa Farm connects verified Indian farmers directly with families who care about how their food is grown." },
      { property: "og:title", content: "About — Prajnaa Farm" },
      { property: "og:description", content: "Prajnaa Farm connects verified Indian farmers directly with families who care about how their food is grown." },
      { property: "og:url", content: "/about" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <MarketingLayout>
      <article className="container-prj pt-14 md:pt-20">
        <p className="font-subhead text-xs uppercase tracking-[0.18em] text-primary">About</p>
        <h1 className="font-display mt-3 max-w-3xl text-5xl font-semibold leading-[1.02] md:text-6xl">
          A marketplace built on names, not&nbsp;SKUs.
        </h1>
        <div className="prose mt-10 max-w-2xl space-y-5 text-[16px] leading-[1.7] text-foreground/85">
          <p>
            Prajnaa Farm exists for a simple reason: we believe you should know who grew your food. Not a brand. Not a category. A person.
          </p>
          <p>
            We started in 2026 to connect verified farmers and small-batch producers across India directly with families who care about what's in their pantry. Every product on Prajnaa carries the name of the farmer who grew it, the village it came from, and the harvest it belongs to.
          </p>
          <p>
            We don't warehouse, we don't blend, and we don't repackage. The jar that arrives at your door is the same one that left the farm.
          </p>
        </div>

        <dl className="mt-16 grid gap-6 sm:grid-cols-3">
          {[
            ["100+", "Farmers verified"],
            ["1,000+", "Families served"],
            ["10,000+", "Orders fulfilled"],
          ].map(([k, v]) => (
            <div key={v} className="rounded-2xl border border-border bg-secondary/40 p-6">
              <dt className="font-display text-4xl font-semibold text-primary">{k}</dt>
              <dd className="font-subhead mt-2 text-xs uppercase tracking-[0.14em] text-muted-foreground">{v}</dd>
            </div>
          ))}
        </dl>
      </article>
    </MarketingLayout>
  );
}
