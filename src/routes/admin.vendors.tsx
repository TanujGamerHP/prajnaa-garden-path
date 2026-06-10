import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, X, Loader2, FileText, ExternalLink, ShieldCheck, ShieldAlert, Eye } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/vendors")({ component: AdminVendors });

type Tab = "pending" | "approved" | "rejected" | "draft" | "suspended";

function AdminVendors() {
  const [tab, setTab] = useState<Tab>("pending");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data: farmers = [], isLoading } = useQuery({
    queryKey: ["admin-farmers", tab],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("farmer_profiles")
        .select("*")
        .eq("status", tab)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: counts } = useQuery({
    queryKey: ["admin-farmer-counts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("farmer_profiles").select("status");
      if (error) throw error;
      const out: Record<string, number> = {};
      (data ?? []).forEach((r: any) => { out[r.status] = (out[r.status] ?? 0) + 1; });
      return out;
    },
  });

  const selected = farmers.find((f) => f.id === selectedId);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-3xl font-semibold">Farmer approvals</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Review registrations, inspect KYC documents, and approve or reject vendors.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["pending", "approved", "rejected", "draft", "suspended"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setSelectedId(null); }}
            className={`font-subhead inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs capitalize transition ${
              tab === t ? "bg-primary text-primary-foreground" : "border border-border bg-background hover:bg-secondary"
            }`}
          >
            {t}
            <span className={`rounded-full px-1.5 text-[10px] ${tab === t ? "bg-primary-foreground/20" : "bg-secondary"}`}>
              {counts?.[t] ?? 0}
            </span>
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-background">
          {isLoading ? (
            <div className="grid place-items-center py-16"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : farmers.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">No {tab} farmers.</p>
          ) : (
            <ul className="divide-y divide-border">
              {farmers.map((f) => (
                <li key={f.id}>
                  <button
                    onClick={() => setSelectedId(f.id)}
                    className={`w-full px-5 py-4 text-left transition hover:bg-secondary/50 ${selectedId === f.id ? "bg-secondary/60" : ""}`}
                  >
                    <p className="font-display text-sm font-semibold">{f.full_name}</p>
                    <p className="font-subhead mt-0.5 text-xs text-muted-foreground">
                      {f.farm_name} · {f.village}, {f.state}
                    </p>
                    <p className="font-subhead mt-1 text-[11px] text-muted-foreground">
                      Applied {new Date(f.created_at).toLocaleDateString()}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="lg:col-span-3">
          {selected ? (
            <FarmerDetail
              farmer={selected}
              onChange={() => {
                qc.invalidateQueries({ queryKey: ["admin-farmers"] });
                qc.invalidateQueries({ queryKey: ["admin-farmer-counts"] });
                setSelectedId(null);
              }}
            />
          ) : (
            <div className="grid h-full min-h-64 place-items-center rounded-2xl border border-dashed border-border p-8 text-center">
              <p className="text-sm text-muted-foreground">Select a farmer to review their application.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FarmerDetail({ farmer, onChange }: { farmer: any; onChange: () => void }) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const { data: docs = [] } = useQuery({
    queryKey: ["admin-farmer-docs", farmer.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("farmer_documents")
        .select("*")
        .eq("farmer_id", farmer.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const updateStatus = async (status: "approved" | "rejected" | "suspended" | "pending") => {
    setBusy(status);
    try {
      const patch: any = { status };
      if (status === "approved") {
        patch.approved_at = new Date().toISOString();
        patch.rejection_reason = null;
      }
      if (status === "rejected") {
        patch.rejection_reason = reason.trim() || "Application did not meet our criteria.";
      }
      const { error } = await supabase.from("farmer_profiles").update(patch).eq("id", farmer.id);
      if (error) throw error;
      toast.success(`Farmer ${status}`);
      onChange();
    } catch (e: any) {
      toast.error(e?.message ?? "Could not update");
    } finally {
      setBusy(null);
    }
  };

  const updateDoc = async (id: string, status: "verified" | "rejected" | "pending", notes?: string) => {
    const patch: any = { status, notes: notes ?? null };
    if (status === "verified") patch.verified_at = new Date().toISOString();
    const { error } = await supabase.from("farmer_documents").update(patch).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Document ${status}`);
    onChange();
  };

  const viewDoc = async (path: string) => {
    const { data, error } = await supabase.storage.from("kyc-docs").createSignedUrl(path, 300);
    if (error || !data?.signedUrl) { toast.error("Could not open file"); return; }
    window.open(data.signedUrl, "_blank");
  };

  const verifiedCount = docs.filter((d) => d.status === "verified").length;

  return (
    <div className="rounded-2xl border border-border bg-background">
      <div className="border-b border-border px-6 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-xl font-semibold">{farmer.full_name}</h3>
            <p className="font-subhead text-xs text-muted-foreground">
              {farmer.farm_name} · {farmer.village}, {farmer.state}
            </p>
          </div>
          <span className={`font-subhead rounded-full px-3 py-1 text-xs capitalize ${
            farmer.status === "approved" ? "bg-success/15 text-success"
            : farmer.status === "rejected" ? "bg-destructive/15 text-destructive"
            : farmer.status === "pending" ? "bg-warning/15 text-warning"
            : "bg-secondary text-muted-foreground"
          }`}>
            {farmer.status}
          </span>
        </div>
      </div>

      <div className="grid gap-4 px-6 py-5 sm:grid-cols-2 text-sm">
        <Row k="Phone" v={farmer.phone} />
        <Row k="Email" v={farmer.email} />
        <Row k="Aadhaar (last 4)" v={farmer.aadhaar_last4 ? `xxxx-xxxx-${farmer.aadhaar_last4}` : "—"} />
        <Row k="PAN" v={farmer.pan_number} />
        <Row k="PIN" v={farmer.pincode} />
        <Row k="Method" v={farmer.farming_method} />
        <Row k="Farm size" v={farmer.farm_size_acres ? `${farmer.farm_size_acres} acres` : "—"} />
        <Row k="Years farming" v={farmer.years_farming?.toString()} />
        <Row k="Bank" v={farmer.bank_name} />
        <Row k="Account" v={farmer.bank_account_number ? `•••• ${farmer.bank_account_number.slice(-4)} · ${farmer.bank_ifsc}` : "—"} />
        <Row k="UPI" v={farmer.upi_id} />
        <Row k="Crops" v={(farmer.crops ?? []).join(", ")} />
      </div>

      {farmer.story && (
        <div className="border-t border-border px-6 py-5">
          <p className="font-subhead text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Story</p>
          <p className="mt-2 text-sm leading-relaxed">{farmer.story}</p>
        </div>
      )}

      <div className="border-t border-border px-6 py-5">
        <div className="flex items-center justify-between">
          <p className="font-subhead text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            KYC documents ({verifiedCount}/{docs.length} verified)
          </p>
        </div>
        {docs.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No documents uploaded yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {docs.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border p-3 text-sm">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium capitalize">{d.doc_type.replace(/_/g, " ")}</span>
                  <span className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleDateString()}</span>
                  <span className={`font-subhead rounded-full px-2 py-0.5 text-[10px] capitalize ${
                    d.status === "verified" ? "bg-success/15 text-success"
                    : d.status === "rejected" ? "bg-destructive/15 text-destructive"
                    : "bg-warning/15 text-warning"
                  }`}>{d.status}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => viewDoc(d.file_url)} className="grid h-7 w-7 place-items-center rounded-full border border-border hover:bg-secondary" title="View">
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => updateDoc(d.id, "verified")} className="grid h-7 w-7 place-items-center rounded-full border border-border text-success hover:bg-success/10" title="Verify">
                    <ShieldCheck className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => { const n = prompt("Rejection note (optional):") ?? undefined; updateDoc(d.id, "rejected", n || "Document unclear or invalid"); }} className="grid h-7 w-7 place-items-center rounded-full border border-border text-destructive hover:bg-destructive/10" title="Reject">
                    <ShieldAlert className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-border px-6 py-5">
        <label className="block">
          <span className="font-subhead text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Rejection reason (if rejecting)</span>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            className="font-subhead mt-1.5 w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-primary"
            placeholder="Bank details could not be verified..."
          />
        </label>

        <div className="mt-4 flex flex-wrap gap-2">
          {farmer.status !== "approved" && (
            <button
              disabled={busy !== null}
              onClick={() => updateStatus("approved")}
              className="font-subhead inline-flex items-center gap-1.5 rounded-full bg-success px-5 py-2.5 text-sm font-medium text-success-foreground disabled:opacity-50"
            >
              {busy === "approved" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              Approve farmer
            </button>
          )}
          {farmer.status !== "rejected" && (
            <button
              disabled={busy !== null}
              onClick={() => updateStatus("rejected")}
              className="font-subhead inline-flex items-center gap-1.5 rounded-full border border-destructive bg-destructive/10 px-5 py-2.5 text-sm font-medium text-destructive disabled:opacity-50"
            >
              {busy === "rejected" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
              Reject
            </button>
          )}
          {farmer.status === "approved" && (
            <button
              disabled={busy !== null}
              onClick={() => updateStatus("suspended")}
              className="font-subhead inline-flex items-center gap-1.5 rounded-full border border-border px-5 py-2.5 text-sm disabled:opacity-50"
            >
              Suspend
            </button>
          )}
          {farmer.slug && farmer.status === "approved" && (
            <a
              href={`/farmer/${farmer.slug}`}
              target="_blank"
              rel="noreferrer"
              className="font-subhead ml-auto inline-flex items-center gap-1.5 rounded-full border border-border px-5 py-2.5 text-sm hover:bg-secondary"
            >
              View public page <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string | null | undefined }) {
  return (
    <div>
      <p className="font-subhead text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{k}</p>
      <p className="mt-1 font-medium">{v || "—"}</p>
    </div>
  );
}
