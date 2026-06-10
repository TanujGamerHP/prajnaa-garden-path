import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { productsByFarmer } from "@/lib/mock/products";
import { inr } from "@/lib/format";

export const Route = createFileRoute("/farmer-portal/products")({
  component: FarmerProducts,
});

function FarmerProducts() {
  const items = productsByFarmer("asha-patel");
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-3xl font-semibold">Products</h2>
          <p className="mt-1 text-sm text-muted-foreground">Manage what you sell on Prajnaa.</p>
        </div>
        <button className="font-subhead inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
          <Plus className="h-4 w-4" /> New product
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-background">
        <table className="w-full text-sm">
          <thead className="bg-secondary/40">
            <tr className="font-subhead text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              <th className="px-5 py-3 text-left">Product</th>
              <th className="text-left">Category</th>
              <th className="text-right">Price</th>
              <th className="text-right">Stock</th>
              <th className="px-5 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.slug} className="border-t border-border">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <img src={p.image} alt={p.name} className="h-12 w-12 rounded-lg object-cover" />
                    <div>
                      <p className="font-medium">{p.name}</p>
                      <p className="font-subhead text-[11px] text-muted-foreground">{p.weight}</p>
                    </div>
                  </div>
                </td>
                <td className="capitalize">{p.category.replace("-", " ")}</td>
                <td className="text-right font-medium">{inr(p.price)}</td>
                <td className="text-right">{p.stock}</td>
                <td className="px-5 text-right"><button className="font-subhead text-xs text-primary">Edit</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
