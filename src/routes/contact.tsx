import { createFileRoute } from "@tanstack/react-router";
import { Mail, Phone, MapPin } from "lucide-react";
import { toast } from "sonner";
import { MarketingLayout } from "@/components/marketing/layout";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Prajnaa Farm" },
      { name: "description", content: "Get in touch with the Prajnaa Farm team." },
      { property: "og:title", content: "Contact — Prajnaa Farm" },
      { property: "og:description", content: "Get in touch with the Prajnaa Farm team." },
      { property: "og:url", content: "/contact" },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <MarketingLayout>
      <section className="container-prj pt-14 md:pt-20">
        <div className="grid gap-14 md:grid-cols-2">
          <div>
            <p className="font-subhead text-xs uppercase tracking-[0.18em] text-primary">Contact</p>
            <h1 className="font-display mt-3 text-5xl font-semibold leading-[1.02] md:text-6xl">Say hello.</h1>
            <p className="mt-4 max-w-md text-muted-foreground">
              Questions, partnerships, press, or feedback — we read every message and respond within one business day.
            </p>
            <ul className="mt-10 space-y-5">
              <li className="flex items-start gap-3">
                <Mail className="mt-1 h-5 w-5 text-primary" />
                <div>
                  <p className="font-subhead text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Email</p>
                  <p className="font-display mt-1 text-base">hello@prajnaa.in</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="mt-1 h-5 w-5 text-primary" />
                <div>
                  <p className="font-subhead text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Phone</p>
                  <p className="font-display mt-1 text-base">+91 80 4040 1010</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="mt-1 h-5 w-5 text-primary" />
                <div>
                  <p className="font-subhead text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Address</p>
                  <p className="font-display mt-1 text-base">Bengaluru, Karnataka, India</p>
                </div>
              </li>
            </ul>
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); toast.success("Message sent. We'll be in touch."); }}
            className="rounded-3xl border border-border bg-secondary/40 p-6 md:p-8"
          >
            <div className="space-y-3">
              <label className="block">
                <span className="font-subhead text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Your name</span>
                <input required className="font-subhead mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3.5 text-sm outline-none focus:border-primary" />
              </label>
              <label className="block">
                <span className="font-subhead text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Email</span>
                <input type="email" required className="font-subhead mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3.5 text-sm outline-none focus:border-primary" />
              </label>
              <label className="block">
                <span className="font-subhead text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Message</span>
                <textarea required rows={5} className="font-subhead mt-1.5 w-full rounded-xl border border-border bg-background p-3.5 text-sm outline-none focus:border-primary" />
              </label>
              <button className="font-subhead mt-2 h-12 w-full rounded-full bg-primary text-sm font-medium text-primary-foreground hover:opacity-90">Send message</button>
            </div>
          </form>
        </div>
      </section>
    </MarketingLayout>
  );
}
