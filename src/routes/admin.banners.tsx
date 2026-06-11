import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import heroImg from "@/assets/hero.jpg";
import seasonalImg from "@/assets/cat-pickles.jpg";
import farmerImg from "@/assets/farmer-1.jpg";

const banners = [
  {
    id: "b1",
    title: "From Soil to Soul",
    placement: "Homepage hero",
    status: "Live",
    image: heroImg,
  },
  {
    id: "b2",
    title: "Seasonal harvest",
    placement: "Homepage mid",
    status: "Live",
    image: seasonalImg,
  },
  {
    id: "b3",
    title: "Meet our farmers",
    placement: "Category page",
    status: "Draft",
    image: farmerImg,
  },
];

export const Route = createFileRoute("/admin/banners")({
  component: AdminBanners,
});

function AdminBanners() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-3xl font-semibold">Banners</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage banners across the storefront.
          </p>
        </div>
        <button className="font-subhead inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
          <Plus className="h-4 w-4" /> New banner
        </button>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {banners.map((b) => (
          <div
            key={b.id}
            className="overflow-hidden rounded-2xl border border-border bg-background"
          >
            <img src={b.image} alt={b.title} className="aspect-[16/9] w-full object-cover" />
            <div className="p-4">
              <p className="font-display text-base font-medium">{b.title}</p>
              <p className="font-subhead mt-1 text-xs text-muted-foreground">{b.placement}</p>
              <div className="mt-3 flex items-center justify-between">
                <span
                  className={`font-subhead rounded-full px-2 py-0.5 text-[11px] ${b.status === "Live" ? "bg-success/15 text-success" : "bg-secondary text-muted-foreground"}`}
                >
                  {b.status}
                </span>
                <button className="font-subhead text-xs text-primary">Edit</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
