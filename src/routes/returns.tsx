import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/marketing/layout";
import { PageHero } from "@/components/marketing/page-hero";
import { LegalArticle } from "@/components/marketing/legal-article";

export const Route = createFileRoute("/returns")({
  head: () => ({
    meta: [
      { title: "Returns & refunds — Prajnaa Farm" },
      { name: "description", content: "Our return, replacement, and refund policy for Prajnaa Farm orders." },
    ],
  }),
  component: ReturnsPage,
});

function ReturnsPage() {
  return (
    <MarketingLayout>
      <PageHero
        eyebrow="Returns & refunds"
        title={<>If it isn't right, <span className="text-primary">we make it right.</span></>}
        subtitle="Damaged, tampered or not as described? You're covered."
      />
      <LegalArticle
        updated="01 May 2026"
        intro={<p>Because most of our products are perishable, returns are limited — but our quality guarantee is full. If anything is wrong with your order, we'll replace or refund it.</p>}
        sections={[
          { h: "What's covered", body: <p>Damaged parcels, tampered seals, missing items, and products that don't match the description on the website. Tell us within 48 hours of delivery and we'll act the same day.</p> },
          { h: "How to raise a request", body: <p>Open your order from the account page, tap "Report an issue", and upload a photo. Or write to <a href="mailto:care@prajnaa.in" className="underline">care@prajnaa.in</a> with your order ID.</p> },
          { h: "Refund timelines", body: <p>Approved refunds are issued to the original payment method within 5–7 business days. COD orders are refunded to your bank account via NEFT once you share your bank details with our care team.</p> },
          { h: "What's not eligible", body: <p>Opened or partially used products (unless damaged or defective). Items reported after 48 hours. Custom or special orders.</p> },
          { h: "Cancellations", body: <p>You can cancel an order any time before it ships. Once shipped, please use the Returns process above.</p> },
        ]}
      />
    </MarketingLayout>
  );
}
