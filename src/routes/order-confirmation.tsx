import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { MarketingLayout } from "@/components/marketing/layout";
import { z } from "zod";

export const Route = createFileRoute("/order-confirmation")({
  validateSearch: z.object({ id: z.string().optional() }),
  head: () => ({
    meta: [{ title: "Order confirmed — Prajnaa Farm" }, { name: "robots", content: "noindex" }],
  }),
  component: OrderConfirmation,
});

function OrderConfirmation() {
  const { id } = Route.useSearch();
  return (
    <MarketingLayout>
      <div className="container-prj pt-16 md:pt-24">
        <div className="mx-auto max-w-xl text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
          <h1 className="font-display mt-6 text-4xl font-semibold leading-[1.05] md:text-5xl">Thank you for your order.</h1>
          <p className="mt-3 text-muted-foreground">
            A confirmation has been sent to your email. Your farmer is being notified now.
          </p>
          {id && (
            <div className="font-subhead mt-8 inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-xs uppercase tracking-[0.14em] text-foreground/80">
              Order ID <span className="font-display text-sm font-semibold tracking-normal text-foreground">{id}</span>
            </div>
          )}
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link to="/account" className="font-subhead rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90">Track order</Link>
            <Link to="/shop" className="font-subhead rounded-full border border-border bg-background px-5 py-2.5 text-sm font-medium hover:bg-secondary">Continue shopping</Link>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}
