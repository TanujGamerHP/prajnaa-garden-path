import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { MarketingLayout } from "@/components/marketing/layout";
import { PageHero } from "@/components/marketing/page-hero";
import { Reveal } from "@/components/reveal";
import { posts } from "@/lib/mock/blog";

export const Route = createFileRoute("/blog/")({
  head: () => ({
    meta: [
      { title: "The Journal — Prajnaa Farm" },
      { name: "description", content: "Farmer stories, recipes, and field notes from across India. Slow reading from the people growing your food." },
      { property: "og:title", content: "The Journal — Prajnaa Farm" },
      { property: "og:description", content: "Farmer stories, recipes, and field notes." },
    ],
  }),
  component: BlogIndex,
});

function BlogIndex() {
  const [featured, ...rest] = posts;
  return (
    <MarketingLayout>
      <PageHero
        eyebrow="The Journal"
        title={<>Slow reading from the <span className="text-primary">field.</span></>}
        subtitle="Farmer stories, kitchen recipes, and quiet essays on growing food in India."
      />

      <div className="container-prj py-20">
        <Reveal>
          <Link
            to="/blog/$slug"
            params={{ slug: featured.slug }}
            className="group grid items-stretch overflow-hidden rounded-3xl border border-border bg-background transition-shadow hover:shadow-[0_20px_60px_-20px_oklch(0.34_0.06_156_/_0.3)] md:grid-cols-[1.2fr_1fr]"
          >
            <div className="aspect-[5/4] overflow-hidden bg-secondary md:aspect-auto">
              <img src={featured.image} alt={featured.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
            </div>
            <div className="flex flex-col justify-between gap-8 p-8 md:p-12">
              <div>
                <p className="font-subhead text-[11px] uppercase tracking-[0.16em] text-accent">{featured.category} · Featured</p>
                <h2 className="font-display mt-4 text-3xl font-semibold leading-[1.1] md:text-4xl">{featured.title}</h2>
                <p className="mt-4 text-sm text-muted-foreground md:text-base">{featured.excerpt}</p>
              </div>
              <p className="font-subhead inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                {featured.author} · {featured.readMinutes} min read
                <ArrowRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-0.5" />
              </p>
            </div>
          </Link>
        </Reveal>

        <div className="mt-16 grid gap-10 md:grid-cols-2 lg:grid-cols-3">
          {rest.map((p, i) => (
            <Reveal key={p.slug} delay={(i % 3) * 80}>
              <Link
                to="/blog/$slug"
                params={{ slug: p.slug }}
                className="group flex h-full flex-col"
              >
                <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-secondary">
                  <img src={p.image} alt={p.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]" />
                </div>
                <div className="mt-5 flex flex-1 flex-col">
                  <p className="font-subhead text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{p.category}</p>
                  <h3 className="font-display mt-2 text-xl font-medium leading-snug">{p.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{p.excerpt}</p>
                  <p className="font-subhead mt-auto pt-4 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                    {p.author} · {p.readMinutes} min
                  </p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </MarketingLayout>
  );
}
