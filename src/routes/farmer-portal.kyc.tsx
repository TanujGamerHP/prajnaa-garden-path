import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Upload, FileText, CheckCircle2, XCircle, Clock, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useFarmerProfile } from "@/lib/farmer/use-farmer";

export const Route = createFileRoute("/farmer-portal/kyc")({ component: KycPage });

const DOC_TYPES = [
  { key: "aadhaar", label: "Aadhaar card", required: true },
  { key: "pan", label: "PAN card", required: true },
  { key: "bank_passbook", label: "Bank passbook / cancelled cheque", required: true },
  { key: "farm_proof", label: "Farm land proof (7/12 / Patta / lease)", required: true },
  { key: "certification", label: "Organic / natural certification (optional)", required: false },
] as const;

function KycPage() {
  const { data: farmer } = useFarmerProfile();
  const qc = useQueryClient();
  const farmerId = farmer?.id;

  const { data: docs = [], isLoading } = useQuery({
    enabled: !!farmerId,
    queryKey: ["farmer-docs", farmerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("farmer_documents")
        .select("*")
        .eq("farmer_id", farmerId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  if (!farmer) return null;

  const verified = docs.filter((d) => d.status === "verified").length;
  const requiredKeys = DOC_TYPES.filter((d) => d.required).map((d) => d.key);
  const verifiedRequired = requiredKeys.filter((k) =>
    docs.some((d) => d.doc_type === k && d.status === "verified")
  ).length;
  const overallStatus =
    verifiedRequired === requiredKeys.length
      ? "verified"
      : docs.some((d) => d.status === "rejected")
        ? "action_needed"
        : docs.length === 0
          ? "not_started"
          : "in_review";

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl font-semibold">KYC verification</h2>
        <p className="text-sm text-muted-foreground">
          Upload identity, address, and farm documents. Verified within 48 hours.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-background p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <StatusBadge status={overallStatus} />
            <p className="text-sm text-muted-foreground">
              {verifiedRequired} of {requiredKeys.length} required documents verified
            </p>
          </div>
          <div className="font-subhead text-xs text-muted-foreground">
            {verified} verified · {docs.length} total uploaded
          </div>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${(verifiedRequired / requiredKeys.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="space-y-4">
        {DOC_TYPES.map((dt) => {
          const docsForType = docs.filter((d) => d.doc_type === dt.key);
          return (
            <DocSection
              key={dt.key}
              docType={dt.key}
              label={dt.label}
              required={dt.required}
              docs={docsForType}
              farmerId={farmer.id}
              userId={farmer.user_id}
              onChange={() => qc.invalidateQueries({ queryKey: ["farmer-docs", farmerId] })}
            />
          );
        })}
      </div>

      <div className="rounded-2xl border border-border bg-background">
        <div className="border-b border-border px-5 py-3">
          <h3 className="font-display text-sm font-semibold">Document history</h3>
        </div>
        {isLoading ? (
          <div className="grid place-items-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : docs.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">No uploads yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="font-subhead text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                <th className="px-5 py-3 text-left">Document</th>
                <th className="text-left">Uploaded</th>
                <th className="text-left">Status</th>
                <th className="text-left">Verified</th>
                <th className="px-5 text-right">Notes</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((d) => (
                <tr key={d.id} className="border-t border-border">
                  <td className="px-5 py-3 font-medium capitalize">
                    {d.doc_type.replace(/_/g, " ")}
                    {d.label && <span className="text-muted-foreground"> · {d.label}</span>}
                  </td>
                  <td className="text-muted-foreground">{new Date(d.created_at).toLocaleDateString()}</td>
                  <td><StatusBadge status={d.status} /></td>
                  <td className="text-muted-foreground">{d.verified_at ? new Date(d.verified_at).toLocaleDateString() : "—"}</td>
                  <td className="px-5 py-3 text-right text-muted-foreground">{d.notes ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function DocSection({
  docType, label, required, docs, farmerId, userId, onChange,
}: {
  docType: string; label: string; required: boolean;
  docs: any[]; farmerId: string; userId: string; onChange: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const latest = docs[0];

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File must be under 10 MB");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "bin";
      const path = `${userId}/${docType}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("kyc-docs").upload(path, file, {
        contentType: file.type,
        upsert: false,
      });
      if (upErr) throw upErr;
      const { error: insErr } = await supabase.from("farmer_documents").insert({
        farmer_id: farmerId,
        user_id: userId,
        doc_type: docType,
        file_url: path,
        label: file.name,
        status: "pending",
      });
      if (insErr) throw insErr;
      toast.success("Uploaded — awaiting verification");
      onChange();
    } catch (e: any) {
      toast.error(e?.message ?? "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleDelete = async (id: string, path: string) => {
    if (!confirm("Remove this document?")) return;
    await supabase.storage.from("kyc-docs").remove([path]);
    await supabase.from("farmer_documents").delete().eq("id", id);
    toast.success("Removed");
    onChange();
  };

  return (
    <div className="rounded-2xl border border-border bg-background p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-display text-sm font-semibold">{label}</h3>
            {required && <span className="font-subhead rounded-full bg-secondary px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">Required</span>}
          </div>
          {latest ? (
            <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
              <StatusBadge status={latest.status} />
              <span>Uploaded {new Date(latest.created_at).toLocaleDateString()}</span>
              {latest.notes && <span className="text-destructive">· {latest.notes}</span>}
            </div>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground">Not uploaded yet.</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input ref={fileRef} type="file" accept="image/*,application/pdf" onChange={handleUpload} className="hidden" id={`up-${docType}`} />
          <label htmlFor={`up-${docType}`} className="font-subhead inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:opacity-90">
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            {latest ? "Replace" : "Upload"}
          </label>
          {latest && (
            <button onClick={() => handleDelete(latest.id, latest.file_url)} className="grid h-8 w-8 place-items-center rounded-full border border-border text-muted-foreground hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { icon: any; text: string; cls: string }> = {
    verified: { icon: CheckCircle2, text: "Verified", cls: "bg-success/15 text-success" },
    rejected: { icon: XCircle, text: "Rejected", cls: "bg-destructive/15 text-destructive" },
    action_needed: { icon: XCircle, text: "Action needed", cls: "bg-destructive/15 text-destructive" },
    pending: { icon: Clock, text: "Pending review", cls: "bg-warning/15 text-warning" },
    in_review: { icon: Clock, text: "In review", cls: "bg-warning/15 text-warning" },
    not_started: { icon: Clock, text: "Not started", cls: "bg-secondary text-muted-foreground" },
  };
  const cfg = map[status] ?? map.pending;
  const Icon = cfg.icon;
  return (
    <span className={`font-subhead inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ${cfg.cls}`}>
      <Icon className="h-3 w-3" /> {cfg.text}
    </span>
  );
}
