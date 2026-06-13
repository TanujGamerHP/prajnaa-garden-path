import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Minus, Plus, Star, Truck, ShieldCheck, Sprout, Award, Heart, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { MarketingLayout } from "@/components/marketing/layout";
import { ProductCard } from "@/components/store/product-card";
import { productBySlug, productsByCategory } from "@/lib/mock/products";
import { farmerBySlug } from "@/lib/mock/farmers";
import { ProductReviews } from "@/components/store/product-reviews";
import { inr } from "@/lib/format";
import { useCart } from "@/lib/cart-store";

export const Route = createFileRoute("/product/$slug")({
  loader: async ({ params }) => {
    // 1. Try mock products first
    let product = productBySlug(params.slug);
    let farmer = product ? farmerBySlug(product.farmerSlug)! : null;
    let related = product ? productsByCategory(product.category).filter((p) => p.slug !== product!.slug).slice(0, 4) : [];

    if (!product) {
      // 2. Fallback to querying farmer_products database
      const { data: dbProduct } = await supabase
        .from("farmer_products")
        .select("*")
        .eq("slug", params.slug)
        .maybeSingle();

      if (dbProduct) {
        // Fetch farmer profile
        const { data: dbFarmer } = await supabase
          .from("farmer_profiles")
          .select("id,full_name,village,state,crops,headline,story,portrait_url,slug,farming_method")
          .eq("id", dbProduct.farmer_id)
          .maybeSingle();

        // Fetch related products from same category
        const { data: dbRelated } = await supabase
          .from("farmer_products")
          .select("*")
          .eq("category", dbProduct.category)
          .eq("status", "published")
          .limit(5);

        // Map database format to product page expectations + apply 10% commission markup
        product = {
          slug: dbProduct.slug,
          name: dbProduct.name,
          category: dbProduct.category,
          farmerSlug: dbFarmer?.slug || "unknown",
          image: dbProduct.images?.[0] || "",
          images: dbProduct.images || [],
          price: Math.ceil(Number(dbProduct.price || 0) * 1.10), // Adding 10% commission
          weight: dbProduct.unit || "unit",
          stock: Number(dbProduct.stock || 0),
          rating: 4.8,
          reviews: 0,
          description: dbProduct.description || "",
        } as any;

        farmer = dbFarmer ? {
          slug: dbFarmer.slug || "verified-farmer",
          name: dbFarmer.full_name || "Verified Farmer",
          image: dbFarmer.portrait_url || "",
          village: dbFarmer.village || "India",
          state: dbFarmer.state || "Farm",
          region: "Local Farm",
          storyPreview: dbFarmer.headline || "",
          story: dbFarmer.story || "",
          upcomingHarvests: dbFarmer.crops || [],
          method: dbFarmer.farming_method || "Natural Farming",
        } as any : null;

        related = (dbRelated || [])
          .filter((r: any) => r.id !== dbProduct.id)
          .slice(0, 4)
          .map((r: any) => ({
            slug: r.slug,
            name: r.name,
            category: r.category,
            farmerSlug: dbFarmer?.slug || "unknown",
            image: r.images?.[0] || "",
            price: Math.ceil(Number(r.price || 0) * 1.10), // Adding 10% commission
            weight: r.unit || "unit",
            rating: 4.8,
            reviews: 0,
          })) as any;
      }
    }

    if (product) {
      const { data: dbReviews } = await supabase
        .from("product_reviews")
        .select("rating")
        .eq("product_slug", product.slug);

      const reviewsCount = dbReviews?.length || 0;
      if (reviewsCount > 0) {
        const avgRating = Number((dbReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviewsCount).toFixed(1));
        product.rating = avgRating;
        product.reviews = reviewsCount;
      } else {
        product.rating = 4.8;
        product.reviews = 3;
      }
    }

    if (!product) throw notFound();
    return {
      product,
      farmer: farmer || {
        slug: "unknown",
        name: "Verified Farmer",
        image: "",
        village: "India",
        state: "Farm",
        region: "Local Farm",
        storyPreview: "",
        story: "",
        upcomingHarvests: [],
        method: "Natural Farming",
      },
      related,
    };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.product.name} — Prajnaa Farm` },
          { name: "description", content: loaderData.product.description },
          { property: "og:title", content: `${loaderData.product.name} — Prajnaa Farm` },
          { property: "og:description", content: loaderData.product.description },
          { property: "og:type", content: "product" },
          { property: "og:image", content: loaderData.product.image },
          { property: "og:url", content: `/product/${loaderData.product.slug}` },
        ]
      : [],
    links: loaderData ? [{ rel: "canonical", href: `/product/${loaderData.product.slug}` }] : [],
    scripts: loaderData
      ? [
          {
            type: "application/ld+json",
            children: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Product",
              name: loaderData.product.name,
              description: loaderData.product.description,
              image: loaderData.product.image,
              brand: { "@type": "Brand", name: "Prajnaa Farm" },
              offers: {
                "@type": "Offer",
                priceCurrency: "INR",
                price: loaderData.product.price,
                availability: "https://schema.org/InStock",
              },
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: loaderData.product.rating,
                reviewCount: loaderData.product.reviews,
              },
            }),
          },
        ]
      : [],
  }),
  component: ProductPage,
});

interface PackSizeOption {
  label: string;
  price: number;
  mrp: number;
  badge?: string;
}

interface BenefitItem {
  icon: React.ReactNode;
  text: string;
}

function getPackSizes(product: any): PackSizeOption[] {
  const basePrice = product.price;
  const weightLower = (product.weight || "").toLowerCase();
  
  // If it's ghee, honey, oil, juice or similar liquids
  const isLiquid =
    weightLower.includes("ml") ||
    weightLower.includes("litre") ||
    weightLower.includes("ltr") ||
    product.name.toLowerCase().includes("ghee") ||
    product.name.toLowerCase().includes("oil") ||
    product.name.toLowerCase().includes("honey") ||
    product.name.toLowerCase().includes("juice");
  
  if (isLiquid) {
    const baseMrp1 = Math.ceil(basePrice * 1.35);
    const baseMrp2 = Math.ceil(basePrice * 2.5);
    return [
      {
        label: "500 ml",
        price: basePrice,
        mrp: baseMrp1,
      },
      {
        label: "1 Litre Pack",
        price: Math.ceil(basePrice * 1.85),
        mrp: baseMrp2,
        badge: "Best Seller",
      }
    ];
  }
  
  // If it ends with g or kg (e.g. 100g, 200g, 500g, 1kg)
  const isGrams = weightLower.includes("g") && !weightLower.includes("kg");
  const isKg = weightLower.includes("kg");
  
  if (isGrams || isKg || product.category === "dry-fruits" || product.category === "nuts" || product.category === "seeds" || product.category === "spices" || product.category === "masalas" || product.category === "salts") {
    const price200g = isKg ? Math.ceil(basePrice * 0.25) : basePrice;
    const mrp200g = Math.ceil(price200g * 1.25);
    
    const price500g = Math.ceil(price200g * 2.2);
    const mrp500g = Math.ceil(price500g * 1.35);
    
    return [
      {
        label: "200 g",
        price: price200g,
        mrp: mrp200g,
      },
      {
        label: "500 g",
        price: price500g,
        mrp: mrp500g,
        badge: "Best Seller",
      }
    ];
  }
  
  // Default fallback
  return [
    {
      label: "1 Pack",
      price: basePrice,
      mrp: Math.ceil(basePrice * 1.2),
    },
    {
      label: "Pack of 2",
      price: Math.ceil(basePrice * 1.8),
      mrp: Math.ceil(basePrice * 2.4),
      badge: "Super Saver",
    }
  ];
}

function getKeyBenefits(product: any): BenefitItem[] {
  const nameLower = (product.name || "").toLowerCase();
  const isLiquid =
    nameLower.includes("ghee") ||
    nameLower.includes("oil") ||
    nameLower.includes("honey") ||
    nameLower.includes("juice");
  
  if (isLiquid) {
    return [
      {
        icon: <Sprout className="h-5 w-5" />,
        text: "100% natural, grass-fed & pure raw ingredients",
      },
      {
        icon: <Award className="h-5 w-5" />,
        text: "Tested on 600+ purity & chemical parameters",
      },
      {
        icon: <Heart className="h-5 w-5" />,
        text: "No synthetic additives, colors or hormones",
      },
    ];
  }
  
  return [
    {
      icon: <Sprout className="h-5 w-5" />,
      text: "Certified organic, pesticide-free harvest",
    },
    {
      icon: <Award className="h-5 w-5" />,
      text: "Tested on 600+ purity & heavy-metal parameters",
    },
    {
      icon: <Sparkles className="h-5 w-5" />,
      text: "Rich in antioxidants, essential vitamins & nutrients",
    },
  ];
}

function ProductPage() {
  const { product, farmer, related } = Route.useLoaderData();
  const [qty, setQty] = useState(1);
  const add = useCart((s) => s.add);
  const { user } = useAuth();

  const images =
    (product as any).images && (product as any).images.length > 0
      ? (product as any).images
      : [product.image];
  const [activeImage, setActiveImage] = useState(images[0]);

  // Dynamic Pack Sizes & Tabs
  const packSizes = getPackSizes(product);
  const [selectedSizeIdx, setSelectedSizeIdx] = useState(0);
  const [activeTab, setActiveTab] = useState<"description" | "how-to-use" | "manufacturer">("description");

  const currentSize = packSizes[selectedSizeIdx];
  const selectedPrice = currentSize.price;
  const selectedMrp = currentSize.mrp;
  const selectedUnit = currentSize.label;

  const benefits = getKeyBenefits(product);

  useEffect(() => {
    setActiveImage(images[0]);
    setSelectedSizeIdx(0);
  }, [product]);

  useEffect(() => {
    if (!user) return;
    void supabase
      .from("recently_viewed")
      .upsert(
        { user_id: user.id, product_slug: product.slug, viewed_at: new Date().toISOString() },
        { onConflict: "user_id,product_slug" },
      );
  }, [user, product.slug]);

  return (
    <MarketingLayout>
      <div className="container-prj pt-10 md:pt-14">
        <nav className="font-subhead mb-6 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">
            Home
          </Link>
          <span>/</span>
          <Link to="/shop" className="hover:text-foreground">
            Shop
          </Link>
          <span>/</span>
          <Link
            to="/category/$slug"
            params={{ slug: product.category }}
            className="hover:text-foreground capitalize"
          >
            {(product.category || "other").replace("-", " ")}
          </Link>
          <span>/</span>
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="grid gap-10 md:grid-cols-2 md:gap-14">
          <div className="space-y-4">
            <div className="overflow-hidden rounded-3xl bg-secondary border border-border">
              <img
                src={activeImage}
                alt={product.name}
                width={800}
                height={800}
                className="aspect-square w-full object-contain p-4 transition-all duration-300"
              />
            </div>
            {images.length > 1 && (
              <div className="flex gap-2.5 overflow-x-auto pb-2">
                {images.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImage(img)}
                    className={`h-16 w-16 rounded-xl overflow-hidden border-2 bg-secondary cursor-pointer transition-all ${
                      activeImage === img
                        ? "border-primary scale-95"
                        : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                  >
                      <img
                        src={img}
                        alt={`${product.name} ${idx + 1}`}
                        className="h-full w-full object-contain p-1"
                      />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <p className="font-subhead text-xs uppercase tracking-[0.18em] text-primary capitalize">
              {(product.category || "other").replace("-", " ")}
            </p>
            <h1 className="font-display mt-2 text-4xl font-semibold leading-[1.05] md:text-5xl">
              {product.name}
            </h1>
            <div className="mt-3 flex items-center gap-2 text-sm">
              <div className="flex items-center gap-1 text-accent">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${i < Math.round(product.rating) ? "fill-accent" : "opacity-30"}`}
                  />
                ))}
              </div>
              <span className="font-subhead">{product.rating}</span>
              <span className="text-muted-foreground">({product.reviews} reviews)</span>
            </div>

            <div className="mt-6 flex items-end gap-3">
              <span className="font-display text-3xl font-semibold">{inr(selectedPrice)}</span>
              {selectedMrp > selectedPrice && (
                <span className="text-base text-muted-foreground line-through">
                  {inr(selectedMrp)}
                </span>
              )}
              <span className="font-subhead text-sm text-[#1b8a4f] font-bold">/ {selectedUnit}</span>
            </div>

            <p className="mt-6 max-w-prose text-[15px] leading-relaxed text-foreground/80">
              {product.description}
            </p>

            {/* Pack Size Selector */}
            <div className="mt-6">
              <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Select Pack Size</h3>
              <div className="mt-3 flex flex-wrap gap-3">
                {packSizes.map((opt, idx) => {
                  const isActive = selectedSizeIdx === idx;
                  const saveAmount = opt.mrp - opt.price;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedSizeIdx(idx)}
                      className={`relative flex flex-col w-36 overflow-hidden rounded-2xl border transition-all text-left cursor-pointer ${
                        isActive
                          ? "border-[#1b8a4f] shadow-md scale-[1.02]"
                          : "border-border hover:border-muted-foreground/50 hover:shadow-sm"
                      }`}
                    >
                      {opt.badge && (
                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-[#dca842] px-2.5 py-0.5 text-[8px] font-bold text-white uppercase tracking-wider shadow-sm z-10 whitespace-nowrap">
                          {opt.badge}
                        </span>
                      )}
                      <div
                        className={`px-3 py-1.5 text-center text-xs font-bold font-subhead transition-colors ${
                          isActive ? "bg-[#1b8a4f] text-white" : "bg-[#f2eadc] text-foreground/80"
                        }`}
                      >
                        {opt.label}
                      </div>
                      <div className="flex flex-col items-center justify-center bg-[#faf8f5] p-2.5 text-center flex-1 w-full">
                        <div className="flex flex-wrap items-center gap-1 justify-center">
                          <span className="font-semibold text-sm text-foreground">{inr(opt.price)}</span>
                          {opt.mrp > opt.price && (
                            <span className="text-[10px] text-muted-foreground line-through">
                              {inr(opt.mrp)}
                            </span>
                          )}
                        </div>
                        {saveAmount > 0 && (
                          <span className="mt-1.5 inline-block rounded-full bg-black px-2 py-0.5 text-[9px] font-bold text-white font-subhead">
                            Save {inr(saveAmount)}/-
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Key Benefits */}
            <div className="mt-6 border-t border-border pt-5">
              <h4 className="font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground">Key Benefits</h4>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {benefits.map((b, idx) => (
                  <div key={idx} className="flex flex-col items-center text-center gap-2 rounded-2xl border border-[#f0e6d2] bg-[#fdfbf7] p-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f5efe4] text-primary">
                      {b.icon}
                    </div>
                    <span className="text-[10px] font-medium text-foreground/80 leading-normal">{b.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {product.badges?.map((b: string) => (
                <span
                  key={b}
                  className="font-subhead rounded-full bg-secondary px-3 py-1 text-[11px] uppercase tracking-[0.12em] text-foreground/75"
                >
                  {b}
                </span>
              ))}
            </div>

            <div className="mt-8 flex items-center gap-3">
              <div className="flex h-12 items-center rounded-full border border-border">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  aria-label="Decrease"
                  className="grid h-12 w-12 place-items-center text-muted-foreground hover:text-foreground"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="font-subhead w-8 text-center text-sm">{qty}</span>
                <button
                  onClick={() => setQty(qty + 1)}
                  aria-label="Increase"
                  className="grid h-12 w-12 place-items-center text-muted-foreground hover:text-foreground"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <button
                onClick={() => {
                  add(
                    {
                      slug: `${product.slug}-${selectedUnit.replace(/\s+/g, "").toLowerCase()}`,
                      name: `${product.name} (${selectedUnit})`,
                      image: product.image,
                      price: selectedPrice,
                      weight: selectedUnit,
                      baseSlug: product.slug,
                    } as any,
                    qty,
                  );
                  toast.success(`${product.name} (${selectedUnit}) added to cart`);
                }}
                className="font-subhead h-12 flex-1 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                Add to cart
              </button>
              <Link
                to="/checkout"
                onClick={() =>
                  add(
                    {
                      slug: `${product.slug}-${selectedUnit.replace(/\s+/g, "").toLowerCase()}`,
                      name: `${product.name} (${selectedUnit})`,
                      image: product.image,
                      price: selectedPrice,
                      weight: selectedUnit,
                      baseSlug: product.slug,
                    } as any,
                    qty,
                  )
                }
                className="font-subhead h-12 inline-flex items-center justify-center rounded-full border border-border px-6 text-sm font-medium transition-colors hover:bg-secondary"
              >
                Buy now
              </Link>
            </div>

            <ul className="mt-8 grid gap-3 sm:grid-cols-3">
              <li className="font-subhead flex items-center gap-2 text-xs text-muted-foreground">
                <Truck className="h-4 w-4 text-primary" /> Free shipping above ₹999
              </li>
              <li className="font-subhead flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" /> Quality guarantee
              </li>
              <li className="font-subhead flex items-center gap-2 text-xs text-muted-foreground">
                <Sprout className="h-4 w-4 text-primary" /> Naturally grown
              </li>
            </ul>

            {/* Farmer card */}
            <Link
              to="/farmer/$slug"
              params={{ slug: farmer.slug }}
              className="mt-8 flex items-center gap-4 rounded-2xl border border-border bg-secondary/50 p-4 transition-colors hover:bg-secondary"
            >
              <img
                src={farmer.image}
                alt={farmer.name}
                className="h-14 w-14 rounded-full object-cover"
              />
              <div className="flex-1">
                <p className="font-subhead text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  Grown by
                </p>
                <p className="font-display text-base font-medium">{farmer.name}</p>
                <p className="text-xs text-muted-foreground">
                  {farmer.village}, {farmer.state} · {farmer.method}
                </p>
              </div>
              <span className="font-subhead text-xs text-primary">Read story →</span>
            </Link>
          </div>
        </div>

        {/* Product Info Tabs & Step Process */}
        <div className="mt-16 border-t border-border pt-10">
          <div className="flex flex-wrap border-b border-border justify-center sm:justify-start gap-2">
            {[
              { id: "description", label: "Description" },
              { id: "how-to-use", label: "How to Use" },
              { id: "manufacturer", label: "Manufacturer Information" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`font-subhead px-6 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="py-8">
            {activeTab === "description" && (
              <div className="max-w-3xl space-y-4">
                <p className="text-sm leading-relaxed text-foreground/80 whitespace-pre-line">
                  {product.description || "No description available."}
                </p>
                <div className="mt-4 grid gap-2.5 sm:grid-cols-2 text-xs">
                  <div className="flex justify-between border-b border-border/60 py-1.5">
                    <span className="text-muted-foreground">Category</span>
                    <span className="font-semibold capitalize">{product.category}</span>
                  </div>
                  <div className="flex justify-between border-b border-border/60 py-1.5">
                    <span className="text-muted-foreground">Verification status</span>
                    <span className="font-semibold text-success flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5" /> PGS-India Certified
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "how-to-use" && (
              <div className="max-w-2xl space-y-4 text-sm leading-relaxed text-foreground/80">
                <h4 className="font-display font-semibold text-foreground">Usage Directions:</h4>
                <p>
                  {product.category === "dry-fruits" || product.category === "nuts" || product.category === "seeds"
                    ? "Enjoy as a healthy standalone snack, mix with breakfast cereals like muesli or oats, or use as a topping for desserts and salads."
                    : product.category === "spices" || product.category === "masalas" || product.category === "salts"
                      ? "Add to hot oil or ghee at the beginning of cooking to release aromatic essential oils, or sprinkle over finished dishes for direct seasoning."
                      : "Add to daily cooking, tea, hot milk, or warm water. Store in a cool, dry place away from direct sunlight in an airtight container."}
                </p>
                <ul className="list-disc pl-5 space-y-1 text-xs text-muted-foreground">
                  <li>Store in an airtight container once opened.</li>
                  <li>Keep away from moisture and direct sunlight.</li>
                  <li>Always use a clean, dry spoon to avoid contamination.</li>
                </ul>
              </div>
            )}

            {activeTab === "manufacturer" && (
              <div className="max-w-2xl overflow-hidden rounded-2xl border border-[#f0e6d2] bg-[#fdfbf7]">
                <table className="w-full text-left text-sm">
                  <tbody>
                    <tr className="border-b border-[#f0e6d2]/60">
                      <td className="px-5 py-3.5 font-medium text-muted-foreground bg-[#faf6ed]/50 w-1/3">Grown By</td>
                      <td className="px-5 py-3.5 font-semibold text-foreground">{farmer.name}</td>
                    </tr>
                    <tr className="border-b border-[#f0e6d2]/60">
                      <td className="px-5 py-3.5 font-medium text-muted-foreground bg-[#faf6ed]/50">Farm Location</td>
                      <td className="px-5 py-3.5 text-foreground">{farmer.village}, {farmer.state}</td>
                    </tr>
                    <tr className="border-b border-[#f0e6d2]/60">
                      <td className="px-5 py-3.5 font-medium text-muted-foreground bg-[#faf6ed]/50">Farming Method</td>
                      <td className="px-5 py-3.5 text-foreground capitalize">{farmer.method || "Natural Farming"}</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-3.5 font-medium text-muted-foreground bg-[#faf6ed]/50">Traceability ID</td>
                      <td className="px-5 py-3.5 text-xs text-primary font-mono font-semibold">PRJ-{farmer.slug.toUpperCase()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* 4-Step Production Process */}
        <div className="mt-8 mb-16 overflow-hidden rounded-3xl bg-primary text-primary-foreground p-8 md:p-12 relative shadow-lg">
          <div className="relative z-10 text-center max-w-2xl mx-auto">
            <h3 className="font-display text-2xl md:text-3xl font-semibold leading-tight text-white">
              Organic From The Start, Nourishing To The Last
            </h3>
            <p className="font-subhead text-xs tracking-widest text-[#dca842] mt-2 font-bold uppercase">
              With 0 Chemical Intervention
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 relative z-10">
            {[
              {
                step: "Step 1",
                title: "Sourced Organically",
                desc: "Raw ingredients collected from pesticide-free, certified local Indian farms.",
              },
              {
                step: "Step 2",
                title: "Quality Tested",
                desc: "Tested thoroughly to ensure it passes all organic purity and heavy metal parameters.",
              },
              {
                step: "Step 3",
                title: "Hygienically Processed",
                desc: "Meticulously processed and churned in a temperature-controlled environment.",
              },
              {
                step: "Step 4",
                title: "Pure & Authentic",
                desc: "Delivered fresh to ensure you get the highest quality authentic nutrition.",
              },
            ].map((s, idx) => (
              <div key={idx} className="rounded-2xl bg-white/10 backdrop-blur-md p-5 border border-white/10 flex flex-col items-center text-center">
                <span className="font-subhead text-[10px] uppercase font-bold text-[#dca842] tracking-wider">{s.step}</span>
                <h4 className="font-display font-semibold text-white mt-1.5 text-sm">{s.title}</h4>
                <p className="text-white/80 text-[11px] mt-2 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Reviews Section */}
        <ProductReviews productSlug={product.slug} />

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-20">
            <h2 className="font-display text-2xl font-semibold">You may also like</h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((p: (typeof related)[number]) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </MarketingLayout>
  );
}
