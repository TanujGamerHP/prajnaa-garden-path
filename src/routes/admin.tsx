import { createFileRoute, Outlet, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LayoutDashboard, Users, Package, ShoppingBag, UserCog, Ticket, Image, Wallet, Settings, Loader2, ShieldOff } from "lucide-react";
import { DashboardShell, type NavItem } from "@/components/dashboard/shell";
import { useAuth } from "@/hooks/use-auth";
import { useIsAdmin } from "@/lib/admin/use-admin";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const nav: NavItem[] = [
  { to: "/admin/dashboard", label: "Overview", icon: <LayoutDashboard className="h-4 w-4" /> },
  { to: "/admin/vendors", label: "Farmers", icon: <Users className="h-4 w-4" /> },
  { to: "/admin/products", label: "Products", icon: <Package className="h-4 w-4" /> },
  { to: "/admin/orders", label: "Orders", icon: <ShoppingBag className="h-4 w-4" /> },
  { to: "/admin/customers", label: "Customers", icon: <UserCog className="h-4 w-4" /> },
  { to: "/admin/settlements", label: "Settlements", icon: <Wallet className="h-4 w-4" /> },
  { to: "/admin/coupons", label: "Coupons", icon: <Ticket className="h-4 w-4" /> },
  { to: "/admin/banners", label: "Banners", icon: <Image className="h-4 w-4" /> },
  { to: "/admin/settings", label: "Admin settings", icon: <Settings className="h-4 w-4" /> },
];

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "Admin — Prajnaa Farm" }, { name: "robots", content: "noindex,nofollow" }],
  }),
  component: AdminShell,
});

function AdminShell() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: roleLoading } = useIsAdmin();
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth/login", replace: true });
  }, [authLoading, user, navigate]);

  if (authLoading || (user && roleLoading)) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!user) return null;

  if (!isAdmin) {
    const claim = async () => {
      setClaiming(true);
      try {
        const { data, error } = await supabase.rpc("claim_first_admin");
        if (error) throw error;
        if (data === true) {
          toast.success("Admin access granted");
          qc.invalidateQueries({ queryKey: ["is-admin"] });
        } else {
          toast.error("An admin already exists. Ask an existing admin to add you.");
        }
      } catch (e: any) {
        toast.error(e?.message ?? "Could not claim admin");
      } finally {
        setClaiming(false);
      }
    };

    return (
      <div className="grid min-h-dvh place-items-center bg-secondary/30 p-6">
        <div className="max-w-md rounded-3xl border border-border bg-background p-8 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-destructive/10 text-destructive">
            <ShieldOff className="h-6 w-6" />
          </div>
          <h1 className="font-display mt-5 text-2xl font-semibold">Admin only</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This area is hidden and only available to platform administrators.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <button
              onClick={claim}
              disabled={claiming}
              className="font-subhead inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {claiming && <Loader2 className="h-4 w-4 animate-spin" />}
              Claim admin access (first user only)
            </button>
            <p className="text-[11px] text-muted-foreground">
              The button above only works if no admin has been set up yet.
            </p>
            <Link to="/" className="font-subhead mt-3 text-xs text-muted-foreground hover:text-foreground">
              Back to site
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DashboardShell title="Admin" subtitle="Prajnaa Farm · Operations" nav={nav}>
      <Outlet />
    </DashboardShell>
  );
}
