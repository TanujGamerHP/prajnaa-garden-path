import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";

const coupons = [
  { code: "WELCOME10", desc: "10% off first order", uses: 1284, status: "Active" },
  { code: "HARVEST25", desc: "₹250 off above ₹1,500", uses: 312, status: "Active" },
  { code: "FREESHIP", desc: "Free shipping, any order", uses: 980, status: "Active" },
  { code: "DIWALI2025", desc: "15% off entire site", uses: 4210, status: "Expired" },
];

export const Route = createFileRoute("/admin/coupons")({
  component: AdminCoupons,
});

function AdminCoupons() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-3xl font-semibold">Coupons</h2>
          <p className="mt-1 text-sm text-muted-foreground">Manage promotional codes.</p>
        </div>
        <button className="font-subhead inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
          <Plus className="h-4 w-4" /> New coupon
        </button>
      </div>
      <div className="overflow-hidden rounded-2xl border border-border bg-background">
        <table className="w-full text-sm">
          <thead className="bg-secondary/40">
            <tr className="font-subhead text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              <th className="px-5 py-3 text-left">Code</th>
              <th className="text-left">Description</th>
              <th className="text-right">Uses</th>
              <th className="px-5 text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c.code} className="border-t border-border">
                <td className="px-5 py-4 font-display font-medium">{c.code}</td>
                <td className="text-muted-foreground">{c.desc}</td>
                <td className="text-right">{c.uses.toLocaleString()}</td>
                <td className="px-5 text-right">
                  <span
                    className={`font-subhead rounded-full px-2 py-0.5 text-[11px] ${c.status === "Active" ? "bg-success/15 text-success" : "bg-secondary text-muted-foreground"}`}
                  >
                    {c.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
