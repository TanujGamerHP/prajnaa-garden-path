import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Star, Trash2, Pencil } from "lucide-react";
import { AccountPageHeader } from "@/components/account/page-header";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { allProducts } from "@/lib/mock/products";

export const Route = createFileRoute("/account/reviews")({
  component: ReviewsPage,
});

type Review = {
  id: string;
  product_slug: string;
  rating: number;
  title: string | null;
  body: string | null;
  created_at: string;
};

function ReviewsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Review | null>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("product_reviews")
      .select("id, product_slug, rating, title, body, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setLoading(false);
    if (error) return toast.error(error.message);
    setItems((data ?? []) as Review[]);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const remove = async (id: string) => {
    if (!confirm("Delete this review?")) return;
    const { error } = await supabase.from("product_reviews").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Review removed");
    load();
  };

  return (
    <>
      <AccountPageHeader
        title="Your reviews"
        description="Ratings and write-ups you've published."
      />

      {loading ? (
        <div className="grid place-items-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <p className="font-display text-lg font-semibold">No reviews yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            After you receive an order, share your thoughts to help other shoppers.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((r) => {
            const p = allProducts.find((x) => x.slug === r.product_slug);
            return (
              <article key={r.id} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    {p ? (
                      <Link
                        to="/product/$slug"
                        params={{ slug: p.slug }}
                        className="font-display text-base font-medium hover:underline"
                      >
                        {p.name}
                      </Link>
                    ) : (
                      <p className="font-display text-base font-medium">{r.product_slug}</p>
                    )}
                    <div className="mt-1 flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${i < r.rating ? "fill-warning text-warning" : "text-border"}`}
                        />
                      ))}
                      <span className="ml-2 text-xs text-muted-foreground">
                        {new Date(r.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditing(r)}
                      className="rounded-full border border-border p-2 hover:bg-secondary"
                      aria-label="Edit review"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => remove(r.id)}
                      className="rounded-full border border-border p-2 text-destructive hover:bg-destructive/10"
                      aria-label="Delete review"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                {r.title && <p className="mt-3 font-medium">{r.title}</p>}
                {r.body && <p className="mt-1 text-sm text-muted-foreground">{r.body}</p>}
              </article>
            );
          })}
        </div>
      )}

      {editing && (
        <EditReviewDialog
          review={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </>
  );
}

function EditReviewDialog({
  review,
  onClose,
  onSaved,
}: {
  review: Review;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [rating, setRating] = useState(review.rating);
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setSaving(true);
    const { error } = await supabase
      .from("product_reviews")
      .update({
        rating,
        title: (String(fd.get("title") || "").trim() || null) as string | null,
        body: (String(fd.get("body") || "").trim() || null) as string | null,
      })
      .eq("id", review.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Review updated");
    onSaved();
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <form
        onSubmit={onSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl border border-border bg-background p-6 shadow-xl"
      >
        <h2 className="font-display text-xl font-semibold">Edit review</h2>
        <div className="mt-5 grid gap-4">
          <div>
            <span className="font-subhead text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Rating
            </span>
            <div className="mt-2 flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  aria-label={`Rate ${n} star${n > 1 ? "s" : ""}`}
                >
                  <Star
                    className={`h-7 w-7 transition-colors ${
                      n <= rating ? "fill-warning text-warning" : "text-border"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
          <label className="block">
            <span className="font-subhead text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Title
            </span>
            <input name="title" defaultValue={review.title ?? ""} className="input-prj mt-2" />
          </label>
          <label className="block">
            <span className="font-subhead text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Review
            </span>
            <textarea
              name="body"
              defaultValue={review.body ?? ""}
              rows={4}
              className="input-prj mt-2"
            />
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="font-subhead inline-flex h-10 items-center rounded-full border border-border px-4 text-xs uppercase tracking-[0.14em] hover:bg-secondary"
          >
            Cancel
          </button>
          <button
            disabled={saving}
            className="font-subhead inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-xs uppercase tracking-[0.14em] text-primary-foreground hover:opacity-90 disabled:opacity-60"
          >
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Save
          </button>
        </div>
      </form>
    </div>
  );
}
