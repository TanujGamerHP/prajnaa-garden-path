import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search } from "lucide-react";
import { MarketingLayout } from "@/components/marketing/layout";
import { PageHero } from "@/components/marketing/page-hero";
import { Reveal } from "@/components/reveal";

const groups = [
  {
    title: "Orders & shipping",
    items: [
      { q: "How long does delivery take?", a: "Most orders ship within 24–48 hours of being placed and reach you within 3–7 business days depending on your pin code." },
      { q: "Do you deliver to my city?", a: "We deliver to 20,000+ pin codes across India through trusted logistics partners. You'll see availability at checkout." },
      { q: "Can I track my order?", a: "Yes. The moment your order ships, you'll get a tracking link by email and SMS. You can also track it from your account." },
      { q: "Is cash on delivery available?", a: "COD is available on orders under ₹3,000 for serviceable pin codes. Prepaid orders unlock free shipping above ₹999." },
    ],
  },
  {
    title: "Products & quality",
    items: [
      { q: "Are your products certified organic?", a: "We source naturally grown, chemical-free produce. Many products carry FSSAI and India Organic certifications — listed on each product page." },
      { q: "How do you verify farmers?", a: "Every farmer goes through a 4-step process: site visit, document verification, soil/water reports, and lab-tested product samples before going live." },
      { q: "Do products have an expiry date?", a: "Yes. Each pack carries a batch code, harvest date and best-before date printed at source." },
      { q: "Why are some items seasonal?", a: "Seasonal harvests are limited by nature. When the season ends, they're gone until next year — we don't fake stock." },
    ],
  },
  {
    title: "Payments & refunds",
    items: [
      { q: "Which payment methods do you accept?", a: "UPI, all major credit and debit cards, net banking, and selected wallets — all secured via Razorpay." },
      { q: "What if my order arrives damaged?", a: "We offer a 100% refund or replacement on damaged or tampered items. Just share a photo within 48 hours of delivery." },
      { q: "When will I get my refund?", a: "Approved refunds are credited within 5–7 business days to the original payment method." },
    ],
  },
  {
    title: "Account & subscriptions",
    items: [
      { q: "Do I need an account to order?", a: "No. You can check out as a guest. Creating an account lets you track orders, save addresses and earn loyalty points." },
      { q: "Are subscriptions available?", a: "Subscription orders are rolling out in the next release. Meanwhile, our 'Restock reminder' will email you when favourites are back." },
      { q: "How do I delete my account?", a: "Write to privacy@prajnaa.in and we'll delete your account and associated data within 7 working days." },
    ],
  },
];

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — Prajnaa Farm" },
      { name: "description", content: "Answers to common questions about orders, products, shipping, and refunds at Prajnaa Farm." },
      { property: "og:title", content: "Frequently asked questions — Prajnaa Farm" },
      { property: "og:description", content: "Answers about orders, shipping, refunds and farmer verification." },
    ],
  }),
  component: FaqPage,
});

function FaqPage() {
  const [q, setQ] = useState("");
  const filtered = groups
    .map((g) => ({ ...g, items: g.items.filter((i) => (i.q + i.a).toLowerCase().includes(q.toLowerCase())) }))
    .filter((g) => g.items.length);

  return (
    <MarketingLayout>
      <PageHero
        eyebrow="Help center"
        title={<>Questions, <span className="text-primary">answered.</span></>}
        subtitle="Everything you need to know about ordering from Prajnaa Farm, the farmers behind it, and how we handle your trust."
      >
        <label className="relative block max-w-lg">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search questions…"
            className="font-subhead w-full rounded-full border border-border bg-background pl-11 pr-5 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </label>
      </PageHero>

      <div className="container-prj space-y-16 py-20">
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground">No questions match "{q}". Try another search.</p>
        )}
        {filtered.map((g, gi) => (
          <Reveal key={g.title} delay={gi * 60}>
            <section>
              <h2 className="font-display text-2xl font-semibold md:text-3xl">{g.title}</h2>
              <div className="mt-6 divide-y divide-border rounded-3xl border border-border bg-background">
                {g.items.map((it, i) => (
                  <FaqItem key={it.q} index={i} item={it} />
                ))}
              </div>
            </section>
          </Reveal>
        ))}
      </div>
    </MarketingLayout>
  );
}

function FaqItem({ item, index }: { item: { q: string; a: string }; index: number }) {
  const [open, setOpen] = useState(index === 0);
  const panelId = `faq-p-${index}-${item.q.slice(0, 8).replace(/\s/g, "-")}`;
  return (
    <div>
      <h3 className="m-0">
        <button
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-secondary/30 focus-visible:bg-secondary/30"
        >
          <span className="font-display text-base font-medium">{item.q}</span>
          <span aria-hidden className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border border-border text-sm transition-transform ${open ? "rotate-45 bg-primary text-primary-foreground border-primary" : ""}`}>+</span>
        </button>
      </h3>
      <div
        id={panelId}
        aria-hidden={!open}
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
        className="grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none"
      >
        <div className="overflow-hidden">
          <p className="px-6 pb-5 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
        </div>
      </div>
    </div>
  );
}
