import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { MarketingLayout } from "@/components/marketing/layout";
import { AccountSidebar } from "@/components/account/sidebar";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [{ title: "Your account — Prajnaa Farm" }, { name: "robots", content: "noindex" }],
  }),
  component: AccountLayout,
});

function AccountLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth/login", replace: true });
  }, [loading, user, navigate]);

  if (loading || !user) {
    return (
      <MarketingLayout>
        <div className="container-prj grid place-items-center py-32">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </MarketingLayout>
    );
  }

  return (
    <MarketingLayout>
      <div className="container-prj py-10 md:py-14">
        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-border bg-card p-3">
              <div className="px-3 py-2">
                <p className="font-subhead text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Signed in as
                </p>
                <p className="mt-1 truncate text-sm font-medium">{user.email}</p>
              </div>
              <div className="my-2 border-t border-border" />
              <AccountSidebar />
            </div>
          </aside>
          <section className="min-w-0">
            <Outlet />
          </section>
        </div>
      </div>
    </MarketingLayout>
  );
}
