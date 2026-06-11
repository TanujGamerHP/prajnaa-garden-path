import { Link, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";

export type NavItem = {
  to: string;
  label: string;
  icon: ReactNode;
};

export function DashboardShell({
  title,
  subtitle,
  nav,
  children,
}: {
  title: string;
  subtitle: string;
  nav: NavItem[];
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex min-h-dvh bg-secondary/30">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 transform border-r border-border bg-background transition-transform md:static md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-5">
          <Logo />
          <button onClick={() => setOpen(false)} className="md:hidden" aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5">
          <p className="font-subhead text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            {title}
          </p>
          <p className="font-display mt-1 text-sm font-medium">{subtitle}</p>
        </div>
        <nav className="px-3 pb-6">
          {nav.map((n) => {
            const active = pathname === n.to;
            return (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className={`font-subhead mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground/75 hover:bg-secondary"
                }`}
              >
                <span className={active ? "" : "text-muted-foreground"}>{n.icon}</span>
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 border-t border-border p-5">
          <Link to="/" className="font-subhead text-xs text-muted-foreground hover:text-foreground">
            ← Back to store
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/85 px-5 backdrop-blur md:px-8">
          <button onClick={() => setOpen(true)} className="md:hidden" aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="font-display text-base font-medium">{subtitle}</h1>
          <div className="font-subhead flex items-center gap-3 text-xs text-muted-foreground">
            <span className="hidden h-2 w-2 rounded-full bg-success sm:inline-block" />
            <span className="hidden sm:inline">Live</span>
          </div>
        </header>
        <main className="flex-1 p-5 md:p-8">{children}</main>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-30 bg-foreground/30 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  );
}

export function StatCard({
  label,
  value,
  delta,
  deltaTone = "up",
}: {
  label: string;
  value: string;
  delta?: string;
  deltaTone?: "up" | "down";
}) {
  return (
    <div className="rounded-2xl border border-border bg-background p-5">
      <p className="font-subhead text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className="font-display mt-2 text-3xl font-semibold">{value}</p>
      {delta && (
        <p
          className={`font-subhead mt-1 text-xs ${deltaTone === "up" ? "text-success" : "text-destructive"}`}
        >
          {delta}
        </p>
      )}
    </div>
  );
}
