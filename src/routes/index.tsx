import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Leaf,
  ShieldCheck,
  Truck,
  Sprout,
  Star,
  MapPin,
  PackageCheck,
  HandHeart,
  Quote,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import heroImg from "@/assets/hero.jpg";
import { MarketingLayout } from "@/components/marketing/layout";
import { SectionHeader } from "@/components/store/section-header";
import { CategoryTile } from "@/components/store/category-tile";
import { FarmerCard } from "@/components/store/farmer-card";
import { ProductCard } from "@/components/store/product-card";
import { Reveal } from "@/components/reveal";
import { categories } from "@/lib/mock/categories";
import { farmers } from "@/lib/mock/farmers";
import { trendingProducts, seasonalProducts } from "@/lib/mock/products";
import { testimonials } from "@/lib/mock/reviews";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Prajnaa Farm — From Soil to Soul, Naturally" },
      {
        name: "description",
        content:
          "A premium farm-to-consumer marketplace. Verified farmers, natural products, traceable to the soil.",
      },
      { property: "og:title", content: "Prajnaa Farm — From Soil to Soul, Naturally" },
      {
        property: "og:description",
        content: "Verified farmers, natural products, traceable to the soil.",
      },
      { property: "og:url", content: "/" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <MarketingLayout>
      <Hero />
      <PressStrip />
      <WhyUs />
      <ShopByCategory />
      <HowItWorks />
      <FeaturedFarmers />
      <Trending />
      <ImpactStats />
      <Seasonal />
      <SourcingMap />
      <BecomeSeller />
      <Testimonials />
      <FAQ />
      <Newsletter />
    </MarketingLayout>
  );
}

