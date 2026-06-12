import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Search, ShoppingBag, User, Menu, X, Truck } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { useCart, cartTotals } from "@/lib/cart-store";
import { useAuth } from "@/hooks/use-auth";
import { categories } from "@/lib/mock/categories";

export function MarketingHeader() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const items = useCart((s) => s.items);
  const { count } = cartTotals(items);
  const { user } = useAuth();
  
  // Search parameters state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCategory, setSearchCategory] = useState("all");

  const accountHref = user ? "/account" : "/auth/login";

  // Trigger search navigation
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({
      to: "/shop",
      search: {
        q: searchQuery || undefined,
        cat: searchCategory !== "all" ? searchCategory : undefined,
      },
    });
  };

  return (
    <header className="w-full bg-background">
      {/* 1. Top Bar Banner (Green Strip) */}
      <div className="bg-primary text-primary-foreground text-xs py-2 border-b border-primary/20">
        <div className="container-prj flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-4 text-[11px] tracking-wide">
            <span className="flex items-center gap-1">
              <Truck className="h-3.5 w-3.5 text-accent" /> Free shipping on orders above ₹499
            </span>
            <span className="hidden md:inline-block opacity-45">|</span>
            <span className="hidden md:inline">Cash on Delivery (COD) Available</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <Link to="/track-order" className="hover:underline opacity-90 transition">
              Track Order
            </Link>
            <span className="opacity-30">|</span>
            <Link to="/become-a-seller" className="hover:underline opacity-90 transition font-semibold">
              Become a Partner
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Main Search Header */}
      <div className="border-b border-border/50 py-4 bg-background">
        <div className="container-prj flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Logo />
          </div>

          {/* Integrated Search Bar (Amazon-Style Category + Input) */}
          <form 
            onSubmit={handleSearchSubmit}
            className="hidden md:flex flex-1 max-w-xl items-center border border-border rounded-full overflow-hidden shadow-sm bg-secondary/15 hover:border-primary/50 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition"
          >
            {/* Category select */}
            <select
              value={searchCategory}
              onChange={(e) => setSearchCategory(e.target.value)}
              className="bg-transparent pl-4 pr-2 py-2 text-xs font-semibold text-foreground/80 outline-none border-r border-border cursor-pointer select-none max-w-[140px] truncate"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Input field */}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products, farmers, categories..."
              className="flex-1 bg-transparent px-4 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none"
            />

            {/* Submit button */}
            <button
              type="submit"
              className="bg-primary text-primary-foreground p-2.5 px-5 hover:opacity-90 transition flex items-center justify-center cursor-pointer"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </button>
          </form>

          {/* Right Action Icons (Cart, Account, Mobile Toggle) */}
          <div className="flex items-center gap-2">
            {/* Search Icon (Mobile Only) */}
            <Link
              to="/shop"
              aria-label="Search products"
              className="md:hidden h-10 w-10 items-center justify-center rounded-full text-foreground/75 hover:bg-secondary/60 flex"
            >
              <Search className="h-[18px] w-[18px]" />
            </Link>

            {/* Account Icon */}
            <Link
              to={accountHref}
              aria-label={user ? "Account" : "Sign in"}
              className="h-10 w-10 items-center justify-center rounded-full text-foreground/75 hover:bg-secondary/60 flex"
            >
              <User className="h-[18px] w-[18px]" />
            </Link>

            {/* Cart Icon */}
            <Link
              to="/cart"
              aria-label="Cart"
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-foreground/75 hover:bg-secondary/60"
            >
              <ShoppingBag className="h-[18px] w-[18px]" />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-4.5 min-w-[18px] place-items-center rounded-full bg-primary px-1 font-display text-[9px] font-semibold text-primary-foreground shadow-sm">
                  {count}
                </span>
              )}
            </Link>

            {/* Mobile menu trigger */}
            <button
              onClick={() => setOpen((v) => !v)}
              aria-label="Toggle menu"
              className="md:hidden h-10 w-10 items-center justify-center rounded-full text-foreground/75 hover:bg-secondary/60 flex"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* 3. Sub-Navigation Bar */}
      <div className="border-b border-border/40 py-2.5 bg-background/95 sticky top-0 z-30 shadow-[0_1px_2px_rgba(0,0,0,0.02)] hidden md:block">
        <div className="container-prj flex items-center justify-between">
          <nav className="flex items-center gap-8">
            <Link
              to="/"
              className="font-subhead text-xs font-semibold text-foreground/70 hover:text-primary transition"
              activeProps={{ className: "text-primary" }}
            >
              Home
            </Link>
            <Link
              to="/shop"
              className="font-subhead text-xs font-semibold text-foreground/70 hover:text-primary transition"
              activeProps={{ className: "text-primary" }}
            >
              Shop Harvest
            </Link>
            <Link
              to="/farmers"
              className="font-subhead text-xs font-semibold text-foreground/70 hover:text-primary transition"
              activeProps={{ className: "text-primary" }}
            >
              Meet Farmers
            </Link>
            <Link
              to="/become-a-seller"
              className="font-subhead text-xs font-semibold text-foreground/70 hover:text-primary transition"
              activeProps={{ className: "text-primary" }}
            >
              Sell With Us
            </Link>
            <Link
              to="/about"
              className="font-subhead text-xs font-semibold text-foreground/70 hover:text-primary transition"
              activeProps={{ className: "text-primary" }}
            >
              Our Story
            </Link>
            <Link
              to="/contact"
              className="font-subhead text-xs font-semibold text-foreground/70 hover:text-primary transition"
              activeProps={{ className: "text-primary" }}
            >
              Contact Us
            </Link>
          </nav>
          <div className="font-subhead text-[10px] text-muted-foreground uppercase tracking-widest font-semibold flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" /> 100% Traceable to Soil
          </div>
        </div>
      </div>

      {/* Mobile Drawer menu */}
      {open && (
        <div className="border-t border-border/50 bg-background md:hidden">
          <nav className="container-prj flex flex-col py-3 space-y-1">
            {/* Mobile Category Search */}
            <form onSubmit={handleSearchSubmit} className="flex border border-border rounded-full overflow-hidden my-3 bg-secondary/10">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, spices..."
                className="flex-1 bg-transparent px-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none"
              />
              <button type="submit" className="bg-primary text-primary-foreground px-4 text-xs font-medium hover:opacity-90">
                Go
              </button>
            </form>

            <Link
              to="/"
              onClick={() => setOpen(false)}
              className="font-subhead py-2.5 text-sm text-foreground/85 border-b border-border/20 flex"
            >
              Home
            </Link>
            <Link
              to="/shop"
              onClick={() => setOpen(false)}
              className="font-subhead py-2.5 text-sm text-foreground/85 border-b border-border/20 flex"
            >
              Shop Harvest
            </Link>
            <Link
              to="/farmers"
              onClick={() => setOpen(false)}
              className="font-subhead py-2.5 text-sm text-foreground/85 border-b border-border/20 flex"
            >
              Meet Farmers
            </Link>
            <Link
              to="/become-a-seller"
              onClick={() => setOpen(false)}
              className="font-subhead py-2.5 text-sm text-foreground/85 border-b border-border/20 flex"
            >
              Sell With Us
            </Link>
            <Link
              to="/about"
              onClick={() => setOpen(false)}
              className="font-subhead py-2.5 text-sm text-foreground/85 border-b border-border/20 flex"
            >
              Our Story
            </Link>
            <Link
              to="/contact"
              onClick={() => setOpen(false)}
              className="font-subhead py-2.5 text-sm text-foreground/85 border-b border-border/20 flex"
            >
              Contact Us
            </Link>
            <Link
              to={accountHref}
              onClick={() => setOpen(false)}
              className="font-subhead py-3 text-sm text-primary font-medium flex"
            >
              {user ? "My Account Dashboard" : "Sign In / Register"}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
