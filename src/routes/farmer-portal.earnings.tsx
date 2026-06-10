import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { StatCard } from "@/components/dashboard/shell";
import { supabase } from "@/integrations/supabase/client";
import { useFarmerProfile } from "@/lib/farmer/use-farmer";
import { inr } from "@/lib/format";

export const Route = createFileRoute("/farmer-portal/earnings")({ component: EarningsPage });

function EarningsPage() {
  const { data: farmer } = useFarmerProfile();
  const { data: payouts = [], isLoading } = useQuery({
    enabled: !!farmer?.id,
    queryKey: ["farmer-payouts", farmer?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("farmer_payouts").select("*").eq("farmer_id", farmer!.id).order("period_end", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const lifetime = payouts.filter((p) => p.status === "paid").reduce((s, p) => s + Number(p.net_amount), 0);
  const pending = payouts.filter((p) => p.status !== "paid").reduce((s, p) => s + Number(p.net_amount), 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-semibold">Earnings</h2>
        <p className="text-sm text-muted-foreground">Settlements are credited between the 7th and 10th each month.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Lifetime earned" value={inr(lifetime)} />
        <StatCard label="Pending payouts" value={inr(pending)} />
        <StatCard label="Bank account" value={farmer?.bank_account_number ? `•••• ${farmer.bank_account_number.slice(-4)}` : "—"} delta={farmer?.bank_name ?? undefined} />
      </div>

      <div className="rounded-2xl border border-border bg-background">
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
              </tr>
            </thead>
            <tbody>
              {payouts.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="px-5 py-3">{new Date(p.period_start).toLocaleDateString()} – {new Date(p.period_end).toLocaleDateString()}</td>
                  <td className="text-right">{inr(Number(p.gross_amount))}</td>
                  <td className="text-right text-muted-foreground">{inr(Number(p.fees))}</td>
                  <td className="text-right font-medium">{inr(Number(p.net_amount))}</td>
                  <td className="capitalize text-muted-foreground">{p.status}</td>
                  <td className="px-5 py-3 text-right text-muted-foreground">{p.settled_at ? new Date(p.settled_at).toLocaleDateString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
