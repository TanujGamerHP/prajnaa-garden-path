import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Package, Truck, MapPin, CheckCircle2, Search, ArrowRight } from "lucide-react";
import { MarketingLayout } from "@/components/marketing/layout";
import { PageHero } from "@/components/marketing/page-hero";
import { Reveal } from "@/components/reveal";
import { orders } from "@/lib/mock/orders";
import { milestonesFor } from "./orders.$id";

export const Route = createFileRoute("/track-order")({
  head: () => ({
    meta: [
      { title: "Track your order — Prajnaa Farm" },
      { name: "description", content: "Track your Prajnaa Farm order in real time." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TrackOrderPage,
});

const ICONS = { placed: Package, packed: CheckCircle2, shipped: Truck, "out-for-delivery": MapPin, delivered: CheckCircle2 } as const;

function TrackOrderPage() {
  const [orderId, setOrderId] = useState("");
  const [searched, setSearched] = useState<string | null>(null);

  const order = searched ? orders.find((o) => o.id.toLowerCase() === searched.toLowerCase()) : null;
  const milestones = order ? milestonesFor(order.status) : [];
  const recent = orders.slice(0, 3);

  return (
    <MarketingLayout>
      <PageHero
        eyebrow="Track order"
        title={<>Where's my <span className="text-primary">jar?</span></>}
        subtitle="Enter your order ID to see live status. We'll show you every stop from the farm to your door."
      >
        <form
          onSubmit={(e) => { e.preventDefault(); if (orderId.trim()) setSearched(orderId.trim()); }}
          className="flex max-w-xl flex-col gap-3 sm:flex-row"
        >
          <label className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              required
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="Order ID (e.g. PRJ-10241)"
              className="font-subhead w-full rounded-full border border-border bg-background pl-11 pr-5 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
          <button className="font-subhead rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow-lg">
            Track
          </button>
        </form>
        <p className="mt-4 text-xs text-muted-foreground">
          Try{" "}
          {recent.map((o, i) => (
            <span key={o.id}>
              <button
                type="button"
                onClick={() => { setOrderId(o.id); setSearched(o.id); }}
                className="underline underline-offset-2 hover:text-foreground"
              >
                {o.id}
              </button>
              {i < recent.length - 1 ? ", " : ""}
            </span>
          ))}
        </p>
      </PageHero>

      {searched && !order && (
        <section className="container-prj py-20">
          <Reveal>
            <div className="mx-auto max-w-md rounded-3xl border border-border bg-background p-10 text-center">
              <p className="font-display text-2xl font-semibold">No order found</p>
              <p className="mt-2 text-sm text-muted-foreground">We couldn't find <span className="font-medium">{searched}</span>. Check the ID or try one of the demo orders above.</p>
            </div>
          </Reveal>
        </section>
      )}

      {order && (
        <section className="container-prj py-20">
          <Reveal>
            <div className="rounded-3xl border border-border bg-background p-8 md:p-12">
              <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
                <div>
                  <p className="font-subhead text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Order</p>
                  <Link
                    to="/orders/$id"
                    params={{ id: order.id }}
                    className="font-display mt-1 inline-flex items-center gap-2 text-2xl font-semibold hover:text-primary"
                  >
                    {order.id}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
                <Link
                  to="/orders/$id"
                  params={{ id: order.id }}
                  className="font-subhead inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs hover:bg-secondary"
                >
                  View full details
                </Link>
              </div>
              <ol className="mt-10 space-y-8">
                {milestones.map((m, i) => {
                  const Icon = ICONS[m.id];
                  return (
                    <Reveal as="li" key={m.id} delay={i * 90} className="relative grid grid-cols-[auto_1fr] gap-5">
                      <div className="relative flex flex-col items-center">
                        <div className={`grid h-10 w-10 place-items-center rounded-full border ${m.state === "done" || m.state === "current" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground"}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        {i < milestones.length - 1 && (
                          <div className={`mt-1 w-px flex-1 ${m.state === "done" ? "bg-primary/50" : "bg-border"}`} style={{ minHeight: 32 }} />
                        )}
                      </div>
                      <Link
                        to="/orders/$id"
                        params={{ id: order.id }}
                        hash={m.id}
                        className="block rounded-xl pb-1 transition-colors hover:bg-secondary/60"
                      >
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <p className="font-display text-base font-medium">{m.title}</p>
                          <p className="font-subhead text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                            {m.state === "upcoming" ? "Pending" : m.date}
                          </p>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{m.description}</p>
                        <span className="font-subhead mt-2 inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.14em] text-primary">
                          View milestone <ArrowRight className="h-3 w-3" />
                        </span>
                      </Link>
                    </Reveal>
                  );
                })}
              </ol>
            </div>
          </Reveal>
        </section>
      )}
    </MarketingLayout>
  );
}
