import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useFarmerProfile } from "@/lib/farmer/use-farmer";

export const Route = createFileRoute("/farmer-portal/inventory")({ component: InventoryPage });

function InventoryPage() {
  const { data: farmer } = useFarmerProfile();
  const qc = useQueryClient();
  const [draft, setDraft] = useState<Record<string, number>>({});

  const { data: products = [], isLoading } = useQuery({
    enabled: !!farmer?.id,
    queryKey: ["farmer-products", farmer?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("farmer_products")
        .select("id,name,stock,unit,status")
        .eq("farmer_id", farmer!.id)
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    const map: Record<string, number> = {};
    products.forEach((p: any) => {
      map[p.id] = p.stock;
    });
    setDraft(map);
  }, [products]);

  const saveMut = useMutation({
    mutationFn: async () => {
      const changes = products.filter((p: any) => draft[p.id] !== p.stock);
      for (const p of changes) {
        const { error } = await supabase
          .from("farmer_products")
          .update({ stock: draft[p.id] })
          .eq("id", p.id);
        if (error) throw error;
      }
      return changes.length;
    },
    onSuccess: (n) => {
      toast.success(`Updated ${n} item${n === 1 ? "" : "s"}`);
      qc.invalidateQueries({ queryKey: ["farmer-products", farmer?.id] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });

  const dirty = products.some((p: any) => draft[p.id] !== p.stock);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold">Inventory</h2>
          <p className="text-sm text-muted-foreground">Bulk-update stock for all your listings.</p>
        </div>
        <button
          onClick={() => saveMut.mutate()}
          disabled={!dirty || saveMut.isPending}
          className="font-subhead inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {saveMut.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}{" "}
          Save changes
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-background">
        {isLoading ? (
          <div className="grid place-items-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : products.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">No products to manage.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="font-subhead text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                <th className="px-5 py-3 text-left">Product</th>
                <th className="text-left">Status</th>
                <th className="text-right">Current</th>
                <th className="px-5 text-right">New stock</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p: any) => {
                const current = p.stock;
                const next = draft[p.id] ?? current;
                const changed = next !== current;
                return (
                  <tr
                    key={p.id}
                    className={`border-t border-border ${changed ? "bg-warning/5" : ""}`}
                  >
                    <td className="px-5 py-3 font-medium">{p.name}</td>
                    <td className="capitalize text-muted-foreground">{p.status}</td>
                    <td className="text-right text-muted-foreground">
                      {current} {p.unit}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <input
                        type="number"
                        min={0}
                        value={next}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            [p.id]: Math.max(0, parseInt(e.target.value || "0", 10)),
                          })
                        }
                        className="font-subhead w-24 rounded-lg border border-border bg-background px-2 py-1.5 text-right text-sm outline-none focus:border-primary"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