function Hero() {
  return (
    <section className="container-prj pt-6 md:pt-10">
      {/* Redesigned Hero Banner Sage Green Card */}
      <div className="relative overflow-hidden rounded-[32px] bg-[#E9EFE9] border border-primary/5 p-8 md:p-16">
        {/* Background decorative leaf details */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 opacity-40">
          <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-accent/10 blur-2xl" />
        </div>

        <div className="grid items-center gap-10 md:grid-cols-[1.2fr_1fr] lg:gap-14">
          <div className="animate-fade-up space-y-6 md:space-y-8">
            <span className="font-subhead inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
              </span>
              Now delivering fresh across India
            </span>

            <h1 className="font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-[#0F3D2E] sm:text-5xl md:text-6xl lg:text-7xl">
              From Soil to Soul, <br />
              <span className="text-primary italic font-serif font-normal">Naturally.</span>
            </h1>

            <p className="max-w-md text-sm md:text-base text-[#2E423A] font-medium leading-relaxed">
              Authentic farm produce sourced directly from trusted farmers. Every harvest carries a name, a place, and lab-tested traceablity.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/shop"
                className="font-subhead group inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-xs font-semibold uppercase tracking-wider text-primary-foreground shadow-lg hover:shadow-xl hover:opacity-95 transition-all duration-300 active:scale-95 cursor-pointer"
              >
                Shop Now
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                to="/farmers"
                className="font-subhead inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/50 backdrop-blur px-7 py-3.5 text-xs font-semibold uppercase tracking-wider text-primary hover:bg-secondary transition-colors duration-300 cursor-pointer"
              >
                Meet Our Farmers
              </Link>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-4 border-t border-primary/10 pt-6 max-w-sm">
              {[
                { k: "100+", v: "Trusted Farmers" },
                { k: "100%", v: "Natural Sourced" },
                { k: "4.9★", v: "Customer Rating" },
              ].map((s) => (
                <div key={s.v}>
                  <p className="font-display text-lg font-bold text-[#0F3D2E]">{s.k}</p>
                  <p className="font-subhead text-[9px] uppercase tracking-wider text-muted-foreground mt-0.5">{s.v}</p>
                </div>
              ))}
            </div>
          </div>

          <Reveal delay={120} y={15} className="relative">
            <div className="relative overflow-hidden rounded-2xl bg-secondary shadow-lg aspect-[4/3] md:aspect-[5/4] border-2 border-background">
              <img
                src={heroImg}
                alt="Friendly Indian farmer smiling in a green field with organic crops"
                width={1200}
                height={960}
                className="h-full w-full object-cover"
                fetchPriority="high"
              />
              
              {/* Trust Badge */}
              <div className="absolute right-4 top-4">
                <div className="flex items-center gap-1.5 rounded-full bg-background/95 px-3 py-1 text-[10px] font-semibold text-primary shadow backdrop-blur">
                  <ShieldCheck className="h-3.5 w-3.5 text-success" /> Verified Source
                </div>
              </div>

              {/* Farmer Info overlay */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between rounded-xl bg-background/90 p-3.5 backdrop-blur shadow-md border border-border/20">
                <div>
                  <p className="font-subhead text-[9px] uppercase tracking-[0.16em] text-muted-foreground">Harvest Partner</p>
                  <p className="font-display text-sm font-semibold text-foreground">Ramesh Kumar · Palampur, HP</p>
                </div>
                <Link
                  to="/farmers"
                  className="font-subhead inline-flex items-center gap-1 rounded-full bg-[#0F3D2E] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground hover:opacity-90 transition"
                >
                  Profile
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function PressStrip() {
  const items = [
    "The Hindu",
    "Vogue India",
    "Mint Lounge",
    "YourStory",
    "Forbes India",
    "Conde Nast Traveller",
    "LBB",
    "Architectural Digest",
  ];
  const row = [...items, ...items];
  return (
    <section className="mt-20 border-y border-border bg-secondary/40 py-6">
      <div className="container-prj mb-3 flex items-center justify-between">
        <p className="font-subhead text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          As featured in
        </p>
        <p className="font-subhead text-[11px] uppercase tracking-[0.18em] text-muted-foreground hidden sm:block">
          2024 · 2025 · 2026
        </p>
      </div>
      <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        <div className="flex w-max gap-14 animate-marquee whitespace-nowrap pr-14">
          {row.map((p, i) => (
            <span key={i} className="font-display text-xl font-medium text-foreground/55">
              {p}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhyUs() {
  const items = [
    {
      icon: ShieldCheck,
      t: "Verified Farmers",
      d: "Every seller is vetted and traceable to a real farm.",
    },
    { icon: Leaf, t: "Natural Products", d: "No synthetic additives. No fillers. No shortcuts." },
    { icon: Sprout, t: "Secure Payments", d: "UPI, cards, COD. Razorpay-secured checkout." },
    { icon: Truck, t: "India-Wide Delivery", d: "Carefully packed. Tracked. Delivered fresh." },
  ];
  return (
    <section className="container-prj mt-24">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map(({ icon: Icon, t, d }, i) => (
          <Reveal key={t} delay={i * 90}>
            <div className="group relative h-full overflow-hidden rounded-2xl border border-border bg-background p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_-20px_oklch(0.34_0.06_156_/_0.35)]">
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/5 transition-transform duration-500 group-hover:scale-125" />
              <div className="relative">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-display mt-4 text-lg font-medium">{t}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{d}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function ShopByCategory() {
  return (
    <section className="container-prj mt-24">
      <Reveal>
        <SectionHeader
          eyebrow="Categories"
          title="Shop by category"
          subtitle="Nine carefully curated families of produce. Each one sourced from a farmer with a name."
          action={
            <Link
              to="/shop"
              className="font-subhead inline-flex items-center gap-1 text-sm font-medium text-primary hover:opacity-80"
            >
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          }
        />
      </Reveal>
      <div className="mt-10 grid grid-cols-3 gap-6 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9 justify-center">
        {categories.map((c, i) => (
          <Reveal key={c.slug} delay={i * 50}>
            <CategoryTile category={c} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: "01",
      icon: MapPin,
      t: "We find the farmer",
      d: "We travel to remote villages and meet growers with generational expertise.",
    },
    {
      n: "02",
      icon: ShieldCheck,
      t: "Verify & lab-test",
      d: "Soil, water, and product samples are tested before a single jar ships.",
    },
    {
      n: "03",
      icon: PackageCheck,
      t: "Carefully packed",
      d: "Sealed at source. Each pack carries the farmer's name, batch, and harvest date.",
    },
    {
      n: "04",
      icon: HandHeart,
      t: "Delivered to you",
      d: "Tracked logistics across India. From a Himalayan field to your kitchen.",
    },
  ];
  return (
    <section className="container-prj mt-24">
      <Reveal>
        <SectionHeader eyebrow="How it works" title="Soil to soul, in four steps." />
      </Reveal>
      <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => (
          <Reveal key={s.n} delay={i * 100}>
            <div className="relative h-full rounded-2xl border border-border bg-background p-6">
              <span className="font-display absolute right-5 top-5 text-3xl font-semibold text-primary/15">
                {s.n}
              </span>
              <s.icon className="h-5 w-5 text-primary" />
              <h3 className="font-display mt-4 text-lg font-medium">{s.t}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{s.d}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function FeaturedFarmers() {
  const { data: dbFarmers = [] } = useQuery({
    queryKey: ["public-all-farmers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("farmer_profiles")
        .select("id,full_name,farm_name,village,state,crops,headline,story,portrait_url,slug,years_farming,farming_method")
        .eq("status", "approved");
      if (error) throw error;
      return data ?? [];
    },
  });

  const mappedDbFarmers = useMemo(() => {
    return dbFarmers.map((f: any) => ({
      slug: f.slug || "unknown",
      name: f.full_name,
      image: f.portrait_url || "",
      village: f.village || "India",
      state: f.state || "Farm",
      region: "Local Farm",
      yearsExperience: f.years_farming || 0,
      method: f.farming_method || "Natural Farming",
      storyPreview: f.headline || "",
      story: f.story || "",
      upcomingHarvests: f.crops || [],
      productSlugs: [],
    }));
  }, [dbFarmers]);

  const combinedFarmers = useMemo(() => {
    return [...farmers, ...mappedDbFarmers];
  }, [mappedDbFarmers]);

  return (
    <section className="container-prj mt-24">
      <Reveal>
        <SectionHeader
          eyebrow="Featured farmers"
          title="The people behind your produce."
          subtitle="Real farmers, real stories, real fields. Tap any portrait to read theirs."
          action={
            <Link
              to="/farmers"
              className="font-subhead inline-flex items-center gap-1 text-sm font-medium text-primary hover:opacity-80"
            >
              Meet all farmers <ArrowRight className="h-4 w-4" />
            </Link>
          }
        />
      </Reveal>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {combinedFarmers.map((f, i) => (
          <Reveal key={f.slug} delay={(i % 4) * 90}>
            <FarmerCard farmer={f as any} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function Trending() {
  // Take exactly 5 products for a clean single-row presentation
  const items = trendingProducts().slice(0, 5);
  return (
    <section className="container-prj mt-24">
      <Reveal>
        <SectionHeader
          eyebrow="Trending"
          title="Trending Products"
          action={
            <Link
              to="/shop"
              className="font-subhead inline-flex items-center gap-1 text-sm font-medium text-primary hover:opacity-80"
            >
              Shop all <ArrowRight className="h-4 w-4" />
            </Link>
          }
        />
      </Reveal>
      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {items.map((p, i) => (
          <Reveal key={p.slug} delay={(i % 5) * 80}>
            <ProductCard product={p} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function ImpactStats() {
  const stats = [
    { k: "₹3.2 Cr", v: "Paid directly to farmers" },
    { k: "120+", v: "Verified farming partners" },
    { k: "18", v: "States sourced from" },
    { k: "42,000", v: "Happy households" },
  ];
  return (
    <section className="container-prj mt-24">
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl border border-border bg-secondary/50 p-8 md:p-14">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute -top-20 right-10 h-64 w-64 rounded-full bg-accent/15 blur-3xl" />
            <div className="absolute bottom-0 left-10 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
          </div>
          <div className="relative grid items-end gap-10 md:grid-cols-[1fr_2fr]">
            <div>
              <p className="font-subhead text-xs uppercase tracking-[0.18em] text-primary">
                Our impact
              </p>
              <h2 className="font-display mt-3 text-3xl font-semibold leading-[1.05] md:text-4xl">
                Numbers that go back to the soil.
              </h2>
            </div>
            <dl className="grid grid-cols-2 gap-y-8 md:grid-cols-4">
              {stats.map((s, i) => (
                <Reveal key={s.v} delay={i * 80}>
                  <dt className="font-display text-3xl font-semibold md:text-4xl">{s.k}</dt>
                  <dd className="font-subhead mt-1 text-xs uppercase tracking-[0.12em] text-muted-foreground">
                    {s.v}
                  </dd>
                </Reveal>
              ))}
            </dl>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function Seasonal() {
  const items = seasonalProducts();
  return (
    <section className="container-prj mt-24">
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl bg-primary text-primary-foreground">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute -top-32 -right-20 h-96 w-96 rounded-full bg-accent/30 blur-3xl animate-blob" />
            <div
              className="absolute -bottom-20 left-10 h-72 w-72 rounded-full bg-primary-foreground/10 blur-3xl animate-blob"
              style={{ animationDelay: "-8s" }}
            />
          </div>
          <div className="relative grid items-center gap-10 p-8 md:grid-cols-2 md:p-14">
            <div>
              <p className="font-subhead text-xs uppercase tracking-[0.18em] text-accent">
                In season now
              </p>
              <h2 className="font-display mt-3 text-4xl font-semibold leading-[1.05] md:text-5xl">
                Seasonal produce, at its&nbsp;peak.
              </h2>
              <p className="mt-3 max-w-md text-sm opacity-85">
                Limited harvests, available only while they last. When the season ends, they're gone
                until next year.
              </p>
              <Link
                to="/shop"
                className="font-subhead mt-6 inline-flex items-center gap-2 rounded-full bg-background px-5 py-2.5 text-sm font-medium text-foreground transition-all hover:-translate-y-0.5 hover:shadow-lg"
              >
                Browse seasonal <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {items.slice(0, 4).map((p, i) => (
                <Reveal key={p.slug} delay={i * 90}>
                  <Link
                    to="/product/$slug"
                    params={{ slug: p.slug }}
                    className="group block overflow-hidden rounded-2xl bg-background/10"
                  >
                    <div className="aspect-square overflow-hidden">
                      <img
                        src={p.image}
                        alt={p.name}
                        loading="lazy"
                        width={400}
                        height={400}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.08]"
                      />
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function SourcingMap() {
  const regions = [
    { p: "Ladakh", c: "Apricots, salt" },
    { p: "Himachal", c: "Apples, walnuts" },
    { p: "Uttarakhand", c: "Honey, rajma" },
    { p: "Rajasthan", c: "Mustard, millets" },
    { p: "Gujarat", c: "Pickles, ghee" },
    { p: "Maharashtra", c: "Turmeric, mangoes" },
    { p: "Karnataka", c: "Coffee, spices" },
    { p: "Kerala", c: "Black pepper, oils" },
  ];
  return (
    <section className="container-prj mt-24">
      <Reveal>
        <SectionHeader
          eyebrow="Sourcing map"
          title="Where your jars come from."
          subtitle="From the Himalayas to the Western Ghats, traced to the village."
        />
      </Reveal>
      <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {regions.map((r, i) => (
          <Reveal key={r.p} delay={(i % 4) * 70}>
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-background p-4 transition-colors hover:bg-secondary/50">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-accent/15 text-accent">
                <MapPin className="h-4 w-4" />
              </span>
              <div>
                <p className="font-display font-medium">{r.p}</p>
                <p className="text-xs text-muted-foreground">{r.c}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function BecomeSeller() {
  return (
    <section className="container-prj mt-24">
      <Reveal>
        <div className="grid items-center gap-10 rounded-3xl border border-border bg-secondary/40 p-8 md:grid-cols-2 md:p-14">
          <div>
            <p className="font-subhead text-xs uppercase tracking-[0.18em] text-primary">
              For farmers
            </p>
            <h2 className="font-display mt-3 text-3xl font-semibold leading-[1.05] md:text-4xl">
              Sell directly to families across India.
            </h2>
            <p className="mt-3 max-w-md text-sm text-muted-foreground">
              Keep more of every rupee. We handle the storefront, payments, and logistics. You focus
              on the soil.
            </p>
            <Link
              to="/become-a-seller"
              className="font-subhead mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              Start onboarding <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {[
              "Zero listing fees",
              "Monthly settlements",
              "Pan-India logistics",
              "Marketing support",
              "Farmer story page",
              "Dedicated dashboard",
            ].map((b, i) => (
              <Reveal
                as="li"
                key={b}
                delay={i * 60}
                className="font-subhead flex items-center gap-2 rounded-xl bg-background p-3 text-sm"
              >
                <span className="grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground">
                  <svg
                    className="h-3 w-3"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <path d="M5 12l5 5L20 7" />
                  </svg>
                </span>
                {b}
              </Reveal>
            ))}
          </ul>
        </div>
      </Reveal>
    </section>
  );
}

function Testimonials() {
  return (
    <section className="container-prj mt-24">
      <Reveal>
        <SectionHeader eyebrow="Customer love" title="What people say." align="center" />
      </Reveal>
      <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {testimonials.map((t, i) => (
          <Reveal key={t.id} delay={(i % 4) * 90}>
            <figure className="relative h-full overflow-hidden rounded-2xl border border-border bg-background p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <Quote className="absolute right-4 top-4 h-8 w-8 text-primary/10" />
              <div className="flex items-center gap-0.5 text-accent">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-accent" />
                ))}
              </div>
              <blockquote className="mt-4 text-sm leading-relaxed text-foreground/85">
                "{t.text}"
              </blockquote>
              <figcaption className="font-subhead mt-5 text-xs uppercase tracking-[0.12em] text-muted-foreground">
                {t.author} · {t.location}
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function FAQ() {
  const items = [
    {
      q: "How do you verify farmers?",
      a: "Each farmer goes through a 4-step onboarding: site visit, document verification, soil/water reports, and lab-tested product samples before going live.",
    },
    {
      q: "Is everything organic?",
      a: "We source natural, chemical-free produce. Many products are certified organic; certifications are listed on each product page.",
    },
    {
      q: "Do you deliver across India?",
      a: "Yes. We deliver to 20,000+ pin codes via trusted logistics partners. Most orders ship within 48 hours of harvest packing.",
    },
    {
      q: "What if my order arrives damaged?",
      a: "We offer a 100% refund or replacement on damaged items, no questions asked. Just share a photo within 48 hours of delivery.",
    },
    {
      q: "Can I subscribe to monthly orders?",
      a: "Subscriptions are rolling out in our next release. Meanwhile, our 'Restock reminder' will email you when your favourites are back.",
    },
  ];
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="container-prj mt-24">
      <Reveal>
        <SectionHeader eyebrow="FAQ" title="Questions, answered." />
      </Reveal>
      <div className="mt-10 mx-auto max-w-3xl divide-y divide-border rounded-3xl border border-border bg-background">
        {items.map((item, i) => {
          const isOpen = open === i;
          const panelId = `faq-panel-${i}`;
          const btnId = `faq-btn-${i}`;
          return (
            <div key={item.q}>
              <h3 className="m-0">
                <button
                  id={btnId}
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-secondary/30 focus-visible:bg-secondary/30"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                >
                  <span className="font-display text-base font-medium">{item.q}</span>
                  <span
                    aria-hidden
                    className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border border-border text-sm transition-transform ${isOpen ? "rotate-45 bg-primary text-primary-foreground border-primary" : ""}`}
                  >
                    +
                  </span>
                </button>
              </h3>
              <div
                id={panelId}
                role="region"
                aria-labelledby={btnId}
                aria-hidden={!isOpen}
                style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                className="grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none"
              >
                <div className="overflow-hidden">
                  <p className="px-6 pb-5 text-sm leading-relaxed text-muted-foreground">
                    {item.a}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Newsletter() {
  const [email, setEmail] = useState("");
  return (
    <section className="container-prj my-24">
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-secondary/70 via-background to-secondary/40 p-10 md:p-14">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute -top-20 -left-10 h-64 w-64 rounded-full bg-primary/10 blur-3xl animate-blob" />
            <div
              className="absolute -bottom-24 -right-10 h-72 w-72 rounded-full bg-accent/20 blur-3xl animate-blob"
              style={{ animationDelay: "-9s" }}
            />
          </div>
          <div className="relative mx-auto max-w-2xl text-center">
            <p className="font-subhead text-xs uppercase tracking-[0.18em] text-primary">
              Stay in the loop
            </p>
            <h2 className="font-display mt-3 text-3xl font-semibold leading-[1.1] md:text-4xl">
              New harvests. Farmer stories. Quiet inbox.
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              One thoughtful email a month. Unsubscribe anytime.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!email) return;
                toast.success("Welcome to the field. Check your inbox.");
                setEmail("");
              }}
              className="mt-7 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-center"
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@harvest.in"
                className="font-subhead w-full rounded-full border border-border bg-background px-5 py-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring sm:w-80"
              />
              <button
                type="submit"
                className="font-subhead inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow-lg"
              >
                Subscribe <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
