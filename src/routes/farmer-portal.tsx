import { createFileRoute, Outlet } from "@tanstack/react-router";
import { LayoutDashboard, Package, Boxes, ShoppingBag, IndianRupee, User } from "lucide-react";
import { DashboardShell, type NavItem } from "@/components/dashboard/shell";

const nav: NavItem[] = [
  { to: "/farmer-portal/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { to: "/farmer-portal/products", label: "Products", icon: <Package className="h-4 w-4" /> },
  { to: "/farmer-portal/inventory", label: "Inventory", icon: <Boxes className="h-4 w-4" /> },
  { to: "/farmer-portal/orders", label: "Orders", icon: <ShoppingBag className="h-4 w-4" /> },
  { to: "/farmer-portal/earnings", label: "Earnings", icon: <IndianRupee className="h-4 w-4" /> },
  { to: "/farmer-portal/profile", label: "Story page", icon: <User className="h-4 w-4" /> },
];

export const Route = createFileRoute("/farmer-portal")({
  head: () => ({
    meta: [{ title: "Farmer portal — Prajnaa Farm" }, { name: "robots", content: "noindex" }],
  }),
  component: () => (
    <DashboardShell title="Farmer Portal" subtitle="Asha Patel · Anand" nav={nav}>
      <Outlet />
    </DashboardShell>
  ),
});
