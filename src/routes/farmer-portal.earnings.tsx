import { createFileRoute } from "@tanstack/react-router";
import { StatCard } from "@/components/dashboard/shell";
import { inr } from "@/lib/format";

export const Route = createFileRoute("/farmer-portal/earnings")({
  component: FarmerEarnings,
});

const months = [
  { m: "June 2026", gross: 52400, fees: 3768, net: 48632, status: "Pending settlement" },
  { m: "May 2026", gross: 47820, fees: 3438, net: 44382, status: "Paid · Jun 8" },
  { m: "April 2026", gross: 41250, fees: 2966, net: 38284, status: "Paid · May 9" },
  { m: "March 2026", gross: 38900, fees: 2796, net: 36104, status: "Paid · Apr 10" },
];

function FarmerEarnings() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-3xl font-semibold">Earnings</h2>
        <p className="mt-1 text-sm text-muted-foreground">Settlements run between the 7th and 10th of every month.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="This month (gross)" value={inr(52400)} delta="+9.6% vs last month" />
        <StatCard label="Platform fees" value={inr(3768)} />
        <StatCard label="Net payable" value={inr(48632)} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-background">
        <table className="w-full text-sm">
          <thead className="bg-secondary/40">
            <tr className="font-subhead text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              <th className="px-5 py-3 text-left">Month</th>
              <th className="text-right">Gross</th>
              <th className="text-right">Fees</th>
              <th className="text-right">Net</th>
              <th className="px-5 text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {months.map((r) => (
              <tr key={r.m} className="border-t border-border">
                <td className="px-5 py-4 font-medium">{r.m}</td>
                <td className="text-right">{inr(r.gross)}</td>
                <td className="text-right text-muted-foreground">{inr(r.fees)}</td>
                <td className="text-right font-medium">{inr(r.net)}</td>
                <td className="px-5 text-right text-xs text-muted-foreground">{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
