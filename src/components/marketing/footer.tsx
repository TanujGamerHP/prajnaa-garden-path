import { Link } from "@tanstack/react-router";
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
        </div>
        <FooterCol
          title="Shop"
          links={[
            { to: "/shop", label: "All products" },
            { to: "/category/dry-fruits", label: "Dry fruits" },
            { to: "/category/spices", label: "Spices" },
            { to: "/category/pickles", label: "Pickles" },
            { to: "/category/masalas", label: "Masalas" },
          ]}
        />
        <FooterCol
          title="Farmers"
          links={[
            { to: "/farmers", label: "Meet the farmers" },
            { to: "/become-a-seller", label: "Become a seller" },
            { to: "/farmer-portal/dashboard", label: "Farmer login" },
          ]}
        />
        <FooterCol
          title="Company"
          links={[
            { to: "/about", label: "About us" },
            { to: "/contact", label: "Contact" },
            { to: "/admin/dashboard", label: "Admin" },
          ]}
        />
        <FooterCol
          title="Help"
          links={[
            { to: "/account", label: "My account" },
            { to: "/contact", label: "Support" },
            { to: "/about", label: "FAQ" },
          ]}
        />
      </div>
      <div className="border-t border-border">
        <div className="container-prj flex flex-col items-start justify-between gap-3 py-6 text-xs text-muted-foreground md:flex-row md:items-center">
          <p>© {new Date().getFullYear()} Prajnaa Farm. All rights reserved.</p>
          <p>Made with care in India.</p>
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
