import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";
import { StatCard } from "@/components/dashboard/shell";
import { supabase } from "@/integrations/supabase/client";
import { inr } from "@/lib/format";

export const Route = createFileRoute("/admin/settlements")({ component: AdminSettlements });

function AdminSettlements() {
  const qc = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin-settlements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("farmer_payouts")
        .select("*, farmer:farmer_profiles(full_name, farm_name, bank_name, bank_account_number)")
        .order("period_end", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = rows.filter((r: any) => statusFilter === "all" || r.status === statusFilter);
  const totalPending = rows.filter((r: any) => r.status !== "paid").reduce((s: number, r: any) => s + Number(r.net_amount), 0);
  const totalPaid = rows.filter((r: any) => r.status === "paid").reduce((s: number, r: any) => s + Number(r.net_amount), 0);
  const farmersAwaiting = new Set(rows.filter((r: any) => r.status !== "paid").map((r: any) => r.farmer_id)).size;

  const markPaid = async (id: string) => {
    setBusy(id);
    const ref = prompt("Payment reference (UTR / transaction id):") || "MANUAL";
    const { error } = await supabase
      .from("farmer_payouts")
      .update({ status: "paid", settled_at: new Date().toISOString(), reference: ref })
      .eq("id", id);
    setBusy(null);
    if (error) { toast.error(error.message); return; }
    toast.success("Payout marked paid");
    qc.invalidateQueries({ queryKey: ["admin-settlements"] });
  };

  const processAll = async () => {
    const pending = rows.filter((r: any) => r.status === "scheduled" || r.status === "processing");
    if (pending.length === 0) { toast.info("Nothing to process"); return; }
    if (!confirm(`Mark ${pending.length} payouts as processing?`)) return;
    const { error } = await supabase
      .from("farmer_payouts")
      .update({ status: "processing" })
      .in("id", pending.map((p: any) => p.id));
    if (error) { toast.error(error.message); return; }
    toast.success(`${pending.length} payouts moved to processing`);
    qc.invalidateQueries({ queryKey: ["admin-settlements"] });
  };

  // Compute next settlement window (7th-10th of next applicable month)
  const today = new Date();
  let openY = today.getFullYear(), openM = today.getMonth();
  if (today.getDate() > 10) { openM++; if (openM > 11) { openM = 0; openY++; } }
  const nextRun = new Date(openY, openM, 7).toLocaleDateString();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-3xl font-semibold">Settlements</h2>
        <p className="mt-1 text-sm text-muted-foreground">Run farmer payouts between the 7th and 10th of every month.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Total pending" value={inr(totalPending)} />
        <StatCard label="Farmers awaiting" value={String(farmersAwaiting)} />
        <StatCard label="Lifetime paid" value={inr(totalPaid)} />
        <StatCard label="Next window opens" value={nextRun} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="font-subhead h-10 rounded-full border border-border bg-background px-4 text-xs outline-none focus:border-primary">
          <option value="all">All statuses</option>
          <option value="scheduled">Scheduled</option>
          <option value="processing">Processing</option>
          <option value="paid">Paid</option>
          <option value="failed">Failed</option>
        </select>
        <button onClick={processAll} className="font-subhead inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90">
          Process all scheduled
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-background">
        {isLoading ? (
          <div className="grid place-items-center py-20"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <p className="py-20 text-center text-sm text-muted-foreground">No settlements yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-secondary/40">
              <tr className="font-subhead text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                <th className="px-5 py-3 text-left">Farmer</th>
                <th className="text-left">Period</th>
                <th className="text-right">Gross</th>
                <th className="text-right">Fees</th>
                <th className="text-right">Net</th>
                <th className="text-left">Bank</th>
                <th className="text-left">Status</th>
                <th className="px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r: any) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-5 py-3 font-medium">{r.farmer?.full_name ?? "—"}</td>
                  <td className="text-muted-foreground">{new Date(r.period_start).toLocaleDateString()} – {new Date(r.period_end).toLocaleDateString()}</td>
                  <td className="text-right">{inr(Number(r.gross_amount))}</td>
                  <td className="text-right text-muted-foreground">{inr(Number(r.fees))}</td>
                  <td className="text-right font-medium">{inr(Number(r.net_amount))}</td>
                  <td className="text-muted-foreground text-xs">
                    {r.farmer?.bank_name} {r.farmer?.bank_account_number ? `•••• ${r.farmer.bank_account_number.slice(-4)}` : ""}
                  </td>
                  <td>
                    {r.status === "paid" ? (
                      <span className="font-subhead inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[11px] text-success">
                        <CheckCircle2 className="h-3 w-3" /> Paid
                      </span>
                    ) : (
                      <span className="font-subhead inline-flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-[11px] text-warning capitalize">
                        <Clock className="h-3 w-3" /> {r.status}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {r.status !== "paid" && (
                      <button
                        disabled={busy === r.id}
                        onClick={() => markPaid(r.id)}
                        className="font-subhead rounded-full border border-border px-3 py-1 text-[11px] hover:bg-secondary disabled:opacity-50"
                      >
                        {busy === r.id ? "Saving..." : "Mark paid"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
