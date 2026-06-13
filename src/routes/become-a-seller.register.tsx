import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { ArrowLeft, ArrowRight, Loader2, Check, Search, Upload, X, User } from "lucide-react";
import { MarketingLayout } from "@/components/marketing/layout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useFarmerProfile, slugify, farmerKey } from "@/lib/farmer/use-farmer";
import { formatPhoneNumber } from "./auth.login";
import { compressImage } from "@/lib/image-compress";
import { fileToBase64 } from "@/lib/file-to-base64";

export const Route = createFileRoute("/become-a-seller/register")({
  head: () => ({
    meta: [{ title: "Farmer registration — Prajnaa Farm" }, { name: "robots", content: "noindex" }],
  }),
  component: RegisterPage,
});

// Verhoeff Algorithm Tables for Aadhaar verification
const verhoeffD = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];

const verhoeffP = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

function validateVerhoeff(array: number[]): boolean {
  let c = 0;
  const reversedArray = [...array].reverse();
  for (let i = 0; i < reversedArray.length; i++) {
    c = verhoeffD[c][verhoeffP[i % 8][reversedArray[i]]];
  }
  return c === 0;
}

export function validateAadhaar(aadhaar: string): boolean {
  const clean = aadhaar.replace(/\s/g, "");
  if (clean.length !== 12) return false;
  if (!/^\d{12}$/.test(clean)) return false;
  if (clean.charAt(0) === "0" || clean.charAt(0) === "1") return false;
  return validateVerhoeff(clean.split("").map(Number));
}

const INDIAN_BANKS = [
  "State Bank of India",
  "HDFC Bank",
  "ICICI Bank",
  "Punjab National Bank",
  "Bank of Baroda",
  "Axis Bank",
  "Kotak Mahindra Bank",
  "IndusInd Bank",
  "Bank of India",
  "Canara Bank",
  "Union Bank of India",
  "IDBI Bank",
  "Central Bank of India",
  "Indian Bank",
  "UCO Bank",
  "Indian Overseas Bank",
  "YES Bank",
  "Federal Bank",
  "IDFC FIRST Bank",
  "Bandhan Bank",
  "Standard Chartered Bank",
  "Citibank",
  "HSBC Bank",
  "Punjab & Sind Bank",
  "Bank of Maharashtra",
  "Jammu & Kashmir Bank",
  "Karnataka Bank",
  "Karur Vysya Bank",
  "South Indian Bank",
  "RBL Bank",
  "Paytm Payments Bank",
  "Airtel Payments Bank",
  "India Post Payments Bank",
];

const steps = ["Personal", "Farm", "Bank", "Story", "Review"] as const;

type Form = {
  full_name: string;
  phone: string;
  email: string;
  aadhaar_number: string; // validated as full 12 digits on frontend, last 4 digits saved in DB
  pan_number: string;
  portrait_url: string;
  kishan_pehchan_patra: string;
  farm_name: string;
  village: string;
  district: string;
  state: string;
  pincode: string;
  farm_size_acres: string;
  land_area_unit: string;
  khasra_numbers: string;
  cultivated_area: string;
  cultivator_type: string;
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
  full_name: "",
  phone: "",
  email: "",
  aadhaar_number: "",
  pan_number: "",
  portrait_url: "",
  kishan_pehchan_patra: "",
  farm_name: "",
  village: "",
  district: "",
  state: "",
  pincode: "",
  farm_size_acres: "",
  land_area_unit: "acres",
  khasra_numbers: "",
  cultivated_area: "",
  cultivator_type: "Owner",
  years_farming: "",
  farming_method: "natural",
  crops: "",
  bank_account_name: "",
  bank_account_number: "",
  bank_ifsc: "",
  bank_name: "",
  upi_id: "",
  headline: "",
  story: "",
};

