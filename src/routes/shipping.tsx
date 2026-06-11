import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/marketing/layout";
import { PageHero } from "@/components/marketing/page-hero";
import { LegalArticle } from "@/components/marketing/legal-article";

export const Route = createFileRoute("/shipping")({
  head: () => ({
    meta: [
      { title: "Shipping policy — Prajnaa Farm" },
      {
        name: "description",
        content: "Delivery timelines, charges, and serviceable pin codes for Prajnaa Farm orders.",
      },
    ],
  }),
  component: ShippingPage,
});

function ShippingPage() {
  return (
    <MarketingLayout>
      <PageHero
        eyebrow="Shipping policy"
        title={
          <>
            From <span className="text-primary">soil</span> to your door.
          </>
        }
        subtitle="How and when your Prajnaa order will reach you."
      />
      <LegalArticle
        updated="01 May 2026"
        intro={
          <p>
            We ship to 20,000+ pin codes across India through trusted logistics partners. Most
            orders are packed within 24 hours and delivered within 3–7 business days.
          </p>
        }
        sections={[
          {
            h: "Delivery timelines",
            body: (
              <>
                <p>
                  Metro cities: 2–4 business days. Tier-2 cities: 3–6 business days. Remote pin
                  codes: 5–9 business days.
                </p>
                <p>
                  Seasonal and refrigerated items may take longer to ensure freshness; the product
                  page will indicate this.
                </p>
              </>
            ),
          },
          {
            h: "Shipping charges",
            body: (
              <p>
                Flat ₹49 shipping on orders below ₹999. Free shipping on orders ₹999 and above. COD
                orders carry an additional ₹40 handling fee.
              </p>
            ),
          },
          {
            h: "Order tracking",
            body: (
              <p>
                You'll receive a tracking link by email and SMS as soon as your order leaves the
                warehouse. You can also track from <code>shop.prajnaa.in/track-order</code>.
              </p>
            ),
          },
          {
            h: "Serviceability",
            body: (
              <p>
                Enter your pin code on any product page or at checkout to confirm delivery to your
                area. If we don't deliver to your pin code yet, we'll let you know — and you can
                subscribe for updates.
              </p>
            ),
          },
          {
            h: "Damaged or missing parcels",
            body: (
              <p>
                If your parcel arrives damaged or any item is missing, please contact{" "}
                <a href="mailto:care@prajnaa.in" className="underline">
                  care@prajnaa.in
                </a>{" "}
                within 48 hours with photos. We'll replace or refund, no questions asked.
              </p>
            ),
          },
        ]}
      />
    </MarketingLayout>
  );
}
