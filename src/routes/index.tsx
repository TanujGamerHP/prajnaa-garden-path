import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Leaf, ShieldCheck, Truck, Sprout, Star } from "lucide-react";
import heroImg from "@/assets/hero.jpg";
import { MarketingLayout } from "@/components/marketing/layout";
import { SectionHeader } from "@/components/store/section-header";
import { CategoryTile } from "@/components/store/category-tile";
import { FarmerCard } from "@/components/store/farmer-card";
import { ProductCard } from "@/components/store/product-card";
import { categories } from "@/lib/mock/categories";
import { farmers } from "@/lib/mock/farmers";
import { trendingProducts, seasonalProducts } from "@/lib/mock/products";
import { testimonials } from "@/lib/mock/reviews";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Prajnaa Farm — From Soil to Soul, Naturally" },
      { name: "description", content: "A premium farm-to-consumer marketplace. Verified farmers, natural products, traceable to the soil." },
      { property: "og:title", content: "Prajnaa Farm — From Soil to Soul, Naturally" },
      { property: "og:description", content: "Verified farmers, natural products, traceable to the soil." },
      { property: "og:url", content: "/" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <MarketingLayout>
      <Hero />
      <WhyUs />
      <ShopByCategory />
      <FeaturedFarmers />
      <Trending />
      <Seasonal />
      <BecomeSeller />
      <Testimonials />
    </MarketingLayout>
  );
}

