import { createFileRoute } from "@tanstack/react-router";
import { allProducts } from "@/lib/mock/products";
import { farmerBySlug } from "@/lib/mock/farmers";
import { inr } from "@/lib/format";

export const Route = createFileRoute("/admin/products")({
  component: AdminProducts,
});

function AdminProducts() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-3xl font-semibold">Products</h2>
        <p className="mt-1 text-sm text-muted-foreground">{allProducts.length} live listings across all vendors.</p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-border bg-background">
        <table className="w-full text-sm">
          <thead className="bg-secondary/40">
            <tr className="font-subhead text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              <th className="px-5 py-3 text-left">Product</th>
              <th className="text-left">Farmer</th>
              <th className="text-left">Category</th>
              <th className="text-right">Price</th>
              <th className="text-right">Stock</th>
              <th className="px-5 text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {allProducts.map((p) => {
              const f = farmerBySlug(p.farmerSlug);
              return (
                <tr key={p.slug} className="border-t border-border">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <img src={p.image} alt={p.name} className="h-10 w-10 rounded-lg object-cover" />
                      <span className="font-medium">{p.name}</span>
                    </div>
                  </td>
                  <td className="text-muted-foreground">{f?.name}</td>
                  <td className="capitalize">{p.category.replace("-", " ")}</td>
                  <td className="text-right">{inr(p.price)}</td>
                  <td className="text-right">{p.stock}</td>
                  <td className="px-5 text-right"><span className="font-subhead rounded-full bg-success/15 px-2 py-0.5 text-[11px] text-success">Live</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
