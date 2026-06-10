import { createFileRoute } from "@tanstack/react-router";
import { productsByFarmer } from "@/lib/mock/products";

export const Route = createFileRoute("/farmer-portal/inventory")({
  component: FarmerInventory,
});

function FarmerInventory() {
  const items = productsByFarmer("asha-patel");
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-3xl font-semibold">Inventory</h2>
        <p className="mt-1 text-sm text-muted-foreground">Update stock levels. Changes go live instantly.</p>
      </div>
      <div className="space-y-3">
        {items.map((p) => (
          <div key={p.slug} className="flex items-center gap-4 rounded-2xl border border-border bg-background p-4">
            <img src={p.image} alt={p.name} className="h-14 w-14 rounded-xl object-cover" />
            <div className="flex-1">
              <p className="font-display text-base font-medium">{p.name}</p>
              <p className="font-subhead text-xs text-muted-foreground">{p.weight}</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                defaultValue={p.stock}
                className="font-subhead h-10 w-24 rounded-xl border border-border bg-background px-3 text-right text-sm outline-none focus:border-primary"
              />
              <span className="font-subhead text-xs text-muted-foreground">in stock</span>
            </div>
            <button className="font-subhead rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:opacity-90">
              Save
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
