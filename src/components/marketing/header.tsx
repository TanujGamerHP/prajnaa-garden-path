import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Search, ShoppingBag, User, Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { useCart, cartTotals } from "@/lib/cart-store";
import { useAuth } from "@/hooks/use-auth";

const nav = [
  { to: "/shop", label: "Shop" },
  { to: "/farmers", label: "Farmers" },
  { to: "/become-a-seller", label: "Sell with us" },
  { to: "/about", label: "About" },
];

export function MarketingHeader() {
  const [open, setOpen] = useState(false);
  const items = useCart((s) => s.items);
  const { count } = cartTotals(items);
  const { user } = useAuth();
  const accountHref = user ? "/account" : "/auth/login";

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="container-prj flex h-16 items-center justify-between gap-6">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden items-center gap-7 md:flex">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="font-subhead text-sm text-foreground/75 transition-colors hover:text-foreground"
                activeProps={{ className: "text-foreground" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-1">
          <Link
            to="/shop"
            aria-label="Search products"
            className="hidden h-10 w-10 items-center justify-center rounded-full text-foreground/70 transition-colors hover:bg-secondary hover:text-foreground sm:inline-flex"
          >
            <Search className="h-[18px] w-[18px]" />
          </Link>
          <Link
            to={accountHref}
            aria-label={user ? "Account" : "Sign in"}
            className="hidden h-10 w-10 items-center justify-center rounded-full text-foreground/70 transition-colors hover:bg-secondary hover:text-foreground sm:inline-flex"
          >
            <User className="h-[18px] w-[18px]" />
          </Link>
          <Link
            to="/cart"
            aria-label="Cart"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-foreground/70 transition-colors hover:bg-secondary hover:text-foreground"
          >
            <ShoppingBag className="h-[18px] w-[18px]" />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 font-subhead text-[10px] font-semibold text-primary-foreground">
                {count}
              </span>
            )}
          </Link>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            className="ml-1 inline-flex h-10 w-10 items-center justify-center rounded-full text-foreground/70 transition-colors hover:bg-secondary md:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-border/60 bg-background md:hidden">
          <nav className="container-prj flex flex-col py-3">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="font-subhead py-3 text-[15px] text-foreground/85"
              >
                {n.label}
              </Link>
            ))}
            <Link
              to={accountHref}
              onClick={() => setOpen(false)}
              className="font-subhead py-3 text-[15px] text-foreground/85"
            >
              {user ? "My account" : "Sign in"}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
