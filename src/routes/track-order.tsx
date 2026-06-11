import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Package, Truck, MapPin, CheckCircle2, Search, ArrowRight, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { MarketingLayout } from "@/components/marketing/layout";
import { PageHero } from "@/components/marketing/page-hero";
import { Reveal } from "@/components/reveal";
import { supabase } from "@/integrations/supabase/client";

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

const ICONS = {
  placed: Package,
  confirmed: CheckCircle2,
  packed: Package,
  shipped: Truck,
  "out-for-delivery": MapPin,
  delivered: CheckCircle2,
} as const;

function TrackOrderPage() {
  const [orderId, setOrderId] = useState("");
  const [searched, setSearched] = useState<string | null>(null);

  const { data: order, isLoading } = useQuery({
    enabled: !!searched,
    queryKey: ["track-order-search", searched],
    queryFn: async () => {
      // First try doc id directly
      const { data: byId } = await supabase
        .from("orders")
        .select("*")
        .eq("id", searched)
        .maybeSingle();

      if (byId) return byId;

      // Fallback: search by order_id field
      const { data: byOrderId } = await supabase
        .from("orders")
        .select("*")
        .eq("order_id", searched)
        .maybeSingle();

      return byOrderId || null;
    },
  });

  const getMilestones = (o: any) => {
    if (!o) return [];
    
    const getStepState = (stepIdx: number, currentIdx: number) => {
      if (stepIdx < currentIdx) return "done";
      if (stepIdx === currentIdx) return "current";
      return "upcoming";
    };

    const getStepIndex = (s: string) => {
      switch (s) {
        case "pending": return 0;
        case "confirmed": return 1;
        case "packed": return 2;
        case "shipped": return 3;
        case "delivered": return 4;
        default: return 0;
      }
    };

    const currentIdx = getStepIndex(o.status);
    const orderDateStr = o.created_at 
      ? new Date(o.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
      : "";
    const delDateStr = o.delivery_date
      ? new Date(o.delivery_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
      : "—";

    return [
      {
        id: "placed" as const,
        title: "Order Placed",
        description: "Payment confirmed. Awaiting admin dispatch route approval.",
        state: getStepState(0, currentIdx),
        date: orderDateStr,
      },
      {
        id: "confirmed" as const,
        title: "Order Confirmed",
        description: o.delivery_route ? `Delivery route assigned: ${o.delivery_route}` : "Route allocation pending.",
        state: getStepState(1, currentIdx),
        date: currentIdx >= 1 ? orderDateStr : "Upcoming",
      },
      {
        id: "packed" as const,
        title: "Packed by Farmer",
        description: "Produce packaged by the farmer. Ready for dispatch.",
        state: getStepState(2, currentIdx),
        date: currentIdx >= 2 ? orderDateStr : "Upcoming",
      },
      {
        id: "shipped" as const,
        title: "Shipped & In Transit",
        description: o.carrier_name ? `Shipment in transit via ${o.carrier_name}` : "Logistics handover pending.",
        state: getStepState(3, currentIdx),
        date: currentIdx >= 3 ? orderDateStr : "Upcoming",
      },
      {
        id: "delivered" as const,
        title: "Delivered",
        description: "Produce delivered to your shipping address.",
        state: getStepState(4, currentIdx),
        date: currentIdx === 4 ? delDateStr : "Upcoming",
      },
    ];
  };

  const milestones = order ? getMilestones(order) : [];

  return (
    <MarketingLayout>
      <PageHero
        eyebrow="Track order"
        title={
          <>
            Where's my <span className="text-primary">jar?</span>
          </>
        }
        subtitle="Enter your order ID to see live status. We'll show you every stop from the farm to your door."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (orderId.trim()) setSearched(orderId.trim());
          }}
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
          <button className="font-subhead rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow-lg cursor-pointer">
            Track
          </button>
        </form>
      </PageHero>

      {searched && isLoading && (
        <div className="container-prj py-20 flex justify-center items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="font-subhead text-sm text-muted-foreground">Searching order...</span>
        </div>
      )}

      {searched && !isLoading && !order && (
        <section className="container-prj py-20">
          <Reveal>
            <div className="mx-auto max-w-md rounded-3xl border border-border bg-background p-10 text-center shadow-sm">
              <p className="font-display text-2xl font-semibold">No order found</p>
              <p className="mt-2 text-sm text-muted-foreground">
                We couldn't find an order with ID <span className="font-medium">{searched}</span>. Please verify your order ID or check your account dashboard.
              </p>
            </div>
          </Reveal>
        </section>
      )}

      {searched && !isLoading && order && (
        <section className="container-prj py-20 animate-fade-up">
          <Reveal>
            <div className="rounded-3xl border border-border bg-background p-8 md:p-12 shadow-sm">
              <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
                <div>
                  <p className="font-subhead text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                    Order
                  </p>
                  <Link
                    to="/orders/$id"
                    params={{ id: order.id }}
                    className="font-display mt-1 inline-flex items-center gap-2 text-2xl font-semibold hover:text-primary"
                  >
                    {order.order_id || order.id?.slice(0, 8).toUpperCase()}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
                <Link
                  to="/orders/$id"
                  params={{ id: order.id }}
                  className="font-subhead inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs hover:bg-secondary cursor-pointer"
                >
                  View full details
                </Link>
              </div>
              
              <ol className="mt-10 space-y-8">
                {milestones.map((m, i) => {
                  const Icon = ICONS[m.id];
                  return (
                    <Reveal
                      as="li"
                      key={m.id}
                      delay={i * 90}
                      className="relative grid grid-cols-[auto_1fr] gap-5"
                    >
                      <div className="relative flex flex-col items-center">
                        <div
                          className={`grid h-10 w-10 place-items-center rounded-full border ${
                            m.state === "done" || m.state === "current" 
                              ? "border-primary bg-primary text-primary-foreground font-semibold" 
                              : "border-border bg-background text-muted-foreground"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        {i < milestones.length - 1 && (
                          <div
                            className={`mt-1 w-px flex-1 ${m.state === "done" ? "bg-primary/50" : "bg-border"}`}
                            style={{ minHeight: 32 }}
                          />
                        )}
                      </div>
                      <Link
                        to="/orders/$id"
                        params={{ id: order.id }}
                        hash={m.id}
                        className="block rounded-xl pb-1 transition-colors hover:bg-secondary/60 flex-1"
                      >
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <p className="font-display text-base font-medium">{m.title}</p>
                          <p className="font-subhead text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                            {m.state === "upcoming" ? "Pending" : m.date}
                          </p>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{m.description}</p>
                        <span className="font-subhead mt-2 inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.14em] text-primary">
                          View details <ArrowRight className="h-3 w-3" />
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
