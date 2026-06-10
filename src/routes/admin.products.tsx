import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { inr } from "@/lib/format";

export const Route = createFileRoute("/admin/products")({ component: AdminProducts });

function AdminProducts() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("farmer_products")
        .select("*, farmer:farmer_profiles(id, full_name, farm_name, slug)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const setStatus = async (id: string, status: "published" | "draft" | "archived") => {
    const { error } = await supabase.from("farmer_products").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Marked ${status}`);
    qc.invalidateQueries({ queryKey: ["admin-products"] });
  };

  const remove = async (id: string) => {
    if (!confirm("Permanently delete this listing?")) return;
    const { error } = await supabase.from("farmer_products").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["admin-products"] });
  };

  const filtered = products.filter((p: any) => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (!q.trim()) return true;
    const s = q.toLowerCase();
    return p.name.toLowerCase().includes(s) || p.category.toLowerCase().includes(s) || p.farmer?.full_name?.toLowerCase().includes(s);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl font-semibold">Products</h2>
          <p className="mt-1 text-sm text-muted-foreground">{products.length} listings across all farmers.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="font-subhead h-10 rounded-full border border-border bg-background px-4 text-xs outline-none focus:border-primary">
            <option value="all">All status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
          <label className="relative w-64 max-w-full">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products" className="font-subhead h-10 w-full rounded-full border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary" />
          </label>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-background">
        {isLoading ? (
          <div className="grid place-items-center py-20"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <p className="py-20 text-center text-sm text-muted-foreground">No products match.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-secondary/40">
              <tr className="font-subhead text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                <th className="px-5 py-3 text-left">Product</th>
                <th className="text-left">Farmer</th>
                <th className="text-left">Category</th>
                <th className="text-right">Price</th>
                <th className="text-right">Stock</th>
                <th className="text-left">Status</th>
                <th className="px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p: any) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {p.images?.[0]
                        ? <img src={p.images[0]} alt={p.name} className="h-10 w-10 rounded-lg object-cover" />
                        : <div className="h-10 w-10 rounded-lg bg-secondary" />}
                      <div>
                        <p className="font-medium">{p.name}</p>
                        <p className="font-subhead text-[11px] text-muted-foreground">{p.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-muted-foreground">{p.farmer?.full_name ?? "—"}</td>
                  <td className="capitalize">{p.category.replace(/-/g, " ")}</td>
                  <td className="text-right">{inr(Number(p.price))}</td>
                  <td className="text-right">{p.stock} {p.unit}</td>
                  <td>
                    <span className={`font-subhead rounded-full px-2 py-0.5 text-[11px] capitalize ${
                      p.status === "published" ? "bg-success/15 text-success"
                      : p.status === "draft" ? "bg-warning/15 text-warning"
                      : "bg-secondary text-muted-foreground"
                    }`}>{p.status}</span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="inline-flex gap-1">
                      {p.status !== "published" && (
                        <button onClick={() => setStatus(p.id, "published")} className="font-subhead rounded-full border border-border px-2.5 py-1 text-[11px] hover:bg-secondary">Publish</button>
                      )}
                      {p.status !== "archived" && (
                        <button onClick={() => setStatus(p.id, "archived")} className="font-subhead rounded-full border border-border px-2.5 py-1 text-[11px] hover:bg-secondary">Archive</button>
                      )}
                      <button onClick={() => remove(p.id)} className="font-subhead rounded-full border border-destructive/30 px-2.5 py-1 text-[11px] text-destructive hover:bg-destructive/10">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
