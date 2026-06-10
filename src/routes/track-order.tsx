import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Package, Truck, MapPin, CheckCircle2, Search } from "lucide-react";
import { MarketingLayout } from "@/components/marketing/layout";
import { PageHero } from "@/components/marketing/page-hero";
import { Reveal } from "@/components/reveal";

const stages = [
  { icon: Package, t: "Order placed", d: "We've received your order and the farmer has been notified.", date: "Wed, 5 Jun · 10:22 AM" },
  { icon: CheckCircle2, t: "Packed at source", d: "Sealed at origin with batch code, harvest date and lab certificate.", date: "Wed, 5 Jun · 4:11 PM" },
  { icon: Truck, t: "Out for shipping", d: "Picked up by our logistics partner. Tracking number: PRJ48201-IN.", date: "Thu, 6 Jun · 9:48 AM" },
  { icon: MapPin, t: "Out for delivery", d: "Your order is with the courier and will be delivered today.", date: "Sat, 8 Jun · 8:30 AM" },
];

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

function TrackOrderPage() {
  const [orderId, setOrderId] = useState("");
  const [shown, setShown] = useState(false);

  return (
    <MarketingLayout>
      <PageHero
        eyebrow="Track order"
        title={<>Where's my <span className="text-primary">jar?</span></>}
        subtitle="Enter your order ID and email to see live status. We'll show you every stop from the farm to your door."
      >
        <form
          onSubmit={(e) => { e.preventDefault(); if (orderId) setShown(true); }}
          className="flex max-w-xl flex-col gap-3 sm:flex-row"
        >
          <label className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              required
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="Order ID (e.g. PRJ-48201)"
              className="font-subhead w-full rounded-full border border-border bg-background pl-11 pr-5 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
          <button className="font-subhead rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow-lg">
            Track
          </button>
        </form>
      </PageHero>

      {shown && (
        <section className="container-prj py-20">
          <Reveal>
            <div className="rounded-3xl border border-border bg-background p-8 md:p-12">
              <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
                <div>
                  <p className="font-subhead text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Order</p>
                  <p className="font-display mt-1 text-2xl font-semibold">{orderId.toUpperCase()}</p>
                </div>
                <span className="font-subhead inline-flex items-center gap-2 rounded-full bg-success/15 px-3 py-1.5 text-xs text-success">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" /> Out for delivery
                </span>
              </div>
              <ol className="mt-10 space-y-8">
                {stages.map((s, i) => {
                  const done = i < stages.length - 1;
                  const current = i === stages.length - 1;
                  return (
                    <Reveal as="li" key={s.t} delay={i * 100} className="relative grid grid-cols-[auto_1fr] gap-5">
                      <div className="relative flex flex-col items-center">
                        <div className={`grid h-10 w-10 place-items-center rounded-full border ${done || current ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground"}`}>
                          <s.icon className="h-4 w-4" />
                        </div>
                        {i < stages.length - 1 && (
                          <div className={`mt-1 w-px flex-1 ${done ? "bg-primary/50" : "bg-border"}`} style={{ minHeight: 32 }} />
                        )}
                      </div>
                      <div className="pb-1">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <p className="font-display text-base font-medium">{s.t}</p>
                          <p className="font-subhead text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{s.date}</p>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
                      </div>
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
