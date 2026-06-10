import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { ArrowLeft, ArrowRight, Loader2, Check } from "lucide-react";
import { MarketingLayout } from "@/components/marketing/layout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useFarmerProfile, slugify, farmerKey } from "@/lib/farmer/use-farmer";

export const Route = createFileRoute("/become-a-seller/register")({
  head: () => ({
    meta: [
      { title: "Farmer registration — Prajnaa Farm" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RegisterPage,
});

const steps = ["Personal", "Farm", "Bank", "Story", "Review"] as const;

type Form = {
  full_name: string;
  phone: string;
  email: string;
  aadhaar_last4: string;
  pan_number: string;
  farm_name: string;
  village: string;
  district: string;
  state: string;
  pincode: string;
  farm_size_acres: string;
  years_farming: string;
  farming_method: string;
  crops: string;
  bank_account_name: string;
  bank_account_number: string;
  bank_ifsc: string;
  bank_name: string;
  upi_id: string;
  headline: string;
  story: string;
};

const empty: Form = {
  full_name: "", phone: "", email: "", aadhaar_last4: "", pan_number: "",
  farm_name: "", village: "", district: "", state: "", pincode: "",
  farm_size_acres: "", years_farming: "", farming_method: "natural", crops: "",
  bank_account_name: "", bank_account_number: "", bank_ifsc: "", bank_name: "", upi_id: "",
  headline: "", story: "",
};

const schemas = [
  z.object({
    full_name: z.string().trim().min(2, "Enter your name").max(100),
    phone: z.string().trim().regex(/^[+0-9 -]{8,16}$/, "Valid phone required"),
    email: z.string().trim().email("Valid email required").max(255),
    aadhaar_last4: z.string().trim().regex(/^\d{4}$/, "Last 4 digits of Aadhaar"),
    pan_number: z.string().trim().regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, "Valid PAN required"),
  }),
  z.object({
    farm_name: z.string().trim().min(2).max(120),
    village: z.string().trim().min(2).max(80),
    district: z.string().trim().max(80).optional().or(z.literal("")),
    state: z.string().trim().min(2).max(60),
    pincode: z.string().trim().regex(/^\d{6}$/, "6-digit PIN"),
    farm_size_acres: z.string().regex(/^\d+(\.\d+)?$/, "Acres required"),
    years_farming: z.string().regex(/^\d{1,2}$/, "Years required"),
    farming_method: z.string().min(2),
    crops: z.string().trim().min(2, "List at least one crop"),
  }),
  z.object({
    bank_account_name: z.string().trim().min(2).max(120),
    bank_account_number: z.string().trim().regex(/^\d{6,18}$/, "Valid account number"),
    bank_ifsc: z.string().trim().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Valid IFSC required"),
    bank_name: z.string().trim().min(2).max(80),
    upi_id: z.string().trim().max(80).optional().or(z.literal("")),
  }),
  z.object({
    headline: z.string().trim().min(6, "One-line headline").max(140),
    story: z.string().trim().min(40, "Tell us at least a paragraph").max(2000),
  }),
];

function RegisterPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user, loading: authLoading } = useAuth();
  const { data: existing, isLoading: profileLoading } = useFarmerProfile();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Form>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth/login", replace: true });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (existing) {
      setForm({
        full_name: existing.full_name ?? "",
        phone: existing.phone ?? "",
        email: existing.email ?? user?.email ?? "",
        aadhaar_last4: existing.aadhaar_last4 ?? "",
        pan_number: existing.pan_number ?? "",
        farm_name: existing.farm_name ?? "",
        village: existing.village ?? "",
        district: existing.district ?? "",
        state: existing.state ?? "",
        pincode: existing.pincode ?? "",
        farm_size_acres: existing.farm_size_acres?.toString() ?? "",
        years_farming: existing.years_farming?.toString() ?? "",
        farming_method: existing.farming_method ?? "natural",
        crops: (existing.crops ?? []).join(", "),
        bank_account_name: existing.bank_account_name ?? "",
        bank_account_number: existing.bank_account_number ?? "",
        bank_ifsc: existing.bank_ifsc ?? "",
        bank_name: existing.bank_name ?? "",
        upi_id: existing.upi_id ?? "",
        headline: existing.headline ?? "",
        story: existing.story ?? "",
      });
    } else if (user) {
      setForm((f) => ({ ...f, email: user.email ?? "" }));
    }
  }, [existing, user]);

  if (authLoading || (user && profileLoading)) {
    return (
      <MarketingLayout>
        <div className="container-prj grid place-items-center py-32">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </MarketingLayout>
    );
  }

  if (existing && (existing.status === "pending" || existing.status === "approved")) {
    return (
      <MarketingLayout>
        <div className="container-prj py-20 max-w-xl">
          <div className="rounded-3xl border border-border bg-secondary/40 p-8">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground">
              <Check className="h-6 w-6" />
            </div>
            <h1 className="font-display mt-5 text-3xl font-semibold">
              {existing.status === "approved" ? "You're approved!" : "Application received"}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {existing.status === "approved"
                ? "Welcome aboard. Head to your farmer portal to start listing produce."
                : "We're reviewing your application. We'll email you within 48 hours."}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/farmer-portal/dashboard" className="font-subhead inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">
                Go to portal <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/farmer-portal/kyc" className="font-subhead inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm hover:bg-secondary">
                Upload KYC documents
              </Link>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Tip: Upload your Aadhaar, PAN, bank passbook and land proof in the portal to speed up verification.
            </p>
          </div>
        </div>
      </MarketingLayout>
    );
  }

  const validate = (i: number) => {
    if (i >= schemas.length) return true;
    const res = schemas[i].safeParse(form);
    if (!res.success) {
      const errs: Record<string, string> = {};
      res.error.issues.forEach((e) => { errs[e.path[0] as string] = e.message; });
      setErrors(errs);
      return false;
    }
    setErrors({});
    return true;
  };

  const next = () => { if (validate(step)) setStep((s) => Math.min(s + 1, steps.length - 1)); };
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const submit = async (status: "draft" | "pending") => {
    for (let i = 0; i < schemas.length; i++) {
      if (!validate(i)) { setStep(i); return; }
    }
    if (!user) return;
    setSubmitting(true);
    try {
      const payload = {
        user_id: user.id,
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        aadhaar_last4: form.aadhaar_last4,
        pan_number: form.pan_number.toUpperCase(),
        farm_name: form.farm_name.trim(),
        slug: slugify(form.farm_name),
        village: form.village.trim(),
        district: form.district.trim() || null,
        state: form.state.trim(),
        pincode: form.pincode,
        farm_size_acres: Number(form.farm_size_acres),
        years_farming: parseInt(form.years_farming, 10),
        farming_method: form.farming_method,
        crops: form.crops.split(",").map((s) => s.trim()).filter(Boolean),
        bank_account_name: form.bank_account_name.trim(),
        bank_account_number: form.bank_account_number,
        bank_ifsc: form.bank_ifsc.toUpperCase(),
        bank_name: form.bank_name.trim(),
        upi_id: form.upi_id.trim() || null,
        headline: form.headline.trim(),
        story: form.story.trim(),
        status,
      };
      const { error } = await supabase.from("farmer_profiles").upsert(payload, { onConflict: "user_id" });
      if (error) throw error;
      // give the farmer role too
      await supabase.from("user_roles").insert({ user_id: user.id, role: "farmer" }).then(() => {}, () => {});
      await qc.invalidateQueries({ queryKey: farmerKey(user.id) });
      toast.success(status === "pending" ? "Application submitted for review" : "Draft saved");
      if (status === "pending") navigate({ to: "/farmer-portal/dashboard" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not save";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <MarketingLayout>
      <section className="container-prj py-10 md:py-14 max-w-3xl">
        <Link to="/become-a-seller" className="font-subhead inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3 w-3" /> Back
        </Link>
        <h1 className="font-display mt-4 text-4xl font-semibold md:text-5xl">Farmer registration</h1>
        <p className="mt-2 text-muted-foreground">A few details so we can verify and onboard you.</p>

        {/* stepper */}
        <ol className="mt-8 flex items-center gap-2 overflow-x-auto pb-2">
          {steps.map((s, i) => (
            <li key={s} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => i < step && setStep(i)}
                className={`font-subhead grid h-7 min-w-7 place-items-center rounded-full px-2 text-xs ${i === step ? "bg-primary text-primary-foreground" : i < step ? "bg-success/20 text-success" : "bg-secondary text-muted-foreground"}`}
              >
                {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </button>
              <span className={`font-subhead text-xs ${i === step ? "text-foreground" : "text-muted-foreground"}`}>{s}</span>
              {i < steps.length - 1 && <span className="mx-1 h-px w-6 bg-border" />}
            </li>
          ))}
        </ol>

        <div className="mt-8 rounded-3xl border border-border bg-background p-6 md:p-8">
          {step === 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Full name" value={form.full_name} onChange={set("full_name")} error={errors.full_name} />
              <Field label="Phone" type="tel" value={form.phone} onChange={set("phone")} error={errors.phone} />
              <Field label="Email" type="email" value={form.email} onChange={set("email")} error={errors.email} />
              <Field label="Aadhaar (last 4 digits)" value={form.aadhaar_last4} maxLength={4} onChange={set("aadhaar_last4")} error={errors.aadhaar_last4} />
              <Field label="PAN number" value={form.pan_number} onChange={set("pan_number")} error={errors.pan_number} />
            </div>
          )}
          {step === 1 && (
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Farm name" value={form.farm_name} onChange={set("farm_name")} error={errors.farm_name} />
              <Field label="Village" value={form.village} onChange={set("village")} error={errors.village} />
              <Field label="District" value={form.district} onChange={set("district")} error={errors.district} />
              <Field label="State" value={form.state} onChange={set("state")} error={errors.state} />
              <Field label="PIN code" value={form.pincode} maxLength={6} onChange={set("pincode")} error={errors.pincode} />
              <Field label="Farm size (acres)" type="number" step="0.1" value={form.farm_size_acres} onChange={set("farm_size_acres")} error={errors.farm_size_acres} />
              <Field label="Years farming" type="number" value={form.years_farming} onChange={set("years_farming")} error={errors.years_farming} />
              <Select label="Farming method" value={form.farming_method} onChange={set("farming_method")} options={["organic","natural","regenerative","traditional"]} />
              <div className="md:col-span-2">
                <Field label="Crops grown (comma-separated)" value={form.crops} onChange={set("crops")} error={errors.crops} placeholder="turmeric, millet, mango" />
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Account holder name" value={form.bank_account_name} onChange={set("bank_account_name")} error={errors.bank_account_name} />
              <Field label="Bank name" value={form.bank_name} onChange={set("bank_name")} error={errors.bank_name} />
              <Field label="Account number" value={form.bank_account_number} onChange={set("bank_account_number")} error={errors.bank_account_number} />
              <Field label="IFSC" value={form.bank_ifsc} onChange={set("bank_ifsc")} error={errors.bank_ifsc} />
              <div className="md:col-span-2">
                <Field label="UPI ID (optional)" value={form.upi_id} onChange={set("upi_id")} error={errors.upi_id} placeholder="name@bank" />
              </div>
              <p className="md:col-span-2 text-xs text-muted-foreground">
                Bank details are encrypted at rest and used only for monthly settlements.
              </p>
            </div>
          )}
          {step === 3 && (
            <div className="grid gap-4">
              <Field label="One-line headline" value={form.headline} onChange={set("headline")} error={errors.headline} placeholder="Third-generation turmeric grower from Anand" />
              <TextArea label="Your story" rows={8} value={form.story} onChange={set("story")} error={errors.story} placeholder="Where you farm, why you farm, what makes your produce different..." />
            </div>
          )}
          {step === 4 && (
            <div className="space-y-4 text-sm">
              <Row k="Name" v={form.full_name} />
              <Row k="Farm" v={`${form.farm_name} · ${form.village}, ${form.state}`} />
              <Row k="Method" v={form.farming_method} />
              <Row k="Crops" v={form.crops} />
              <Row k="Bank" v={`${form.bank_name} · ****${form.bank_account_number.slice(-4)}`} />
              <p className="text-xs text-muted-foreground">By submitting you agree to our seller terms. We verify within 48 hours.</p>
            </div>
          )}

          <div className="mt-8 flex flex-wrap justify-between gap-3">
            <button type="button" onClick={back} disabled={step === 0} className="font-subhead inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm disabled:opacity-40">
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <div className="flex gap-3">
              <button type="button" onClick={() => submit("draft")} disabled={submitting} className="font-subhead rounded-full border border-border px-5 py-2.5 text-sm hover:bg-secondary disabled:opacity-50">
                Save draft
              </button>
              {step < steps.length - 1 ? (
                <button type="button" onClick={next} className="font-subhead inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90">
                  Continue <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button type="button" onClick={() => submit("pending")} disabled={submitting} className="font-subhead inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />} Submit application
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}

function Field({ label, error, ...rest }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  return (
    <label className="block">
      <span className="font-subhead text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
      <input {...rest} className={`font-subhead mt-1.5 h-11 w-full rounded-xl border bg-background px-3.5 text-sm outline-none focus:border-primary ${error ? "border-destructive" : "border-border"}`} />
      {error && <span className="mt-1 block text-xs text-destructive">{error}</span>}
    </label>
  );
}

function TextArea({ label, error, ...rest }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; error?: string }) {
  return (
    <label className="block">
      <span className="font-subhead text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
      <textarea {...rest} className={`font-subhead mt-1.5 w-full rounded-xl border bg-background p-3.5 text-sm outline-none focus:border-primary ${error ? "border-destructive" : "border-border"}`} />
      {error && <span className="mt-1 block text-xs text-destructive">{error}</span>}
    </label>
  );
}

function Select({ label, options, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; options: string[] }) {
  return (
    <label className="block">
      <span className="font-subhead text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
      <select {...rest} className="font-subhead mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3.5 text-sm outline-none focus:border-primary capitalize">
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border pb-3">
      <span className="font-subhead text-xs uppercase tracking-[0.14em] text-muted-foreground">{k}</span>
      <span className="text-right font-medium">{v || "—"}</span>
    </div>
  );
}
