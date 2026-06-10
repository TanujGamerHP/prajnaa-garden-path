import { createFileRoute, Outlet } from "@tanstack/react-router";
import { LayoutDashboard, Users, Package, ShoppingBag, UserCog, Ticket, Image, Wallet } from "lucide-react";
import { DashboardShell, type NavItem } from "@/components/dashboard/shell";

const nav: NavItem[] = [
  { to: "/admin/dashboard", label: "Overview", icon: <LayoutDashboard className="h-4 w-4" /> },
  { to: "/admin/vendors", label: "Vendors", icon: <Users className="h-4 w-4" /> },
  { to: "/admin/products", label: "Products", icon: <Package className="h-4 w-4" /> },
  { to: "/admin/orders", label: "Orders", icon: <ShoppingBag className="h-4 w-4" /> },
  { to: "/admin/customers", label: "Customers", icon: <UserCog className="h-4 w-4" /> },
  { to: "/admin/coupons", label: "Coupons", icon: <Ticket className="h-4 w-4" /> },
  { to: "/admin/banners", label: "Banners", icon: <Image className="h-4 w-4" /> },
  { to: "/admin/settlements", label: "Settlements", icon: <Wallet className="h-4 w-4" /> },
];

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "Admin — Prajnaa Farm" }, { name: "robots", content: "noindex" }],
  }),
  component: () => (
    <DashboardShell title="Admin" subtitle="Prajnaa Farm · Operations" nav={nav}>
      <Outlet />
    </DashboardShell>
  ),
});
