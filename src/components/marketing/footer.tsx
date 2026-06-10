import { Link } from "@tanstack/react-router";
import { Instagram, Twitter, Youtube, Mail } from "lucide-react";
import { Logo } from "@/components/brand/logo";

export function MarketingFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-secondary/60">
      <div className="container-prj grid gap-12 py-16 md:grid-cols-12">
        <div className="md:col-span-4">
          <Logo />
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">
            From Soil to Soul, Naturally. Authentic farm produce, sourced directly from trusted farmers across India.
          </p>
          <p className="font-subhead mt-6 text-xs uppercase tracking-[0.16em] text-muted-foreground">
            shop.prajnaa.in
          </p>
          <div className="mt-6 flex items-center gap-2">
            {[
              { Icon: Instagram, href: "#", label: "Instagram" },
              { Icon: Twitter, href: "#", label: "Twitter" },
              { Icon: Youtube, href: "#", label: "YouTube" },
              { Icon: Mail, href: "mailto:hello@prajnaa.in", label: "Email" },
            ].map(({ Icon, href, label }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="grid h-9 w-9 place-items-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground hover:border-primary"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <FooterCol
          title="Shop"
          links={[
            { to: "/shop", label: "All products" },
            { to: "/category/dry-fruits", label: "Dry fruits" },
            { to: "/category/spices", label: "Spices" },
            { to: "/category/pickles", label: "Pickles" },
            { to: "/wishlist", label: "Wishlist" },
            { to: "/track-order", label: "Track order" },
          ]}
        />
        <FooterCol
          title="Farmers"
          links={[
            { to: "/farmers", label: "Meet the farmers" },
            { to: "/become-a-seller", label: "Become a seller" },
            { to: "/sustainability", label: "Sustainability" },
            { to: "/farmer-portal/dashboard", label: "Farmer login" },
          ]}
        />
        <FooterCol
          title="Company"
          links={[
            { to: "/about", label: "About us" },
            { to: "/blog", label: "The Journal" },
            { to: "/press", label: "Press" },
            { to: "/careers", label: "Careers" },
            { to: "/contact", label: "Contact" },
          ]}
        />
        <FooterCol
          title="Help"
          links={[
            { to: "/faq", label: "FAQ" },
            { to: "/shipping", label: "Shipping" },
            { to: "/returns", label: "Returns & refunds" },
            { to: "/account", label: "My account" },
            { to: "/contact", label: "Support" },
          ]}
        />
      </div>
      <div className="border-t border-border">
        <div className="container-prj flex flex-col items-start justify-between gap-3 py-6 text-xs text-muted-foreground md:flex-row md:items-center">
          <p>© {new Date().getFullYear()} Prajnaa Farm. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link to="/terms" className="hover:text-foreground">Terms</Link>
            <Link to="/shipping" className="hover:text-foreground">Shipping</Link>
            <Link to="/returns" className="hover:text-foreground">Returns</Link>
            <span>· Made with care in India.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { to: string; label: string }[] }) {
  return (
    <div className="md:col-span-2">
      <h4 className="font-subhead text-xs uppercase tracking-[0.16em] text-foreground/85">{title}</h4>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={l.to + l.label}>
            <Link to={l.to} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
