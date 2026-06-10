import { createFileRoute } from "@tanstack/react-router";
import { StatCard } from "@/components/dashboard/shell";
import { inr } from "@/lib/format";

const settlements = [
  { farmer: "Asha Patel", month: "June 2026", gross: 52400, fees: 3768, net: 48632, status: "Pending" },
  { farmer: "Vikram Rao", month: "June 2026", gross: 42180, fees: 3037, net: 39143, status: "Pending" },
  { farmer: "Ramesh Singh", month: "June 2026", gross: 38420, fees: 2766, net: 35654, status: "Pending" },
  { farmer: "Lakshmi Devi", month: "June 2026", gross: 31200, fees: 2246, net: 28954, status: "Pending" },
  { farmer: "Asha Patel", month: "May 2026", gross: 47820, fees: 3438, net: 44382, status: "Paid · Jun 8" },
];

export const Route = createFileRoute("/admin/settlements")({
  component: AdminSettlements,
});

function AdminSettlements() {
  const totalPending = settlements.filter((s) => s.status === "Pending").reduce((s, r) => s + r.net, 0);
  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-3xl font-semibold">Settlements</h2>
        <p className="mt-1 text-sm text-muted-foreground">Run farmer payouts between the 7th and 10th of each month.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total pending" value={inr(totalPending)} />
        <StatCard label="Farmers awaiting" value="4" />
        <StatCard label="Next run" value="Jul 8, 2026" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-background">
        <table className="w-full text-sm">
          <thead className="bg-secondary/40">
            <tr className="font-subhead text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              <th className="px-5 py-3 text-left">Farmer</th>
              <th className="text-left">Month</th>
              <th className="text-right">Gross</th>
              <th className="text-right">Fees</th>
              <th className="text-right">Net</th>
              <th className="px-5 text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {settlements.map((r, i) => (
              <tr key={i} className="border-t border-border">
                <td className="px-5 py-4 font-medium">{r.farmer}</td>
                <td className="text-muted-foreground">{r.month}</td>
                <td className="text-right">{inr(r.gross)}</td>
                <td className="text-right text-muted-foreground">{inr(r.fees)}</td>
                <td className="text-right font-medium">{inr(r.net)}</td>
                <td className="px-5 text-right">
                  <span className={`font-subhead rounded-full px-2 py-0.5 text-[11px] ${r.status === "Pending" ? "bg-warning/15 text-warning" : "bg-success/15 text-success"}`}>{r.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button className="font-subhead rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90">
        Process all pending ({inr(totalPending)})
      </button>
    </div>
  );
}
