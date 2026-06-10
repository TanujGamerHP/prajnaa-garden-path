import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useFarmerProfile, slugify } from "@/lib/farmer/use-farmer";
import { inr } from "@/lib/format";

export const Route = createFileRoute("/farmer-portal/products")({ component: ProductsPage });

const productSchema = z.object({
  name: z.string().trim().min(2).max(120),
  category: z.string().trim().min(2).max(60),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Valid price"),
  stock: z.string().regex(/^\d+$/, "Whole number"),
  unit: z.string().min(1).max(20),
  images: z.string().max(2000).optional().or(z.literal("")),
});

type FormState = z.infer<typeof productSchema>;
const empty: FormState = { name: "", category: "vegetables", description: "", price: "", stock: "0", unit: "kg", images: "" };

function ProductsPage() {
  const { data: farmer } = useFarmerProfile();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: products = [], isLoading } = useQuery({
    enabled: !!farmer?.id,
    queryKey: ["farmer-products", farmer?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("farmer_products").select("*").eq("farmer_id", farmer!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const upsertMut = useMutation({
    mutationFn: async (input: FormState & { id?: string }) => {
      if (!farmer) throw new Error("No farmer profile");
      const payload = {
        ...(input.id ? { id: input.id } : {}),
        farmer_id: farmer.id,
        user_id: farmer.user_id,
        name: input.name.trim(),
        slug: slugify(input.name) + "-" + Math.random().toString(36).slice(2, 6),
        category: input.category,
        description: input.description || null,
        price: Number(input.price),
        stock: parseInt(input.stock, 10),
        unit: input.unit,
        images: (input.images || "").split(",").map((s) => s.trim()).filter(Boolean),
        status: farmer.status === "approved" ? "pending" : "draft",
      } as const;
      if (input.id) {
        const { error } = await supabase.from("farmer_products").update(payload).eq("id", input.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("farmer_products").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Product updated" : "Product added");
      qc.invalidateQueries({ queryKey: ["farmer-products", farmer?.id] });
      setShowForm(false); setEditing(null); setForm(empty);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("farmer_products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["farmer-products", farmer?.id] }); },
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = productSchema.safeParse(form);
    if (!res.success) {
      const errs: Record<string, string> = {};
      res.error.issues.forEach((i) => { errs[i.path[0] as string] = i.message; });
      setErrors(errs);
      return;
    }
    setErrors({});
    upsertMut.mutate({ ...res.data, id: editing ?? undefined });
  };

  const startEdit = (p: typeof products[number]) => {
    setEditing(p.id);
    setForm({
      name: p.name, category: p.category, description: p.description ?? "",
      price: String(p.price), stock: String(p.stock), unit: p.unit,
      images: (p.images ?? []).join(", "),
    });
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold">Products</h2>
          <p className="text-sm text-muted-foreground">List and manage your produce.</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm(empty); }} className="font-subhead inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          <Plus className="h-4 w-4" /> New product
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="rounded-2xl border border-border bg-background p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <F label="Name" v={form.name} on={(v) => setForm({ ...form, name: v })} err={errors.name} />
            <Sel label="Category" v={form.category} on={(v) => setForm({ ...form, category: v })} opts={["vegetables","fruits","grains","pulses","spices","oils","sweeteners","dairy","other"]} />
            <F label="Price (INR)" v={form.price} on={(v) => setForm({ ...form, price: v })} err={errors.price} type="number" step="0.01" />
            <F label="Stock" v={form.stock} on={(v) => setForm({ ...form, stock: v })} err={errors.stock} type="number" />
            <Sel label="Unit" v={form.unit} on={(v) => setForm({ ...form, unit: v })} opts={["kg","g","piece","dozen","litre","bunch"]} />
            <F label="Image URLs (comma separated)" v={form.images || ""} on={(v) => setForm({ ...form, images: v })} />
            <label className="md:col-span-2 block">
              <span className="font-subhead text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Description</span>
              <textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="font-subhead mt-1.5 w-full rounded-xl border border-border bg-background p-3.5 text-sm outline-none focus:border-primary" />
            </label>
          </div>
          <div className="mt-6 flex gap-3">
            <button type="submit" disabled={upsertMut.isPending} className="font-subhead inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50">
              {upsertMut.isPending && <Loader2 className="h-4 w-4 animate-spin" />} {editing ? "Save changes" : "Add product"}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="font-subhead rounded-full border border-border px-5 py-2.5 text-sm">Cancel</button>
          </div>
        </form>
      )}

      <div className="rounded-2xl border border-border bg-background">
        {isLoading ? (
          <div className="grid place-items-center py-16"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : products.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">No products yet. Click "New product" to add one.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="font-subhead text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                <th className="px-5 py-3 text-left">Product</th>
                <th className="text-left">Category</th>
                <th className="text-left">Status</th>
                <th className="text-right">Stock</th>
                <th className="text-right">Price</th>
                <th className="px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="px-5 py-3 font-medium">{p.name}</td>
                  <td className="capitalize text-muted-foreground">{p.category}</td>
                  <td className="capitalize text-muted-foreground">{p.status}</td>
                  <td className="text-right">{p.stock} {p.unit}</td>
                  <td className="text-right font-medium">{inr(Number(p.price))}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="inline-flex gap-2">
                      <button onClick={() => startEdit(p)} className="rounded-md p-1.5 hover:bg-secondary" aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => { if (confirm("Delete this product?")) delMut.mutate(p.id); }} className="rounded-md p-1.5 text-destructive hover:bg-destructive/10" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
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

function F({ label, v, on, err, ...rest }: { label: string; v: string; on: (v: string) => void; err?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="font-subhead text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
      <input {...rest} value={v} onChange={(e) => on(e.target.value)} className={`font-subhead mt-1.5 h-11 w-full rounded-xl border bg-background px-3.5 text-sm outline-none focus:border-primary ${err ? "border-destructive" : "border-border"}`} />
      {err && <span className="mt-1 block text-xs text-destructive">{err}</span>}
    </label>
  );
}
function Sel({ label, v, on, opts }: { label: string; v: string; on: (v: string) => void; opts: string[] }) {
  return (
    <label className="block">
      <span className="font-subhead text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
      <select value={v} onChange={(e) => on(e.target.value)} className="font-subhead mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3.5 text-sm outline-none focus:border-primary capitalize">
        {opts.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}
