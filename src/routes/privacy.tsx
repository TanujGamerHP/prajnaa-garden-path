import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/marketing/layout";
import { PageHero } from "@/components/marketing/page-hero";
import { LegalArticle } from "@/components/marketing/legal-article";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy policy — Prajnaa Farm" },
      {
        name: "description",
        content: "How Prajnaa Farm collects, uses, and protects your personal information.",
      },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <MarketingLayout>
      <PageHero
        eyebrow="Privacy policy"
        title={
          <>
            Your data, <span className="text-primary">treated like soil.</span>
          </>
        }
        subtitle="We collect only what we need, hold it carefully, and never sell it."
      />
      <LegalArticle
        updated="01 May 2026"
        sections={[
          {
            h: "What we collect",
            body: (
              <p>
                Contact details (name, email, phone), delivery address, order history, payment
                metadata (we never store card numbers), and basic device/browser information to keep
                the site running smoothly.
              </p>
            ),
          },
          {
            h: "Why we collect it",
            body: (
              <p>
                To process your orders, communicate about deliveries, prevent fraud, and improve the
                product. Marketing communications are opt-in and easy to leave.
              </p>
            ),
          },
          {
            h: "Who we share it with",
            body: (
              <p>
                Logistics partners (only the address fields needed to deliver), payment processors
                (only what they need to settle), and our analytics provider in aggregate,
                non-identifying form. We do not sell your data.
              </p>
            ),
          },
          {
            h: "How long we keep it",
            body: (
              <p>
                Account data: as long as your account is active, plus 30 days after deletion. Order
                records: 7 years (tax compliance). Marketing preferences: until you change them.
              </p>
            ),
          },
          {
            h: "Your rights",
            body: (
              <p>
                You can access, correct, export or delete your data any time by writing to{" "}
                <a href="mailto:privacy@prajnaa.in" className="underline">
                  privacy@prajnaa.in
                </a>
                . We respond within 7 working days.
              </p>
            ),
          },
          {
            h: "Cookies",
            body: (
              <p>
                We use essential cookies to keep you signed in and your cart intact, and analytics
                cookies (opt-in) to understand how the site is used. You can change your choice from
                the footer at any time.
              </p>
            ),
          },
          {
            h: "Children",
            body: (
              <p>
                Prajnaa is intended for users 18 years and older. We do not knowingly collect
                personal information from children.
              </p>
            ),
          },
          {
            h: "Contact",
            body: (
              <p>
                For any privacy question, write to{" "}
                <a href="mailto:privacy@prajnaa.in" className="underline">
                  privacy@prajnaa.in
                </a>{" "}
                or to our registered office in Bengaluru.
              </p>
            ),
          },
        ]}
      />
    </MarketingLayout>
  );
}
