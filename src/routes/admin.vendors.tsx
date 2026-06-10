import { createFileRoute } from "@tanstack/react-router";
import { Check, X } from "lucide-react";
import { farmers } from "@/lib/mock/farmers";

const pending = [
  { name: "Devraj Kumar", village: "Coorg", state: "Karnataka", category: "Coffee, Spices", years: 14 },
  { name: "Sunita Yadav", village: "Lucknow", state: "Uttar Pradesh", category: "Pickles, Chutneys", years: 8 },
  { name: "Mohan Iyer", village: "Madurai", state: "Tamil Nadu", category: "Honey, Herbs", years: 19 },
];

export const Route = createFileRoute("/admin/vendors")({
  component: AdminVendors,
});

function AdminVendors() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-3xl font-semibold">Vendors</h2>
        <p className="mt-1 text-sm text-muted-foreground">Approve new farmer applications and manage active vendors.</p>
      </div>

      <section>
        <h3 className="font-display text-lg font-semibold">Pending approval ({pending.length})</h3>
        <div className="mt-4 space-y-3">
          {pending.map((v) => (
            <div key={v.name} className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-background p-5">
              <div className="flex-1 min-w-[200px]">
                <p className="font-display text-base font-medium">{v.name}</p>
                <p className="font-subhead text-xs text-muted-foreground">{v.village}, {v.state} · {v.years} yrs · {v.category}</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="font-subhead inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:opacity-90"><Check className="h-3.5 w-3.5" /> Approve</button>
                <button className="font-subhead inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-2 text-xs hover:bg-secondary"><X className="h-3.5 w-3.5" /> Decline</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="font-display text-lg font-semibold">Active vendors ({farmers.length})</h3>
        <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-background">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40">
              <tr className="font-subhead text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                <th className="px-5 py-3 text-left">Farmer</th>
                <th className="text-left">Location</th>
                <th className="text-left">Method</th>
                <th className="px-5 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {farmers.map((f) => (
                <tr key={f.slug} className="border-t border-border">
                  <td className="px-5 py-4 font-medium">{f.name}</td>
                  <td>{f.village}, {f.state}</td>
                  <td className="text-muted-foreground">{f.method}</td>
                  <td className="px-5 text-right"><span className="font-subhead rounded-full bg-success/15 px-2 py-0.5 text-[11px] text-success">Active</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
