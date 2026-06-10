import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { ArrowLeft, CheckCircle2, MapPin, Package, Truck } from "lucide-react";
import { MarketingLayout } from "@/components/marketing/layout";
import { Reveal } from "@/components/reveal";
import { orders } from "@/lib/mock/orders";
import { allProducts } from "@/lib/mock/products";
import { inr } from "@/lib/format";
import type { Order } from "@/lib/mock/types";

export const Route = createFileRoute("/orders/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Order ${params.id} — Prajnaa Farm` },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrderDetailPage,
  notFoundComponent: () => (
    <MarketingLayout>
      <div className="container-prj py-32 text-center">
        <h1 className="font-display text-4xl">Order not found</h1>
        <Link to="/track-order" className="mt-4 inline-block text-primary underline">Back to tracking</Link>
      </div>
    </MarketingLayout>
  ),
  errorComponent: ({ error }) => (
    <MarketingLayout>
      <div className="container-prj py-32 text-center">
        <h1 className="font-display text-4xl">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
      </div>
    </MarketingLayout>
  ),
  loader: ({ params }) => {
    const order = orders.find((o) => o.id.toLowerCase() === params.id.toLowerCase());
    if (!order) throw notFound();
    return { order };
  },
});

// Stable milestone IDs are used both here and in /track-order deep links.
export const MILESTONE_IDS = [
  "placed",
  "packed",
  "shipped",
  "out-for-delivery",
  "delivered",
] as const;
export type MilestoneId = (typeof MILESTONE_IDS)[number];

type Milestone = {
  id: MilestoneId;
  icon: typeof Package;
  title: string;
  description: string;
  date: string;
};

const ALL_MILESTONES: Milestone[] = [
  { id: "placed", icon: Package, title: "Order placed", description: "We've received your order and the farmer has been notified.", date: "Wed, 5 Jun · 10:22 AM" },
  { id: "packed", icon: CheckCircle2, title: "Packed at source", description: "Sealed at origin with batch code, harvest date and lab certificate.", date: "Wed, 5 Jun · 4:11 PM" },
  { id: "shipped", icon: Truck, title: "Shipped", description: "Picked up by our logistics partner. Tracking number: PRJ48201-IN.", date: "Thu, 6 Jun · 9:48 AM" },
  { id: "out-for-delivery", icon: MapPin, title: "Out for delivery", description: "Your order is with the courier and will be delivered today.", date: "Sat, 8 Jun · 8:30 AM" },
  { id: "delivered", icon: CheckCircle2, title: "Delivered", description: "Handed over to you. Enjoy! Tap below to rate your farmer.", date: "Sat, 8 Jun · 2:14 PM" },
];

export function milestonesFor(status: Order["status"]) {
  const reachedIndex: Record<Order["status"], number> = {
    pending: 0,
    packed: 1,
    shipped: 2,
    delivered: 4,
    cancelled: 0,
  };
  const reached = reachedIndex[status];
  return ALL_MILESTONES.map((m, i) => ({
    ...m,
    state: i < reached ? "done" : i === reached ? "current" : "upcoming",
  }));
}

function OrderDetailPage() {
  const { order } = Route.useLoaderData();
  const milestones = milestonesFor(order.status);
  const scrolledRef = useRef(false);

  // Deep-link to milestone anchors (#out-for-delivery, etc.)
  useEffect(() => {
    if (scrolledRef.current) return;
    const hash = window.location.hash.replace("#", "");
    if (!hash) return;
    const el = document.getElementById(hash);
    if (el) {
      scrolledRef.current = true;
      requestAnimationFrame(() => el.scrollIntoView({ behavior: "smooth", block: "center" }));
    }
  }, []);

  return (
    <MarketingLayout>
      <section className="container-prj pt-12 md:pt-16">
        <Link to="/track-order" className="font-subhead inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to tracking
        </Link>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-subhead text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Order · {order.date}</p>
            <h1 className="font-display mt-2 text-4xl font-semibold md:text-5xl">{order.id}</h1>
          </div>
          <span className="font-subhead inline-flex items-center gap-2 rounded-full bg-success/15 px-3 py-1.5 text-xs capitalize text-success">
            <span className="h-1.5 w-1.5 rounded-full bg-success" /> {order.status}
          </span>
        </div>
      </section>

      <section className="container-prj grid gap-10 py-14 md:grid-cols-[1.4fr_1fr]">
        <Reveal>
          <div className="rounded-3xl border border-border bg-background p-8 md:p-10">
            <h2 className="font-display text-2xl font-semibold">Timeline</h2>
            <p className="mt-1 text-sm text-muted-foreground">Every stop from the farm to your door.</p>
            <ol className="mt-8 space-y-8">
              {milestones.map((m, i) => (
                <li
                  key={m.id}
                  id={m.id}
                  className={`relative grid scroll-mt-28 grid-cols-[auto_1fr] gap-5 rounded-2xl p-3 transition-colors ${
                    m.state === "current" ? "bg-primary/5 ring-1 ring-primary/20" : ""
                  }`}
                >
                  <div className="relative flex flex-col items-center">
                    <div
                      className={`grid h-10 w-10 place-items-center rounded-full border ${
                        m.state === "done" || m.state === "current"
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-muted-foreground"
                      }`}
                    >
                      <m.icon className="h-4 w-4" />
                    </div>
                    {i < milestones.length - 1 && (
                      <div className={`mt-1 w-px flex-1 ${m.state === "done" ? "bg-primary/50" : "bg-border"}`} style={{ minHeight: 28 }} />
                    )}
                  </div>
                  <div className="pb-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="font-display text-base font-medium">{m.title}</p>
                      <p className="font-subhead text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                        {m.state === "upcoming" ? "Pending" : m.date}
                      </p>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{m.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <div className="rounded-3xl border border-border bg-background p-8">
            <h2 className="font-display text-xl font-semibold">Items</h2>
            <ul className="mt-5 space-y-4">
              {order.items.map((it: Order["items"][number]) => {
                const p = allProducts.find((x) => x.slug === it.productSlug);
                return (
                  <li key={it.productSlug} className="flex items-center gap-3">
                    {p && <img src={p.image} alt={p.name} className="h-14 w-14 rounded-xl object-cover" />}
                    <div className="flex-1">
                      <p className="font-display text-sm font-medium">{p?.name ?? it.productSlug}</p>
                      <p className="font-subhead mt-0.5 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Qty {it.qty}</p>
                    </div>
                    <p className="font-display text-sm">{inr(it.price * it.qty)}</p>
                  </li>
                );
              })}
            </ul>
            <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
              <span className="font-subhead text-xs uppercase tracking-[0.14em] text-muted-foreground">Total · {order.payment}</span>
              <span className="font-display text-xl font-semibold">{inr(order.total)}</span>
            </div>
          </div>
        </Reveal>
      </section>
    </MarketingLayout>
  );
}
