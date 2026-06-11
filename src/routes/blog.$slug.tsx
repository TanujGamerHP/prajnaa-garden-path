import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { MarketingLayout } from "@/components/marketing/layout";
import { Reveal } from "@/components/reveal";
import { postBySlug, posts } from "@/lib/mock/blog";

export const Route = createFileRoute("/blog/$slug")({
  head: ({ params }) => {
    const p = postBySlug(params.slug);
    return {
      meta: [
        { title: p ? `${p.title} — Prajnaa Journal` : "Post — Prajnaa Journal" },
        { name: "description", content: p?.excerpt ?? "A story from Prajnaa Farm." },
        { property: "og:title", content: p?.title ?? "Prajnaa Journal" },
        { property: "og:description", content: p?.excerpt ?? "" },
        ...(p
          ? [
              { property: "og:image", content: p.image },
              { name: "twitter:image", content: p.image },
            ]
          : []),
      ],
    };
  },
  loader: ({ params }) => {
    const post = postBySlug(params.slug);
    if (!post) throw notFound();
    return { post };
  },
  notFoundComponent: () => (
    <MarketingLayout>
      <div className="container-prj py-32 text-center">
        <p className="font-subhead text-xs uppercase tracking-[0.18em] text-muted-foreground">
          404
        </p>
        <h1 className="font-display mt-3 text-4xl font-semibold">Post not found</h1>
        <Link to="/blog" className="mt-6 inline-flex items-center gap-2 text-sm text-primary">
          <ArrowLeft className="h-4 w-4" /> Back to the journal
        </Link>
      </div>
    </MarketingLayout>
  ),
  component: PostPage,
});

function PostPage() {
  const { post } = Route.useLoaderData() as any;
  const related = posts.filter((p) => p.slug !== post.slug).slice(0, 3);
  return (
    <MarketingLayout>
      <article>
        <header className="container-prj pt-16 md:pt-24">
          <Reveal inline>
            <Link
              to="/blog"
              className="font-subhead inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> The Journal
            </Link>
            <p className="font-subhead mt-6 text-[11px] uppercase tracking-[0.18em] text-accent">
              {post.category}
            </p>
            <h1 className="font-display mt-3 max-w-3xl text-4xl font-semibold leading-[1.05] md:text-6xl">
              {post.title}
            </h1>
            <p className="font-subhead mt-5 text-xs uppercase tracking-[0.14em] text-muted-foreground">
              {post.author} ·{" "}
              {new Date(post.date).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}{" "}
              · {post.readMinutes} min read
            </p>
          </Reveal>
        </header>

        <Reveal inline className="container-prj mt-10">
          <div className="overflow-hidden rounded-3xl bg-secondary">
            <img src={post.image} alt={post.title} className="aspect-[16/9] w-full object-cover" />
          </div>
        </Reveal>

        <div className="container-prj mx-auto mt-14 max-w-3xl space-y-6 pb-20 text-[17px] leading-[1.75] text-foreground/90">
          {post.body.map((p: string, i: number) => (
            <Reveal key={i} inline delay={i * 50}>
              <p>{p}</p>
            </Reveal>
          ))}
        </div>
      </article>

      <section className="container-prj border-t border-border py-20">
        <h2 className="font-display text-2xl font-semibold md:text-3xl">Keep reading</h2>
        <div className="mt-8 grid gap-8 md:grid-cols-3">
          {related.map((p, i) => (
            <Reveal key={p.slug} delay={i * 80}>
              <Link
                to="/blog/$slug"
                params={{ slug: p.slug }}
                className="group flex h-full flex-col"
              >
                <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-secondary">
                  <img
                    src={p.image}
                    alt={p.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                </div>
                <h3 className="font-display mt-4 text-lg font-medium">{p.title}</h3>
                <p className="font-subhead mt-1 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  {p.category}
                </p>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
    </MarketingLayout>
  );
}
