import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  CheckCircle2,
  Clock,
  Wallet,
  DollarSign,
  Plus,
  X,
  Copy,
  Check,
  Building,
} from "lucide-react";
import { toast } from "sonner";
import { StatCard } from "@/components/dashboard/shell";
import { supabase } from "@/integrations/supabase/client";
import { inr } from "@/lib/format";

export const Route = createFileRoute("/admin/settlements")({ component: AdminSettlements });

type ActiveTab = "unsettled" | "history";

function AdminSettlements() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<ActiveTab>("unsettled");
  
  // Status Filters for History
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // Dialog States
  const [isSettleOpen, setIsSettleOpen] = useState(false);
  const [selectedFarmerBalance, setSelectedFarmerBalance] = useState<any | null>(null);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Settle & Pay Form States
  const [utrRef, setUtrRef] = useState("");
  const [payoutStatus, setPayoutStatus] = useState<"paid" | "processing" | "scheduled">("paid");
  const [settleAmount, setSettleAmount] = useState<number>(0);

  // Manual Payout Form States
  const [manualFarmerId, setManualFarmerId] = useState("");
  const [manualGross, setManualGross] = useState("");
  const [manualFees, setManualFees] = useState("");
  const [manualPeriodStart, setManualPeriodStart] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0]
  );
  const [manualPeriodEnd, setManualPeriodEnd] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [manualUtr, setManualUtr] = useState("");
  const [manualStatus, setManualStatus] = useState<"paid" | "processing" | "scheduled" | "failed">("paid");

  // Fetch approved farmers
  const { data: farmers = [], isLoading: farmersLoading } = useQuery({
    queryKey: ["admin-settlements-farmers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("farmer_profiles")
        .select("*")
        .eq("status", "approved")
        .order("full_name", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  // Fetch orders to calculate unsettled earnings
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["admin-settlements-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  // Fetch payouts history
  const { data: payouts = [], isLoading: payoutsLoading } = useQuery({
    queryKey: ["admin-settlements-payouts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("farmer_payouts")
        .select("*, farmer:farmer_profiles(full_name, farm_name, bank_name, bank_account_number, bank_account_name, bank_ifsc, upi_id)")
        .order("period_end", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const isLoading = farmersLoading || ordersLoading || payoutsLoading;

  // Calculate unsettled balance for each farmer
  const unsettledBalances = farmers.map((farmer: any) => {
    // 1. Get all paid payouts for this farmer
    const farmerPaidPayouts = payouts.filter(
      (p: any) => p.farmer_id === farmer.id && p.status === "paid"
    );

    // 2. Find the latest period_end of paid payouts
    const latestPeriodEnd = farmerPaidPayouts.reduce((latest: Date | null, p: any) => {
      const d = new Date(p.period_end);
      return !latest || d > latest ? d : latest;
    }, null);

    // 3. Filter orders delivered after latestPeriodEnd
    const unsettledOrders = orders.filter((o: any) => {
      if (o.status !== "delivered") return false;
      const orderDate = new Date(o.created_at);
      if (latestPeriodEnd && orderDate <= latestPeriodEnd) return false;
      return true;
    });

    // 4. Calculate amount
    let gross = 0;
    const itemsList: any[] = [];
    unsettledOrders.forEach((o: any) => {
      const farmerItems = o.items?.filter((i: any) => i.farmer_slug === farmer.slug) || [];
      farmerItems.forEach((item: any) => {
        const basePrice = item.farmer_base_price || Number(item.price || 0) / 1.10;
        gross += basePrice * Number(item.qty || 1);
        itemsList.push({ ...item, order_id: o.id, created_at: o.created_at });
      });
    });

    return {
      farmer,
      gross,
      ordersCount: unsettledOrders.length,
      unsettledOrders,
      itemsList,
      latestPeriodEnd,
    };
  });

  // Stat Card metrics
  const totalUnsettled = unsettledBalances.reduce((s, b) => s + b.gross, 0);
  const farmersAwaitingCount = unsettledBalances.filter((b) => b.gross > 0).length;
  const totalPaidSum = payouts
    .filter((p: any) => p.status === "paid")
    .reduce((s, p) => s + Number(p.net_amount), 0);

  // Settlement Window dates
  const today = new Date();
  let openY = today.getFullYear(),
    openM = today.getMonth();
  if (today.getDate() > 10) {
    openM++;
    if (openM > 11) {
      openM = 0;
      openY++;
    }
  }
  const nextRun = new Date(openY, openM, 7).toLocaleDateString();

  // History tab filtering
  const filteredHistory = payouts.filter(
    (r: any) => statusFilter === "all" || r.status === statusFilter
  );

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`${field} copied`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const openSettle = (balance: any) => {
    setSelectedFarmerBalance(balance);
    setSettleAmount(balance.gross);
    setUtrRef("");
    setPayoutStatus("paid");
    setIsSettleOpen(true);
  };

  const handleConfirmPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (settleAmount <= 0) {
      toast.error("Amount must be greater than zero");
      return;
    }
    setSaving(true);
    try {
      const grossVal = settleAmount;
      const feesVal = grossVal * 0.10;
      const netVal = grossVal - feesVal;

      // Period dates
      const start = selectedFarmerBalance.latestPeriodEnd
        ? new Date(selectedFarmerBalance.latestPeriodEnd.getTime() + 24 * 60 * 60 * 1000)
        : (selectedFarmerBalance.itemsList.length > 0
            ? new Date(
                selectedFarmerBalance.itemsList[
                  selectedFarmerBalance.itemsList.length - 1
                ].created_at
              )
            : new Date());
      const end = new Date();

      const payload = {
        farmer_id: selectedFarmerBalance.farmer.id,
        period_start: start.toISOString().split("T")[0],
        period_end: end.toISOString().split("T")[0],
        gross_amount: grossVal,
        fees: feesVal,
        net_amount: netVal,
        status: payoutStatus,
        reference: utrRef.trim() || "MANUAL",
        settled_at: payoutStatus === "paid" ? new Date().toISOString() : null,
      };

      const { error } = await supabase.from("farmer_payouts").insert(payload);
      if (error) throw error;

      toast.success("Payout registered successfully");
      setIsSettleOpen(false);
      setSelectedFarmerBalance(null);
      
      // Refresh
      qc.invalidateQueries({ queryKey: ["admin-settlements-payouts"] });
      qc.invalidateQueries({ queryKey: ["admin-overview"] });
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to settle payout");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveManualPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualFarmerId || Number(manualGross) <= 0) {
      toast.error("Select a farmer and enter a valid gross amount");
      return;
    }
    setSaving(true);
    try {
      const grossVal = Number(manualGross);
      const feesVal = Number(manualFees) || grossVal * 0.10;
      const netVal = grossVal - feesVal;

      const payload = {
        farmer_id: manualFarmerId,
        period_start: manualPeriodStart,
        period_end: manualPeriodEnd,
        gross_amount: grossVal,
        fees: feesVal,
        net_amount: netVal,
        status: manualStatus,
        reference: manualUtr.trim() || "MANUAL",
        settled_at: manualStatus === "paid" ? new Date().toISOString() : null,
      };

      const { error } = await supabase.from("farmer_payouts").insert(payload);
      if (error) throw error;

      toast.success("Manual payout logged successfully");
      setIsManualOpen(false);
      setManualFarmerId("");
      setManualGross("");
      setManualFees("");
      setManualUtr("");
      setManualStatus("paid");
      
      qc.invalidateQueries({ queryKey: ["admin-settlements-payouts"] });
      qc.invalidateQueries({ queryKey: ["admin-overview"] });
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to save manual payout");
    } finally {
      setSaving(false);
    }
  };

  const handleManualGrossChange = (val: string) => {
    setManualGross(val);
    const num = Number(val);
    if (!isNaN(num)) {
      setManualFees((num * 0.10).toFixed(2));
    } else {
      setManualFees("");
    }
  };

  const markPaid = async (id: string) => {
    const ref = prompt("Payment reference (UTR / transaction id):") || "MANUAL";
    const { error } = await supabase
      .from("farmer_payouts")
      .update({ status: "paid", settled_at: new Date().toISOString(), reference: ref })
      .eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Payout marked paid");
    qc.invalidateQueries({ queryKey: ["admin-settlements-payouts"] });
    qc.invalidateQueries({ queryKey: ["admin-overview"] });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-semibold">Settlements</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage farmer payouts and view real-time unsettled balances.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsManualOpen(true)}
            className="font-subhead inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-2.5 text-sm font-medium hover:bg-secondary transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Custom Payout
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Outstanding balance" value={inr(totalUnsettled)} />
        <StatCard label="Farmers awaiting" value={String(farmersAwaitingCount)} />
        <StatCard label="Lifetime paid" value={inr(totalPaidSum)} />
        <StatCard label="Next window opens" value={nextRun} />
      </div>

      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab("unsettled")}
          className={`font-subhead px-5 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === "unsettled"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Unsettled Balances ({farmersAwaitingCount})
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`font-subhead px-5 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === "history"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Payout History ({payouts.length})
        </button>
      </div>

      {activeTab === "unsettled" ? (
        <div className="overflow-hidden rounded-2xl border border-border bg-background">
          {isLoading ? (
            <div className="grid place-items-center py-20">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : unsettledBalances.filter((b) => b.gross > 0).length === 0 ? (
            <p className="py-20 text-center text-sm text-muted-foreground">All farmers are fully settled!</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-secondary/40">
                <tr className="font-subhead text-[11px] uppercase tracking-[0.12em] text-muted-foreground border-b border-border">
                  <th className="px-5 py-3 text-left">Farmer</th>
                  <th className="text-left">Farm</th>
                  <th className="text-center">Unsettled Orders</th>
                  <th className="text-right font-semibold">Unsettled Balance</th>
                  <th className="text-left px-6">Payment Destination</th>
                  <th className="px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {unsettledBalances
                  .filter((b) => b.gross > 0)
                  .map((b: any) => (
                    <tr key={b.farmer.id} className="border-t border-border hover:bg-secondary/10">
                      <td className="px-5 py-4 font-medium text-foreground">{b.farmer.full_name}</td>
                      <td>{b.farmer.farm_name}</td>
                      <td className="text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-secondary text-xs font-semibold">
                          {b.ordersCount} orders
                        </span>
                      </td>
                      <td className="text-right font-semibold text-primary">{inr(b.gross)}</td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        {b.farmer.upi_id ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-foreground uppercase">UPI:</span> {b.farmer.upi_id}
                          </div>
                        ) : b.farmer.bank_account_number ? (
                          <div>
                            <div className="font-semibold text-foreground">{b.farmer.bank_name}</div>
                            <div>
                              A/C: •••• {b.farmer.bank_account_number.slice(-4)} | IFSC: {b.farmer.bank_ifsc}
                            </div>
                          </div>
                        ) : (
                          <span className="text-destructive font-semibold">No payment details set</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => openSettle(b)}
                          className="font-subhead rounded-full bg-primary text-primary-foreground px-4 py-1.5 text-xs font-medium hover:opacity-95 transition cursor-pointer"
                        >
                          Settle & Pay
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="font-subhead h-10 rounded-full border border-border bg-background px-4 text-xs outline-none focus:border-primary cursor-pointer"
            >
              <option value="all">All statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="processing">Processing</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border bg-background">
            {isLoading ? (
              <div className="grid place-items-center py-20">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : filteredHistory.length === 0 ? (
              <p className="py-20 text-center text-sm text-muted-foreground">No payout records found.</p>
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
                  {filteredHistory.map((r: any) => (
                    <tr key={r.id} className="border-t border-border hover:bg-secondary/10">
                      <td className="px-5 py-3 font-medium text-foreground">{r.farmer?.full_name ?? "—"}</td>
                      <td className="text-muted-foreground">
                        {new Date(r.period_start).toLocaleDateString()} –{" "}
                        {new Date(r.period_end).toLocaleDateString()}
                      </td>
                      <td className="text-right">{inr(Number(r.gross_amount))}</td>
                      <td className="text-right text-muted-foreground">{inr(Number(r.fees))}</td>
                      <td className="text-right font-medium">{inr(Number(r.net_amount))}</td>
                      <td className="text-muted-foreground text-xs">
                        {r.farmer?.bank_name}{" "}
                        {r.farmer?.bank_account_number
                          ? `•••• ${r.farmer.bank_account_number.slice(-4)}`
                          : ""}
                      </td>
                      <td>
                        {r.status === "paid" ? (
                          <span className="font-subhead inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[11px] text-success font-medium">
                            <CheckCircle2 className="h-3 w-3" /> Paid
                          </span>
                        ) : (
                          <span className="font-subhead inline-flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-[11px] text-warning capitalize font-medium">
                            <Clock className="h-3 w-3" /> {r.status}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {r.status !== "paid" && (
                          <button
                            onClick={() => markPaid(r.id)}
                            className="font-subhead rounded-full border border-border px-3 py-1 text-[11px] hover:bg-secondary cursor-pointer"
                          >
                            Mark paid
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
      )}

      {/* Settle Payout Modal */}
      {isSettleOpen && selectedFarmerBalance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-background shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                <h3 className="font-display text-base font-semibold text-foreground">
                  Settle Payout: {selectedFarmerBalance.farmer.full_name}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsSettleOpen(false);
                  setSelectedFarmerBalance(null);
                }}
                className="grid h-8 w-8 place-items-center rounded-full border border-border text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmPayout} className="p-6 space-y-5">
              <div className="rounded-xl bg-secondary/50 p-4 space-y-2.5 text-sm">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Farm Name:</span>
                  <span className="font-semibold">{selectedFarmerBalance.farmer.farm_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Unsettled Orders:</span>
                  <span>{selectedFarmerBalance.ordersCount} orders</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gross Amount:</span>
                  <span className="font-medium">{inr(settleAmount)}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground border-b pb-2">
                  <span>Commission Fee (10%):</span>
                  <span>-{inr(settleAmount * 0.10)}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-primary">
                  <span>Net Amount to Pay:</span>
                  <span>{inr(settleAmount - (settleAmount * 0.10))}</span>
                </div>
              </div>

              {/* Bank Details section */}
              <div className="space-y-3">
                <h4 className="font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b pb-1">
                  Bank Transfer Details
                </h4>
                
                {selectedFarmerBalance.farmer.upi_id ? (
                  <div className="flex items-center justify-between rounded-lg border border-dashed p-3 text-sm">
                    <div>
                      <div className="text-[10px] uppercase font-semibold text-muted-foreground">UPI ID</div>
                      <div className="font-mono text-xs">{selectedFarmerBalance.farmer.upi_id}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(selectedFarmerBalance.farmer.upi_id, "UPI ID")}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border hover:bg-secondary cursor-pointer"
                    >
                      {copiedField === "UPI ID" ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                ) : selectedFarmerBalance.farmer.bank_account_number ? (
                  <div className="space-y-2 rounded-lg border border-dashed p-3 text-sm">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-muted-foreground">Bank Name: </span>
                        <span className="font-medium">{selectedFarmerBalance.farmer.bank_name}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-muted-foreground">A/C Name: </span>
                        <span className="font-mono text-xs">{selectedFarmerBalance.farmer.bank_account_name || selectedFarmerBalance.farmer.full_name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(selectedFarmerBalance.farmer.bank_account_name || selectedFarmerBalance.farmer.full_name, "Account Name")}
                        className="inline-flex h-6 w-6 items-center justify-center rounded-full hover:bg-secondary cursor-pointer"
                      >
                        {copiedField === "Account Name" ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                      </button>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-muted-foreground">Account No: </span>
                        <span className="font-mono text-xs">{selectedFarmerBalance.farmer.bank_account_number}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(selectedFarmerBalance.farmer.bank_account_number, "Account Number")}
                        className="inline-flex h-6 w-6 items-center justify-center rounded-full hover:bg-secondary cursor-pointer"
                      >
                        {copiedField === "Account Number" ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                      </button>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-muted-foreground">IFSC Code: </span>
                        <span className="font-mono text-xs">{selectedFarmerBalance.farmer.bank_ifsc}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(selectedFarmerBalance.farmer.bank_ifsc, "IFSC Code")}
                        className="inline-flex h-6 w-6 items-center justify-center rounded-full hover:bg-secondary cursor-pointer"
                      >
                        {copiedField === "IFSC Code" ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-destructive font-semibold text-center border border-destructive/20 bg-destructive/5 p-3 rounded-lg">
                    No bank account details or UPI registered for this farmer!
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Payment Reference (UTR / transaction ID)
                  </label>
                  <input
                    type="text"
                    value={utrRef}
                    onChange={(e) => setUtrRef(e.target.value)}
                    placeholder="e.g. UTR1234567890"
                    className="font-subhead mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Payout Status
                  </label>
                  <select
                    value={payoutStatus}
                    onChange={(e) => setPayoutStatus(e.target.value as any)}
                    className="font-subhead mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  >
                    <option value="paid">Paid (Instant settlement)</option>
                    <option value="processing">Processing</option>
                    <option value="scheduled">Scheduled</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsSettleOpen(false);
                    setSelectedFarmerBalance(null);
                  }}
                  className="font-subhead rounded-full border border-border px-5 py-2.5 text-xs font-medium hover:bg-secondary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="font-subhead inline-flex items-center gap-1.5 rounded-full bg-primary px-6 py-2.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 cursor-pointer"
                >
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Payout Modal */}
      {isManualOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-background shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                <h3 className="font-display text-base font-semibold text-foreground">
                  Log Custom / Manual Payout
                </h3>
              </div>
              <button
                onClick={() => setIsManualOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-full border border-border text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveManualPayout} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Select Farmer *
                </label>
                <select
                  required
                  value={manualFarmerId}
                  onChange={(e) => setManualFarmerId(e.target.value)}
                  className="font-subhead mt-1.5 w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-primary cursor-pointer"
                >
                  <option value="">-- Choose Approved Farmer --</option>
                  {farmers.map((f: any) => (
                    <option key={f.id} value={f.id}>
                      {f.full_name} ({f.farm_name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Gross Amount (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={manualGross}
                    onChange={(e) => handleManualGrossChange(e.target.value)}
                    placeholder="e.g. 5000"
                    className="font-subhead mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Commission Fees (₹)
                  </label>
                  <input
                    type="number"
                    value={manualFees}
                    onChange={(e) => setManualFees(e.target.value)}
                    placeholder="Auto 10%"
                    className="font-subhead mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Period Start
                  </label>
                  <input
                    type="date"
                    value={manualPeriodStart}
                    onChange={(e) => setManualPeriodStart(e.target.value)}
                    className="font-subhead mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Period End
                  </label>
                  <input
                    type="date"
                    value={manualPeriodEnd}
                    onChange={(e) => setManualPeriodEnd(e.target.value)}
                    className="font-subhead mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Payment Reference (UTR / transaction ID)
                </label>
                <input
                  type="text"
                  value={manualUtr}
                  onChange={(e) => setManualUtr(e.target.value)}
                  placeholder="e.g. UTR998877"
                  className="font-subhead mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Payout Status
                </label>
                <select
                  value={manualStatus}
                  onChange={(e) => setManualStatus(e.target.value as any)}
                  className="font-subhead mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                >
                  <option value="paid">Paid (Instant settlement)</option>
                  <option value="processing">Processing</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-border pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setIsManualOpen(false)}
                  className="font-subhead rounded-full border border-border px-5 py-2.5 text-xs font-medium hover:bg-secondary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="font-subhead inline-flex items-center gap-1.5 rounded-full bg-primary px-6 py-2.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 cursor-pointer"
                >
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Save Payout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
