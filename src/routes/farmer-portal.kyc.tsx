import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Upload, FileText, CheckCircle2, XCircle, Clock, Trash2, AlertTriangle, X, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useFarmerProfile } from "@/lib/farmer/use-farmer";
import { compressImage } from "@/lib/image-compress";
import { fileToBase64 } from "@/lib/file-to-base64";
import { sendAdminEmailNotification } from "@/lib/api/notifications.server";

export const Route = createFileRoute("/farmer-portal/kyc")({ component: KycPage });

const DOC_TYPES = [
  { key: "aadhaar", label: "Aadhaar card", required: true },
  { key: "pan", label: "PAN card", required: true },
  { key: "bank_passbook", label: "Bank passbook / cancelled cheque", required: true },
  { key: "certification", label: "Organic / natural certification (optional)", required: false },
] as const;

function KycPage() {
  const { data: farmer } = useFarmerProfile();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const farmerId = farmer?.id;
  const [submittingKyc, setSubmittingKyc] = useState(false);

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

  const isApproved = farmer.status === "approved";
  const verified = isApproved
    ? docs.length
    : docs.filter((d: any) => d.status === "verified").length;
  const requiredKeys = DOC_TYPES.filter((d) => d.required).map((d) => d.key);
  const verifiedRequired = isApproved
    ? requiredKeys.length
    : requiredKeys.filter((k) =>
        docs.some((d: any) => d.doc_type === k && d.status === "verified"),
      ).length;
  const overallStatus = isApproved
    ? "verified"
    : verifiedRequired === requiredKeys.length
      ? "verified"
      : docs.some((d: any) => d.status === "rejected")
        ? "action_needed"
        : docs.length === 0
          ? "not_started"
          : "in_review";

  const hasAadhaar = docs.some((d: any) => d.doc_type === "aadhaar");
  const hasPan = docs.some((d: any) => d.doc_type === "pan");
  const hasBank = docs.some((d: any) => d.doc_type === "bank_passbook");
  const canSubmit = hasAadhaar && hasPan && hasBank;

  const handleSubmitKyc = async () => {
    setSubmittingKyc(true);
    try {
      const { error: profileErr } = await supabase
        .from("farmer_profiles")
        .update({ status: "pending" })
        .eq("id", farmer.id);
      if (profileErr) throw profileErr;

      const { error: notifErr } = await supabase
        .from("system_notifications")
        .insert({
          type: "farmer_kyc_submission",
          title: "Farmer KYC Submitted",
          message: `Farmer "${farmer.full_name}" has submitted Aadhaar, PAN, and Bank details for verification.`,
          read: false,
          metadata: {
            farmer_id: farmer.id,
            farmer_name: farmer.full_name,
          }
        });
      if (notifErr) throw notifErr;

      try {
        await sendAdminEmailNotification({
          data: {
            subject: `[KYC Submission] Farmer KYC Submitted - ${farmer.full_name}`,
            body: `Farmer "${farmer.full_name}" (${farmer.farm_name || "No Farm Name"}) has uploaded all 3 required KYC documents (Aadhaar, PAN, Bank Passbook) and submitted them for verification.\n\nPlease review these documents under the admin dashboard / Farmers section.\n\nFarmer ID: ${farmer.id}\nRegistered Email: ${farmer.email || "N/A"}`,
          }
        });
      } catch (emailErr) {
        console.warn("Failed to send admin email notification:", emailErr);
      }

      toast.success("Documents submitted successfully! Wait for approval, it will take 24 hours.");
      qc.invalidateQueries({ queryKey: ["farmer-docs", farmerId] });
      qc.invalidateQueries({ queryKey: ["farmer-profile"] });
      navigate({ to: "/farmer-portal/dashboard" });
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to submit KYC");
    } finally {
      setSubmittingKyc(false);
    }
  };

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
          const docsForType = docs.filter((d: any) => d.doc_type === dt.key);
          return (
            <DocSection
              key={dt.key}
              docType={dt.key}
              label={dt.label}
              required={dt.required}
              docs={docsForType}
              farmerId={farmer.id}
              userId={farmer.user_id}
              readOnly={farmer.status === "pending" || farmer.status === "approved"}
              isApproved={isApproved}
              onChange={() => qc.invalidateQueries({ queryKey: ["farmer-docs", farmerId] })}
            />
          );
        })}
      </div>

      {/* Submit KYC Card */}
      {farmer.status !== "approved" && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-display text-base font-semibold text-foreground">
              {farmer.status === "pending" ? "KYC Pending Verification" : "Submit KYC for Approval"}
            </h3>
            <p className="text-xs text-muted-foreground max-w-md">
              {farmer.status === "pending"
                ? "Your documents have been submitted successfully. Please wait for approval, it typically takes 24 hours."
                : "All required documents are uploaded. Please submit them to the operations team for verification."}
            </p>
          </div>
          {farmer.status !== "pending" && (
            <button
              onClick={handleSubmitKyc}
              disabled={!canSubmit || submittingKyc}
              className="font-subhead h-11 px-6 rounded-full bg-primary text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-sm"
            >
              {submittingKyc && <Loader2 className="h-4 w-4 animate-spin" />}
              Submit KYC Documents
            </button>
          )}
        </div>
      )}

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
              {docs.map((d: any) => (
                <tr key={d.id} className="border-t border-border">
                  <td className="px-5 py-3 font-medium capitalize">
                    {d.doc_type.replace(/_/g, " ")}
                    {d.label && <span className="text-muted-foreground"> · {d.label}</span>}
                  </td>
                  <td className="text-muted-foreground">
                    {new Date(d.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    <StatusBadge status={isApproved ? "verified" : d.status} />
                  </td>
                  <td className="text-muted-foreground">
                    {d.verified_at ? new Date(d.verified_at).toLocaleDateString() : "—"}
                  </td>
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
  docType,
  label,
  required,
  docs,
  farmerId,
  userId,
  onChange,
  readOnly,
  isApproved,
}: {
  docType: string;
  label: string;
  required: boolean;
  docs: any[];
  farmerId: string;
  userId: string;
  onChange: () => void;
  readOnly?: boolean;
  isApproved?: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null);
  const latest = docs[0];

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      toast.error("File must be under 15 MB");
      return;
    }
    setUploading(true);
    try {
      // Compress image (PDFs pass through unchanged)
      const compressedFile = await compressImage(file);

      // Convert to Base64 data URL for direct Firestore storage
      const base64Data = await fileToBase64(compressedFile);

      const { error: insErr } = await supabase.from("farmer_documents").insert({
        farmer_id: farmerId,
        user_id: userId,
        doc_type: docType,
        file_url: base64Data,
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

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await supabase.from("farmer_documents").delete().eq("id", deleteTarget.id);
    setDeleteTarget(null);
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
            {required && (
              <span className="font-subhead rounded-full bg-secondary px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                Required
              </span>
            )}
          </div>
          {latest ? (
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <StatusBadge status={isApproved ? "verified" : latest.status} />
              <span>Uploaded {new Date(latest.created_at).toLocaleDateString()}</span>
              {latest.file_url && (
                <a
                  href={latest.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1 font-medium ml-1"
                >
                  View file <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
              {latest.notes && <span className="text-destructive font-medium">· {latest.notes}</span>}
            </div>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground">Not uploaded yet.</p>
          )}
        </div>
        {!readOnly ? (
          <div className="flex items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*,application/pdf"
              onChange={handleUpload}
              className="hidden"
              id={`up-${docType}`}
            />
            <label
              htmlFor={`up-${docType}`}
              className="font-subhead inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:opacity-90"
            >
              {uploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}
              {latest ? "Replace" : "Upload"}
            </label>
            {latest && (
              <button
                onClick={() => setDeleteTarget({ id: latest.id, label: label })}
                className="grid h-8 w-8 place-items-center rounded-full border border-border text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ) : (
          latest && (
            <span className="font-subhead text-xs text-muted-foreground bg-secondary/80 px-3.5 py-1.5 rounded-full border border-border">
              Submitted
            </span>
          )
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-border bg-background p-6 shadow-2xl animate-scale-up text-center relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setDeleteTarget(null)}
              type="button"
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="p-3 bg-destructive/10 rounded-full inline-block text-destructive mb-4">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h3 className="font-display text-lg font-semibold text-foreground">
              Remove document?
            </h3>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              Are you sure you want to remove your <span className="font-medium text-foreground">{deleteTarget.label}</span>? You'll need to re-upload it for verification.
            </p>

            <div className="mt-6 flex gap-3 justify-center">
              <button
                onClick={() => setDeleteTarget(null)}
                className="font-subhead inline-flex h-10 items-center justify-center rounded-full border border-border px-5 text-sm font-medium hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="font-subhead inline-flex h-10 items-center justify-center gap-2 rounded-full bg-destructive px-5 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { icon: any; text: string; cls: string }> = {
    verified: { icon: CheckCircle2, text: "Verified", cls: "bg-success/15 text-success" },
    rejected: { icon: XCircle, text: "Rejected", cls: "bg-destructive/15 text-destructive" },
    action_needed: {
      icon: XCircle,
      text: "Action needed",
      cls: "bg-destructive/15 text-destructive",
    },
    pending: { icon: Clock, text: "Pending review", cls: "bg-warning/15 text-warning" },
    in_review: { icon: Clock, text: "In review", cls: "bg-warning/15 text-warning" },
    not_started: { icon: Clock, text: "Not started", cls: "bg-secondary text-muted-foreground" },
  };
  const cfg = map[status] ?? map.pending;
  const Icon = cfg.icon;
  return (
    <span
      className={`font-subhead inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ${cfg.cls}`}
    >
      <Icon className="h-3 w-3" /> {cfg.text}
    </span>
  );
}
