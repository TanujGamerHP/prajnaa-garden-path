import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Calendar, IndianRupee, Clock, CheckCircle2 } from "lucide-react";
import { StatCard } from "@/components/dashboard/shell";
import { supabase } from "@/integrations/supabase/client";
import { useFarmerProfile } from "@/lib/farmer/use-farmer";
import { inr } from "@/lib/format";

export const Route = createFileRoute("/farmer-portal/earnings")({ component: EarningsPage });

/**
 * Settlement window: 7th–10th of every month for sales completed the previous month.
 */
function nextSettlementWindow(today = new Date()) {
  const year = today.getFullYear();
  const month = today.getMonth();
  const day = today.getDate();
  // Window for current month is the 7th–10th
  let openYear = year, openMonth = month;
  if (day > 10) {
    openMonth = month + 1;
    if (openMonth > 11) { openMonth = 0; openYear++; }
  }
  const open = new Date(openYear, openMonth, 7);
  const close = new Date(openYear, openMonth, 10);
  // Period being settled is the previous calendar month
  const periodMonth = openMonth - 1;
  const periodYear = periodMonth < 0 ? openYear - 1 : openYear;
  const pm = (periodMonth + 12) % 12;
  const periodStart = new Date(periodYear, pm, 1);
  const periodEnd = new Date(periodYear, pm + 1, 0);
  return { open, close, periodStart, periodEnd };
}

function upcomingSchedule(months = 6) {
  const out: ReturnType<typeof nextSettlementWindow>[] = [];
  let cursor = new Date();
  for (let i = 0; i < months; i++) {
    const w = nextSettlementWindow(cursor);
    out.push(w);
    // move cursor to after the close date
    cursor = new Date(w.close.getFullYear(), w.close.getMonth() + 1, 11);
  }
  return out;
}

function EarningsPage() {
  const { data: farmer } = useFarmerProfile();
  const { data: payouts = [], isLoading } = useQuery({
    enabled: !!farmer?.id,
    queryKey: ["farmer-payouts", farmer?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("farmer_payouts")
        .select("*")
        .eq("farmer_id", farmer!.id)
        .order("period_end", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const lifetime = payouts.filter((p) => p.status === "paid").reduce((s, p) => s + Number(p.net_amount), 0);
  const pending = payouts.filter((p) => p.status !== "paid").reduce((s, p) => s + Number(p.net_amount), 0);
  const schedule = upcomingSchedule(6);
  const next = schedule[0];
  const last12 = payouts.filter((p) => p.status === "paid").slice(0, 12);
  const avg = last12.length ? last12.reduce((s, p) => s + Number(p.net_amount), 0) / last12.length : 0;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl font-semibold">Earnings</h2>
        <p className="text-sm text-muted-foreground">
          Sales from each calendar month settle to your bank account between the <strong>7th and 10th</strong> of the following month.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Lifetime earned" value={inr(lifetime)} />
        <StatCard label="Pending payouts" value={inr(pending)} />
        <StatCard label="Avg monthly (12 mo)" value={inr(avg)} />
        <StatCard label="Bank account" value={farmer?.bank_account_number ? `•••• ${farmer.bank_account_number.slice(-4)}` : "—"} delta={farmer?.bank_name ?? undefined} />
      </div>

      {/* Next settlement banner */}
      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground">
              <IndianRupee className="h-5 w-5" />
            </div>
            <div>
              <p className="font-subhead text-[11px] uppercase tracking-[0.14em] text-primary">Next settlement</p>
              <p className="font-display mt-0.5 text-lg font-semibold">
                {next.open.toLocaleDateString(undefined, { month: "long", day: "numeric" })} – {next.close.toLocaleDateString(undefined, { day: "numeric", year: "numeric" })}
              </p>
              <p className="text-sm text-muted-foreground">
                Covers sales from {next.periodStart.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – {next.periodEnd.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-subhead text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Estimated amount</p>
            <p className="font-display text-2xl font-semibold">{inr(pending)}</p>
          </div>
        </div>
      </div>

      {/* Upcoming schedule */}
      <div className="rounded-2xl border border-border bg-background">
        <div className="border-b border-border px-5 py-3 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-display text-sm font-semibold">Upcoming settlement schedule</h3>
        </div>
        <ul className="divide-y divide-border">
          {schedule.map((w, i) => (
            <li key={i} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm">
              <div className="flex items-center gap-3">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-medium">
                  {w.open.toLocaleDateString(undefined, { month: "short", day: "numeric" })}–{w.close.toLocaleDateString(undefined, { day: "numeric", year: "numeric" })}
                </span>
                <span className="text-muted-foreground">
                  for {w.periodStart.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
                </span>
              </div>
              {i === 0 && <span className="font-subhead rounded-full bg-primary/15 px-2 py-0.5 text-[11px] text-primary">Next</span>}
            </li>
          ))}
        </ul>
      </div>

      {/* Payout history */}
      <div className="rounded-2xl border border-border bg-background">
        <div className="border-b border-border px-5 py-3">
          <h3 className="font-display text-sm font-semibold">Payout history</h3>
        </div>
        {isLoading ? (
          <div className="grid place-items-center py-16"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : payouts.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">No payouts yet. Once you make sales, monthly settlements will appear here.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="font-subhead text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                <th className="px-5 py-3 text-left">Period</th>
                <th className="text-right">Gross</th>
                <th className="text-right">Fees</th>
                <th className="text-right">Net</th>
                <th className="text-left">Status</th>
                <th className="px-5 text-right">Settled</th>
                <th className="px-5 text-right">Reference</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="px-5 py-3">{new Date(p.period_start).toLocaleDateString()} – {new Date(p.period_end).toLocaleDateString()}</td>
                  <td className="text-right">{inr(Number(p.gross_amount))}</td>
                  <td className="text-right text-muted-foreground">{inr(Number(p.fees))}</td>
                  <td className="text-right font-medium">{inr(Number(p.net_amount))}</td>
                  <td>
                    {p.status === "paid" ? (
                      <span className="font-subhead inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[11px] text-success">
                        <CheckCircle2 className="h-3 w-3" /> Paid
                      </span>
                    ) : (
                      <span className="font-subhead inline-flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-[11px] text-warning capitalize">
                        <Clock className="h-3 w-3" /> {p.status}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right text-muted-foreground">{p.settled_at ? new Date(p.settled_at).toLocaleDateString() : "—"}</td>
                  <td className="px-5 py-3 text-right text-muted-foreground font-mono text-xs">{p.reference ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
