import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/marketing/layout";
import { PageHero } from "@/components/marketing/page-hero";
import { LegalArticle } from "@/components/marketing/legal-article";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of service — Prajnaa Farm" },
      { name: "description", content: "Terms governing the use of shop.prajnaa.in and Prajnaa Farm services." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <MarketingLayout>
      <PageHero
        eyebrow="Terms of service"
        title={<>The <span className="text-primary">house rules.</span></>}
        subtitle="The agreement between you and Prajnaa Farm when you use this site."
      />
      <LegalArticle
        updated="01 May 2026"
        sections={[
          { h: "Acceptance", body: <p>By accessing shop.prajnaa.in you agree to these terms. If you don't agree, please don't use the site.</p> },
          { h: "Your account", body: <p>You're responsible for keeping your account credentials safe and for activity that happens under your account. Notify us immediately of any unauthorised use.</p> },
          { h: "Orders & pricing", body: <p>All prices are in INR and inclusive of GST unless noted. We reserve the right to refuse or cancel orders where pricing or stock errors are discovered, and to verify identity on suspicious orders.</p> },
          { h: "Intellectual property", body: <p>All content on this site — copy, photography, design, farmer stories — is owned by Prajnaa Farm or its partners. You may not reuse it commercially without written permission.</p> },
          { h: "Acceptable use", body: <p>Don't attempt to disrupt the site, scrape data at scale, or use Prajnaa for resale without a registered partnership. We may suspend accounts that violate these rules.</p> },
          { h: "Limitation of liability", body: <p>To the extent permitted by Indian law, our liability for any claim relating to an order is limited to the value of that order.</p> },
          { h: "Governing law", body: <p>These terms are governed by Indian law. Any dispute will be subject to the exclusive jurisdiction of the courts in Bengaluru.</p> },
          { h: "Changes", body: <p>We may update these terms from time to time. Material changes will be flagged on this page and, where appropriate, by email.</p> },
        ]}
      />
    </MarketingLayout>
  );
}
