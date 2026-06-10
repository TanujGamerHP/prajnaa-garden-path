import { createFileRoute, Outlet, useNavigate, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { LayoutDashboard, Package, Boxes, ShoppingBag, IndianRupee, User, Loader2, AlertCircle } from "lucide-react";
import { DashboardShell, type NavItem } from "@/components/dashboard/shell";
import { useAuth } from "@/hooks/use-auth";
import { useFarmerProfile } from "@/lib/farmer/use-farmer";
import { MarketingLayout } from "@/components/marketing/layout";

const nav: NavItem[] = [
  { to: "/farmer-portal/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { to: "/farmer-portal/products", label: "Products", icon: <Package className="h-4 w-4" /> },
  { to: "/farmer-portal/inventory", label: "Inventory", icon: <Boxes className="h-4 w-4" /> },
  { to: "/farmer-portal/orders", label: "Orders", icon: <ShoppingBag className="h-4 w-4" /> },
  { to: "/farmer-portal/earnings", label: "Earnings", icon: <IndianRupee className="h-4 w-4" /> },
  { to: "/farmer-portal/profile", label: "Story page", icon: <User className="h-4 w-4" /> },
];

export const Route = createFileRoute("/farmer-portal")({
  head: () => ({ meta: [{ title: "Farmer portal — Prajnaa Farm" }, { name: "robots", content: "noindex" }] }),
  component: FarmerPortalShell,
});

function FarmerPortalShell() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: farmer, isLoading: farmerLoading } = useFarmerProfile();

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth/login", replace: true });
  }, [authLoading, user, navigate]);

  if (authLoading || (user && farmerLoading)) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!user) return null;

  if (!farmer) {
    return (
      <MarketingLayout>
        <div className="container-prj py-20 max-w-xl">
          <h1 className="font-display text-3xl font-semibold">Become a seller first</h1>
          <p className="mt-2 text-muted-foreground">Complete the short registration so we can verify your farm.</p>
          <Link to="/become-a-seller/register" className="font-subhead mt-6 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">Start registration</Link>
        </div>
      </MarketingLayout>
    );
  }

  return (
    <DashboardShell title="Farmer Portal" subtitle={`${farmer.full_name} · ${farmer.village}`} nav={nav}>
      {farmer.status !== "approved" && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-warning/30 bg-warning/10 p-4">
          <AlertCircle className="mt-0.5 h-4 w-4 text-warning" />
          <div className="text-sm">
            <p className="font-medium capitalize">Application {farmer.status}</p>
            <p className="text-muted-foreground">
              {farmer.status === "draft" && "Finish your registration to submit for review."}
              {farmer.status === "pending" && "We're reviewing your application. You'll get full access once approved."}
              {farmer.status === "rejected" && (farmer.rejection_reason || "Please contact support.")}
              {farmer.status === "suspended" && "Your account is suspended. Contact support."}
            </p>
            {farmer.status === "draft" && (
              <Link to="/become-a-seller/register" className="font-subhead mt-2 inline-block text-xs text-primary">Continue registration →</Link>
            )}
          </div>
        </div>
      )}
      <Outlet />
    </DashboardShell>
  );
}
