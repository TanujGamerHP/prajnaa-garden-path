import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  ShoppingBag,
  Heart,
  MapPin,
  CreditCard,
  User,
  Lock,
  Bell,
  Clock,
  Star,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean };

export const accountNav: NavItem[] = [
  { to: "/account", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/account/orders", label: "Your orders", icon: ShoppingBag },
  { to: "/account/wishlist", label: "Wishlist", icon: Heart },
  { to: "/account/addresses", label: "Addresses", icon: MapPin },
  { to: "/account/payments", label: "Payment methods", icon: CreditCard },
  { to: "/account/profile", label: "Login & profile", icon: User },
  { to: "/account/security", label: "Security", icon: Lock },
  { to: "/account/notifications", label: "Notifications", icon: Bell },
  { to: "/account/recently-viewed", label: "Recently viewed", icon: Clock },
  { to: "/account/reviews", label: "Your reviews", icon: Star },
];

export function AccountSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <nav aria-label="Account navigation" className="flex flex-col gap-1">
      {accountNav.map(({ to, label, icon: Icon, exact }) => {
        const active = exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");
        return (
          <Link
            key={to}
            to={to as "/account"}
            className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
              active ? "bg-primary/10 text-primary" : "text-foreground/80 hover:bg-secondary"
            }`}
          >
            <Icon className="h-4 w-4" />
            <span className="font-medium">{label}</span>
          </Link>
        );
      })}
      <button
        onClick={async () => {
          await signOut();
          toast.success("Signed out");
          navigate({ to: "/" });
        }}
        className="mt-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
        <LogOut className="h-4 w-4" />
        <span className="font-medium">Sign out</span>
      </button>
    </nav>
  );
}