const schemas = [
  z.object({
    full_name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
    phone: z
      .string()
      .trim()
      .refine((val) => {
        const formatted = formatPhoneNumber(val);
        return /^\+91[6-9]\d{9}$/.test(formatted);
      }, "Enter a valid 10-digit Indian mobile number (starts with 6-9)"),
    email: z.string().trim().email("Enter a valid email address").max(255),
    aadhaar_number: z
      .string()
      .trim()
      .refine((val) => {
        if (val.startsWith("****")) return true;
        return validateAadhaar(val);
      }, "Enter a mathematically valid 12-digit Aadhaar card number (fails Verhoeff checksum)"),
    pan_number: z
      .string()
      .trim()
      .regex(
        /^[A-Z]{5}[0-9]{4}[A-Z]$/,
        "Strict PAN format required: 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F)",
      ),
    portrait_url: z.string().min(1, "Farmer profile picture is required"),
    kishan_pehchan_patra: z
      .string()
      .trim()
      .min(4, "Kishan Pehchan Patra / Farmer ID is required")
      .max(50),
  }),
  z.object({
    farm_name: z.string().trim().min(2, "Farm name is required").max(120),
    village: z.string().trim().min(2, "Village is required").max(80),
    district: z.string().trim().max(80).optional().or(z.literal("")),
    state: z.string().trim().min(2, "State is required").max(60),
    pincode: z
      .string()
      .trim()
      .regex(/^\d{6}$/, "Pincode must be exactly 6 digits"),
    farm_size_acres: z
      .string()
      .regex(/^\d+(\.\d+)?$/, "Enter farm size (digits/decimals)"),
    land_area_unit: z.string().min(1, "Land area unit is required"),
    khasra_numbers: z.string().trim().min(2, "Khasra number(s) are required"),
    cultivated_area: z
      .string()
      .regex(/^\d+(\.\d+)?$/, "Enter cultivated area (digits/decimals)"),
    cultivator_type: z.string().min(1, "Cultivator type is required"),
    years_farming: z.string().regex(/^\d{1,2}$/, "Enter farming experience in years"),
    farming_method: z.string().min(2),
    crops: z.string().trim().min(2, "List at least one crop"),
  }),
  z.object({
    bank_account_name: z.string().trim().min(2, "Account holder name is required").max(120),
    bank_account_number: z
      .string()
      .trim()
      .regex(/^\d{9,18}$/, "Account number must be between 9 to 18 digits"),
    bank_ifsc: z
      .string()
      .trim()
      .regex(
        /^[A-Z]{4}0[A-Z0-9]{6}$/,
        "IFSC must be 11 characters: 4 letters, 0, 6 alphanumeric (e.g. IFSC SBIN0001234)",
      ),
    bank_name: z
      .string()
      .trim()
      .refine((val) => {
        return INDIAN_BANKS.includes(val);
      }, "Please select a bank from the list"),
    upi_id: z.string().trim().max(80).optional().or(z.literal("")),
  }),
  z.object({
    headline: z.string().trim().min(6, "One-line headline (min 6 characters)").max(140),
    story: z
      .string()
      .trim()
      .min(40, "Tell us your story in at least a paragraph (min 40 characters)")
      .max(2000),
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
  const [uploadingPortrait, setUploadingPortrait] = useState(false);

  const handlePortraitUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB");
      return;
    }
    setUploadingPortrait(true);
    try {
      const compressedFile = await compressImage(file);
      const base64Url = await fileToBase64(compressedFile);
      setForm((prev) => ({ ...prev, portrait_url: base64Url }));
      toast.success("Profile picture uploaded successfully");
    } catch (err: any) {
      toast.error(err?.message ?? "Upload failed");
    } finally {
      setUploadingPortrait(false);
    }
  };

  const handleRemovePortrait = () => {
    setForm((prev) => ({ ...prev, portrait_url: "" }));
  };

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth/login", replace: true });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (existing) {
      setForm({
        full_name: existing.full_name ?? "",
        phone: existing.phone ?? "",
        email: existing.email ?? user?.email ?? "",
        aadhaar_number: existing.aadhaar_last4 ? `**** **** ${existing.aadhaar_last4}` : "",
        pan_number: existing.pan_number ?? "",
        portrait_url: existing.portrait_url ?? "",
        kishan_pehchan_patra: existing.kishan_pehchan_patra ?? "",
        farm_name: existing.farm_name ?? "",
        village: existing.village ?? "",
        district: existing.district ?? "",
        state: existing.state ?? "",
        pincode: existing.pincode ?? "",
        farm_size_acres: existing.farm_size_acres?.toString() ?? "",
        land_area_unit: existing.land_area_unit ?? "acres",
        khasra_numbers: existing.khasra_numbers ?? "",
        cultivated_area: existing.cultivated_area?.toString() ?? "",
        cultivator_type: existing.cultivator_type ?? "Owner",
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
              <Link
                to="/farmer-portal/dashboard"
                className="font-subhead inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
              >
                Go to portal <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/farmer-portal/kyc"
                className="font-subhead inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm hover:bg-secondary"
              >
                Upload KYC documents
              </Link>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Tip: Upload your Aadhaar, PAN, and bank passbook in the portal to speed up
              verification.
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
      res.error.issues.forEach((e) => {
        errs[e.path[0] as string] = e.message;
      });
      setErrors(errs);
      return false;
    }
    setErrors({});
    return true;
  };

  const next = () => {
    if (validate(step)) setStep((s) => Math.min(s + 1, steps.length - 1));
  };
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const submit = async (status: "draft" | "pending") => {
    for (let i = 0; i < schemas.length; i++) {
      if (!validate(i)) {
        setStep(i);
        return;
      }
    }
    if (!user) return;
    setSubmitting(true);
    try {
      const last4 = form.aadhaar_number.replace(/\s/g, "").slice(-4);
      const payload = {
        user_id: user.id,
        full_name: form.full_name.trim(),
        phone: formatPhoneNumber(form.phone.trim()),
        email: form.email.trim(),
        aadhaar_last4: last4,
        pan_number: form.pan_number.toUpperCase(),
        portrait_url: form.portrait_url.trim() || null,
        kishan_pehchan_patra: form.kishan_pehchan_patra.trim(),
        farm_name: form.farm_name.trim(),
        slug: slugify(form.farm_name),
        village: form.village.trim(),
        district: form.district.trim() || null,
        state: form.state.trim(),
        pincode: form.pincode,
        farm_size_acres: Number(form.farm_size_acres),
        land_area_unit: form.land_area_unit,
        khasra_numbers: form.khasra_numbers.trim(),
        cultivated_area: form.cultivated_area ? Number(form.cultivated_area) : null,
        cultivator_type: form.cultivator_type,
        years_farming: parseInt(form.years_farming, 10),
        farming_method: form.farming_method,
        crops: form.crops
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        bank_account_name: form.bank_account_name.trim(),
        bank_account_number: form.bank_account_number,
        bank_ifsc: form.bank_ifsc.toUpperCase(),
        bank_name: form.bank_name.trim(),
        upi_id: form.upi_id.trim() || null,
        headline: form.headline.trim(),
        story: form.story.trim(),
        status,
      };
      const { error } = await supabase
        .from("farmer_profiles")
        .upsert(payload, { onConflict: "user_id" });
      if (error) throw error;
      // give the farmer role too
      await supabase
        .from("user_roles")
        .insert({ user_id: user.id, role: "farmer" })
        .then(
          () => {},
          () => {},
        );
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

  const set =
    (k: keyof Form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      let val = e.target.value;

      // Real-time formatting as the user types
      if (k === "aadhaar_number") {
        const raw = val.replace(/\D/g, "");
        val =
          raw
            .match(/.{1,4}/g)
            ?.join(" ")
            .slice(0, 14) || "";
      }
      if (k === "pan_number" || k === "bank_ifsc") {
        val = val.toUpperCase();
      }
      if (k === "phone") {
        val = val.replace(/[^\d+ -]/g, "");
      }
      if (k === "bank_account_number") {
        val = val.replace(/\D/g, "");
      }
      if (k === "pincode") {
        val = val.replace(/\D/g, "").slice(0, 6);
      }

      setForm((f) => {
        const newForm = { ...f, [k]: val };

        // Real-time validation run
        const schemaForStep = schemas[step];
        if (schemaForStep) {
          const res = schemaForStep.safeParse(newForm);
          if (!res.success) {
            const issue = res.error.issues.find((i) => i.path[0] === k);
            if (issue) {
              setErrors((prev) => ({ ...prev, [k]: issue.message }));
            } else {
              setErrors((prev) => {
                const copy = { ...prev };
                delete copy[k];
                return copy;
              });
            }
          } else {
            setErrors((prev) => {
              const copy = { ...prev };
              delete copy[k];
              return copy;
            });
          }
        }
        return newForm;
      });
    };

  return (
    <MarketingLayout>
      <section className="container-prj py-10 md:py-14 max-w-3xl">
        <Link
          to="/become-a-seller"
          className="font-subhead inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" /> Back
        </Link>
        <h1 className="font-display mt-4 text-4xl font-semibold md:text-5xl">
          Farmer registration
        </h1>
        <p className="mt-2 text-muted-foreground">
          A few details so we can verify and onboard you.
        </p>

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
              <span
                className={`font-subhead text-xs ${i === step ? "text-foreground" : "text-muted-foreground"}`}
              >
                {s}
              </span>
              {i < steps.length - 1 && <span className="mx-1 h-px w-6 bg-border" />}
            </li>
          ))}
        </ol>

        <div className="mt-8 rounded-3xl border border-border bg-background p-6 md:p-8">
          {step === 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Full name"
                value={form.full_name}
                onChange={set("full_name")}
                error={errors.full_name}
                placeholder="e.g. Ramesh Kumar"
              />
              <Field
                label="Phone"
                type="tel"
                value={form.phone}
                onChange={set("phone")}
                error={errors.phone}
                placeholder="9876543210 (auto-prepends +91)"
              />
              <Field
                label="Email"
                type="email"
                value={form.email}
                onChange={set("email")}
                error={errors.email}
                placeholder="ramesh@example.com"
              />
              <Field
                label="Aadhaar Card Number"
                value={form.aadhaar_number}
                maxLength={14}
                onChange={set("aadhaar_number")}
                error={errors.aadhaar_number}
                placeholder="XXXX XXXX XXXX"
              />
              <Field
                label="PAN Card Number"
                value={form.pan_number}
                maxLength={10}
                onChange={set("pan_number")}
                error={errors.pan_number}
                placeholder="ABCDE1234F"
              />
              <Field
                label="Kishan Pehchan Patra / Farmer ID *"
                value={form.kishan_pehchan_patra}
                onChange={set("kishan_pehchan_patra")}
                error={errors.kishan_pehchan_patra}
                placeholder="e.g. HP-FARM-987654"
              />
              <div className="md:col-span-2 space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Farmer Profile Picture *
                </label>
                <div className="flex items-center gap-4">
                  {form.portrait_url ? (
                    <div className="relative h-20 w-20 rounded-full border border-border overflow-hidden">
                      <img src={form.portrait_url} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={handleRemovePortrait}
                        className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 hover:opacity-100 transition duration-200 cursor-pointer"
                        title="Remove photo"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="h-20 w-20 rounded-full bg-secondary flex items-center justify-center border border-border text-muted-foreground">
                      <User className="h-8 w-8" />
                    </div>
                  )}
                  
                  <label className="flex h-10 items-center justify-center border border-dashed border-border rounded-xl cursor-pointer bg-secondary/10 px-4 text-xs hover:bg-secondary/30 transition text-muted-foreground font-subhead font-medium gap-2">
                    {uploadingPortrait ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        <span>Upload Profile Pic</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePortraitUpload}
                      disabled={uploadingPortrait}
                      className="hidden"
                    />
                  </label>
                </div>
                {errors.portrait_url && (
                  <p className="text-xs text-destructive mt-1">{errors.portrait_url}</p>
                )}
              </div>
            </div>
          )}
          {step === 1 && (
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Farm name"
                value={form.farm_name}
                onChange={set("farm_name")}
                error={errors.farm_name}
                placeholder="e.g. Green Meadows Farm"
              />
              <Field
                label="Village"
                value={form.village}
                onChange={set("village")}
                error={errors.village}
              />
              <Field
                label="District"
                value={form.district}
                onChange={set("district")}
                error={errors.district}
              />
              <Field
                label="State"
                value={form.state}
                onChange={set("state")}
                error={errors.state}
              />
              <Field
                label="PIN code"
                value={form.pincode}
                maxLength={6}
                onChange={set("pincode")}
                error={errors.pincode}
                placeholder="6-digit code"
              />
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <Field
                    label="Total Land Area *"
                    type="number"
                    step="0.1"
                    value={form.farm_size_acres}
                    onChange={set("farm_size_acres")}
                    error={errors.farm_size_acres}
                  />
                </div>
                <div>
                  <Select
                    label="Area Unit *"
                    value={form.land_area_unit}
                    onChange={set("land_area_unit")}
                    options={["acres", "hectares", "bighas"]}
                  />
                </div>
              </div>
              <Field
                label="Cultivated Area *"
                type="number"
                step="0.1"
                value={form.cultivated_area}
                onChange={set("cultivated_area")}
                error={errors.cultivated_area}
                placeholder="Area currently cultivated"
              />
              <Field
                label="Khasra Number(s) *"
                value={form.khasra_numbers}
                onChange={set("khasra_numbers")}
                error={errors.khasra_numbers}
                placeholder="e.g. 122/4, 125/2 (comma-separated)"
              />
              <Select
                label="Cultivator Type *"
                value={form.cultivator_type}
                onChange={set("cultivator_type")}
                options={["Owner", "Tenant", "Sharecropper", "Leased"]}
              />
              <Field
                label="Years farming *"
                type="number"
                value={form.years_farming}
                onChange={set("years_farming")}
                error={errors.years_farming}
              />
              <Select
                label="Farming method"
                value={form.farming_method}
                onChange={set("farming_method")}
                options={["organic", "natural", "regenerative", "traditional"]}
              />
              <div className="md:col-span-2">
                <Field
                  label="Crops grown (comma-separated)"
                  value={form.crops}
                  onChange={set("crops")}
                  error={errors.crops}
                  placeholder="turmeric, millet, mango"
                />
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Account holder name"
                value={form.bank_account_name}
                onChange={set("bank_account_name")}
                error={errors.bank_account_name}
                placeholder="Ramesh Kumar"
              />
              <SearchableBankSelect
                value={form.bank_name}
                onChange={(val) => {
                  set("bank_name")({ target: { value: val } } as any);
                }}
                error={errors.bank_name}
              />
              <Field
                label="Account number"
                value={form.bank_account_number}
                maxLength={18}
                onChange={set("bank_account_number")}
                error={errors.bank_account_number}
                placeholder="Enter 9 to 18 digits"
              />
              <Field
                label="IFSC"
                value={form.bank_ifsc}
                maxLength={11}
                onChange={set("bank_ifsc")}
                error={errors.bank_ifsc}
                placeholder="SBIN0001234"
              />
              <div className="md:col-span-2">
                <Field
                  label="UPI ID (optional)"
                  value={form.upi_id}
                  onChange={set("upi_id")}
                  error={errors.upi_id}
                  placeholder="name@bank"
                />
              </div>
              <p className="md:col-span-2 text-xs text-muted-foreground">
                Bank details are encrypted at rest and used only for monthly settlements.
              </p>
            </div>
          )}
          {step === 3 && (
            <div className="grid gap-4">
              <Field
                label="One-line headline"
                value={form.headline}
                onChange={set("headline")}
                error={errors.headline}
                placeholder="Third-generation turmeric grower from Anand"
              />
              <TextArea
                label="Your story"
                rows={8}
                value={form.story}
                onChange={set("story")}
                error={errors.story}
                placeholder="Where you farm, why you farm, what makes your produce different..."
              />
            </div>
          )}
          {step === 4 && (
            <div className="space-y-4 text-sm">
              <Row k="Name" v={form.full_name} />
              <Row k="Farmer ID / Kishan Pehchan Patra" v={form.kishan_pehchan_patra} />
              <Row k="Farm" v={`${form.farm_name} · ${form.village}, ${form.state}`} />
              <Row k="Land Details" v={`${form.farm_size_acres} ${form.land_area_unit} (${form.cultivator_type}) · Khasra: ${form.khasra_numbers}`} />
              <Row k="Cultivated Area" v={`${form.cultivated_area} ${form.land_area_unit}`} />
              <Row k="Method" v={form.farming_method} />
              <Row k="Crops" v={form.crops} />
              <Row k="Bank" v={`${form.bank_name} · ****${form.bank_account_number.slice(-4)}`} />
              <p className="text-xs text-muted-foreground">
                By submitting you agree to our seller terms. We verify within 48 hours.
              </p>
            </div>
          )}

          <div className="mt-8 flex flex-wrap justify-between gap-3">
            <button
              type="button"
              onClick={back}
              disabled={step === 0}
              className="font-subhead inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm disabled:opacity-40"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => submit("draft")}
                disabled={submitting}
                className="font-subhead rounded-full border border-border px-5 py-2.5 text-sm hover:bg-secondary disabled:opacity-50"
              >
                Save draft
              </button>
              {step < steps.length - 1 ? (
                <button
                  type="button"
                  onClick={next}
                  className="font-subhead inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
                >
                  Continue <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => submit("pending")}
                  disabled={submitting}
                  className="font-subhead inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                >
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

function Field({
  label,
  error,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  return (
    <label className="block">
      <span className="font-subhead text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </span>
      <input
        {...rest}
        className={`font-subhead mt-1.5 h-11 w-full rounded-xl border bg-background px-3.5 text-sm outline-none focus:border-primary ${error ? "border-destructive" : "border-border"}`}
      />
      {error && <span className="mt-1 block text-xs text-destructive">{error}</span>}
    </label>
  );
}

function TextArea({
  label,
  error,
  ...rest
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; error?: string }) {
  return (
    <label className="block">
      <span className="font-subhead text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </span>
      <textarea
        {...rest}
        className={`font-subhead mt-1.5 w-full rounded-xl border bg-background p-3.5 text-sm outline-none focus:border-primary ${error ? "border-destructive" : "border-border"}`}
      />
      {error && <span className="mt-1 block text-xs text-destructive">{error}</span>}
    </label>
  );
}

function Select({
  label,
  options,
  ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; options: string[] }) {
  return (
    <label className="block">
      <span className="font-subhead text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </span>
      <select
        {...rest}
        className="font-subhead mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3.5 text-sm outline-none focus:border-primary capitalize"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

function SearchableBankSelect({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (val: string) => void;
  error?: string;
}) {
  const [search, setSearch] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [filtered, setFiltered] = useState(INDIAN_BANKS);

  useEffect(() => {
    setSearch(value);
  }, [value]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearch(val);
    setIsOpen(true);
    const matches = INDIAN_BANKS.filter((bank) => bank.toLowerCase().includes(val.toLowerCase()));
    setFiltered(matches);
    onChange(val);
  };

  const handleSelect = (bank: string) => {
    setSearch(bank);
    onChange(bank);
    setIsOpen(false);
  };

  return (
    <div className="relative block animate-in fade-in duration-300">
      <span className="font-subhead text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        Bank name
      </span>
      <div className="relative mt-1.5">
        <input
          type="text"
          value={search}
          onChange={handleSearchChange}
          onFocus={() => setIsOpen(true)}
          onBlur={() => {
            setTimeout(() => setIsOpen(false), 200);
          }}
          placeholder="Search bank name..."
          className={`font-subhead h-11 w-full rounded-xl border bg-background pl-9 pr-3.5 text-sm outline-none focus:border-primary ${error ? "border-destructive" : "border-border"}`}
        />
        <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
      </div>
      {error && <span className="mt-1 block text-xs text-destructive">{error}</span>}

      {isOpen && filtered.length > 0 && (
        <ul className="absolute z-55 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-border bg-background shadow-lg py-1">
          {filtered.map((bank) => (
            <li
              key={bank}
              onMouseDown={() => handleSelect(bank)}
              className="cursor-pointer px-4 py-2 text-sm hover:bg-secondary text-foreground flex items-center justify-between"
            >
              <span>{bank}</span>
              {value === bank && <Check className="h-4 w-4 text-primary" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border pb-3">
      <span className="font-subhead text-xs uppercase tracking-[0.14em] text-muted-foreground">
        {k}
      </span>
      <span className="text-right font-medium">{v || "—"}</span>
    </div>
  );
}
