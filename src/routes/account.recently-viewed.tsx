import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { AccountPageHeader } from "@/components/account/page-header";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { allProducts } from "@/lib/mock/products";
import { inr } from "@/lib/format";

export const Route = createFileRoute("/account/recently-viewed")({
  component: RecentlyViewedPage,
});

function RecentlyViewedPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<{ product_slug: string; viewed_at: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("recently_viewed")
      .select("product_slug, viewed_at")
      .eq("user_id", user.id)
      .order("viewed_at", { ascending: false })
      .limit(40);
    setLoading(false);
    if (error) return toast.error(error.message);
    setRows((data ?? []) as { product_slug: string; viewed_at: string }[]);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const clearAll = async () => {
    if (!user || !confirm("Clear your viewing history?")) return;
    const { error } = await supabase.from("recently_viewed").delete().eq("user_id", user.id);
    if (error) return toast.error(error.message);
    setRows([]);
    toast.success("History cleared");
  };

  const items = rows
    .map((r) => {
      const p = allProducts.find((x) => x.slug === r.product_slug);
      return p ? { ...p, viewed_at: r.viewed_at } : null;
    })
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  return (
    <>
      <AccountPageHeader
        title="Recently viewed"
        description="Pick up where you left off."
        action={
          items.length > 0 ? (
            <button
              onClick={clearAll}
              className="font-subhead inline-flex h-10 items-center rounded-full border border-border px-4 text-xs uppercase tracking-[0.14em] hover:bg-secondary"
            >
              Clear history
            </button>
          ) : null
        }
      />

      {loading ? (
        <div className="grid place-items-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <p className="font-display text-lg font-semibold">Nothing here yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Products you view will appear here while you're signed in.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => (
            <Link
              key={p.slug}
              to="/product/$slug"
              params={{ slug: p.slug }}
              className="flex gap-3 rounded-2xl border border-border bg-card p-3 transition-colors hover:bg-secondary/40"
            >
              <img src={p.image} alt={p.name} className="h-20 w-20 rounded-xl object-cover" />
              <div className="min-w-0">
                <p className="font-display truncate text-sm font-medium">{p.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {inr(p.price)} · {p.weight}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Viewed {new Date(p.viewed_at).toLocaleDateString()}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