function Hero() {
  return (
    <section className="container-prj pt-10 md:pt-16">
      <div className="grid items-center gap-10 md:grid-cols-2 md:gap-14">
        <div className="animate-fade-up">
          <p className="font-subhead inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-foreground/75">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Now serving across India
          </p>
          <h1 className="font-display mt-5 text-5xl font-semibold leading-[1.02] tracking-tight md:text-6xl lg:text-7xl">
            From Soil to&nbsp;Soul,
            <br />
            <span className="text-primary">Naturally.</span>
          </h1>
          <p className="mt-5 max-w-md text-base text-muted-foreground md:text-lg">
            Authentic farm produce sourced directly from trusted farmers. Every jar carries a name, a place, and a harvest date.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/shop"
              className="font-subhead group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-all hover:opacity-90"
            >
              Shop now
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              to="/become-a-seller"
              className="font-subhead inline-flex items-center gap-2 rounded-full border border-border bg-background px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
            >
              Become a Farmer Partner
            </Link>
          </div>
          <dl className="mt-10 grid grid-cols-3 gap-6 border-t border-border pt-8 md:max-w-md">
            {[
              { k: "120+", v: "Verified farmers" },
              { k: "9", v: "Categories" },
              { k: "4.9", v: "Avg rating" },
            ].map((s) => (
              <div key={s.v}>
                <dt className="font-display text-2xl font-semibold">{s.k}</dt>
                <dd className="font-subhead mt-1 text-xs uppercase tracking-[0.12em] text-muted-foreground">{s.v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="relative">
          <div className="relative overflow-hidden rounded-[28px] bg-secondary">
            <img
              src={heroImg}
              alt="Farmer hands holding fresh produce"
              width={1600}
              height={1200}
              fetchPriority="high"
              className="aspect-[5/6] h-full w-full object-cover md:aspect-[4/5]"
            />
            <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between rounded-2xl bg-background/95 p-4 backdrop-blur">
              <div>
                <p className="font-subhead text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Harvested by</p>
                <p className="font-display text-base font-medium">Ramesh Singh · Hunza, Ladakh</p>
              </div>
              <Link
                to="/farmer/$slug"
                params={{ slug: "ramesh-singh" }}
                className="font-subhead inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
              >
                Story <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function WhyUs() {
  const items = [
    { icon: ShieldCheck, t: "Verified Farmers", d: "Every seller is vetted and traceable to a real farm." },
    { icon: Leaf, t: "Natural Products", d: "No synthetic additives. No fillers. No shortcuts." },
    { icon: Sprout, t: "Secure Payments", d: "UPI, cards, COD. Razorpay-secured checkout." },
    { icon: Truck, t: "India-Wide Delivery", d: "Carefully packed. Tracked. Delivered fresh." },
  ];
  return (
    <section className="container-prj mt-24">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map(({ icon: Icon, t, d }) => (
          <div key={t} className="rounded-2xl border border-border bg-background p-6">
            <Icon className="h-5 w-5 text-primary" />
            <h3 className="font-display mt-4 text-lg font-medium">{t}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ShopByCategory() {
  return (
    <section className="container-prj mt-24">
      <SectionHeader
        eyebrow="Categories"
        title="Shop by category"
        subtitle="Nine carefully curated families of produce. Each one sourced from a farmer with a name."
        action={
          <Link to="/shop" className="font-subhead inline-flex items-center gap-1 text-sm font-medium text-primary hover:opacity-80">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />
      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {categories.map((c) => (
          <CategoryTile key={c.slug} category={c} />
        ))}
      </div>
    </section>
  );
}

function FeaturedFarmers() {
  return (
    <section className="container-prj mt-24">
      <SectionHeader
        eyebrow="Featured farmers"
        title="The people behind your produce."
        subtitle="Real farmers, real stories, real fields. Tap any portrait to read theirs."
        action={
          <Link to="/farmers" className="font-subhead inline-flex items-center gap-1 text-sm font-medium text-primary hover:opacity-80">
            Meet all farmers <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {farmers.map((f) => (
          <FarmerCard key={f.slug} farmer={f} />
        ))}
      </div>
    </section>
  );
}

function Trending() {
  const items = trendingProducts();
  return (
    <section className="container-prj mt-24">
      <SectionHeader
        eyebrow="Trending"
        title="What people are buying."
        action={
          <Link to="/shop" className="font-subhead inline-flex items-center gap-1 text-sm font-medium text-primary hover:opacity-80">
            Shop all <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((p) => (
          <ProductCard key={p.slug} product={p} />
        ))}
      </div>
    </section>
  );
}

function Seasonal() {
  const items = seasonalProducts();
  return (
    <section className="container-prj mt-24">
      <div className="overflow-hidden rounded-3xl bg-primary text-primary-foreground">
        <div className="grid items-center gap-10 p-8 md:grid-cols-2 md:p-14">
          <div>
            <p className="font-subhead text-xs uppercase tracking-[0.18em] text-accent">In season now</p>
            <h2 className="font-display mt-3 text-4xl font-semibold leading-[1.05] md:text-5xl">
              Seasonal produce, at its&nbsp;peak.
            </h2>
            <p className="mt-3 max-w-md text-sm opacity-85">
              Limited harvests, available only while they last. When the season ends, they're gone until next year.
            </p>
            <Link
              to="/shop"
              className="font-subhead mt-6 inline-flex items-center gap-2 rounded-full bg-background px-5 py-2.5 text-sm font-medium text-foreground transition-opacity hover:opacity-90"
            >
              Browse seasonal <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {items.slice(0, 4).map((p) => (
              <Link
                key={p.slug}
                to="/product/$slug"
                params={{ slug: p.slug }}
                className="group block overflow-hidden rounded-2xl bg-background/10"
              >
                <div className="aspect-square overflow-hidden">
                  <img src={p.image} alt={p.name} loading="lazy" width={400} height={400} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function BecomeSeller() {
  return (
    <section className="container-prj mt-24">
      <div className="grid items-center gap-10 rounded-3xl border border-border bg-secondary/40 p-8 md:grid-cols-2 md:p-14">
        <div>
          <p className="font-subhead text-xs uppercase tracking-[0.18em] text-primary">For farmers</p>
          <h2 className="font-display mt-3 text-3xl font-semibold leading-[1.05] md:text-4xl">
            Sell directly to families across India.
          </h2>
          <p className="mt-3 max-w-md text-sm text-muted-foreground">
            Keep more of every rupee. We handle the storefront, payments, and logistics. You focus on the soil.
          </p>
          <Link
            to="/become-a-seller"
            className="font-subhead mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
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
          ].map((b) => (
            <li key={b} className="font-subhead flex items-center gap-2 rounded-xl bg-background p-3 text-sm">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground">
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12l5 5L20 7" /></svg>
              </span>
              {b}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section className="container-prj mt-24">
      <SectionHeader eyebrow="Customer love" title="What people say." align="center" />
      <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {testimonials.map((t) => (
          <figure key={t.id} className="rounded-2xl border border-border bg-background p-6">
            <div className="flex items-center gap-0.5 text-accent">
              {Array.from({ length: t.rating }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-accent" />
              ))}
            </div>
            <blockquote className="mt-4 text-sm leading-relaxed text-foreground/85">"{t.text}"</blockquote>
            <figcaption className="font-subhead mt-5 text-xs uppercase tracking-[0.12em] text-muted-foreground">
              {t.author} · {t.location}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
