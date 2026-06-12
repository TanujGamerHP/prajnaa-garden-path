import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Loader2, X, ShieldCheck, Upload } from "lucide-react";
import { AccountPageHeader } from "@/components/account/page-header";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { auth } from "@/lib/firebase";
import { compressImage } from "@/lib/image-compress";
import { fileToBase64 } from "@/lib/file-to-base64";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { formatPhoneNumber, getOrCreateRecaptchaContainer } from "./auth.login";

export const Route = createFileRoute("/account/profile")({
  component: ProfilePage,
});

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
};

const schema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name").max(80),
  avatar_url: z.string().trim().or(z.literal("")).optional(),
});

function ProfilePage() {
  const { user, refreshUserProfile } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("id, full_name, email, phone, avatar_url")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }: any) => {
        const p = data as Profile;
        setProfile(p ?? null);
        setAvatarUrl(p?.avatar_url || "");
      });
  }, [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10 MB");
      return;
    }
    setUploadingAvatar(true);
    try {
      const compressedFile = await compressImage(file);
      // Convert to Base64 data URL directly — no Firebase Storage needed
      const base64Url = await fileToBase64(compressedFile);
      
      // Save directly to the database
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          email: user.email,
          full_name: profile?.full_name || null,
          phone: profile?.phone || null,
          avatar_url: base64Url,
        });
      if (error) throw error;

      setAvatarUrl(base64Url);
      if (profile) {
        setProfile({ ...profile, avatar_url: base64Url });
      }
      await refreshUserProfile();
      toast.success("Profile photo uploaded and saved!");
    } catch (err: any) {
      toast.error(err?.message ?? "Upload and save failed");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user) return;
    setUploadingAvatar(true);
    try {
      // Save directly to the database
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          email: user.email,
          full_name: profile?.full_name || null,
          phone: profile?.phone || null,
          avatar_url: null,
        });
      if (error) throw error;

      setAvatarUrl("");
      if (profile) {
        setProfile({ ...profile, avatar_url: null });
      }
      await refreshUserProfile();
      toast.success("Profile photo removed!");
    } catch (err: any) {
      toast.error(err?.message ?? "Removal failed");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    const fd = new FormData(e.currentTarget);
    const parsed = schema.safeParse({
      full_name: fd.get("full_name"),
      avatar_url: avatarUrl,
    });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setSaving(true);
    const { data, error } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        email: user.email,
        full_name: parsed.data.full_name,
        phone: profile?.phone || null,
        avatar_url: parsed.data.avatar_url || null,
      })
      .select("id, full_name, email, phone, avatar_url")
      .single();
    setSaving(false);
    if (error) return toast.error(error.message);
    const updatedProfile = data as Profile;
    setProfile(updatedProfile);
    setAvatarUrl(updatedProfile.avatar_url || "");
    await refreshUserProfile();
    toast.success("Profile saved");
  };

  return (
    <>
      <AccountPageHeader title="Login & profile" description="How we address and contact you." />

      <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5">
        <div
          aria-hidden
          className="grid h-16 w-16 place-items-center rounded-full bg-primary/15 font-display text-2xl font-semibold text-primary"
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
          ) : (
            (profile?.full_name || user?.email || "?").slice(0, 1).toUpperCase()
          )}
        </div>
        <div>
          <p className="font-display text-lg font-semibold">
            {profile?.full_name || "Add your name"}
          </p>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="mt-6 grid max-w-2xl gap-4 sm:grid-cols-2">
        <Field label="Full name">
          <input
            name="full_name"
            defaultValue={profile?.full_name ?? ""}
            required
            className="input-prj"
          />
        </Field>
        <Field label="Email">
          <input value={user?.email ?? ""} disabled className="input-prj opacity-70" />
        </Field>
        <Field label="Phone">
          <div className="flex gap-2">
            <input
              value={profile?.phone || "No phone number linked"}
              disabled
              className="input-prj flex-1 opacity-70"
            />
            <button
              type="button"
              onClick={() => setShowPhoneModal(true)}
              className="font-subhead inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border bg-secondary px-5 text-xs font-medium text-foreground transition-all hover:bg-secondary/80 disabled:opacity-60 cursor-pointer shrink-0"
            >
              {profile?.phone ? "Change Phone" : "Verify Phone"}
            </button>
          </div>
        </Field>
        <Field label="Profile Photo">
          <div className="flex items-center gap-4 mt-1">
            <div className="relative group h-14 w-14 rounded-full overflow-hidden border border-border bg-secondary/35 flex items-center justify-center shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <span className="text-muted-foreground text-[10px] font-semibold">No Photo</span>
              )}
              {uploadingAvatar && (
                <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                </div>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  id="avatar-file-input"
                  disabled={uploadingAvatar}
                />
                <label
                  htmlFor="avatar-file-input"
                  className="font-subhead inline-flex cursor-pointer h-9 items-center justify-center rounded-full border border-border bg-secondary px-4 text-xs font-medium text-foreground hover:bg-secondary/80 transition-colors"
                >
                  Upload photo
                </label>
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="font-subhead inline-flex h-9 items-center justify-center rounded-full border border-destructive bg-destructive/5 px-4 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
              <span className="text-[10px] text-muted-foreground">JPG, PNG under 10MB</span>
            </div>
          </div>
        </Field>
        <div className="sm:col-span-2">
          <button
            disabled={saving}
            className="font-subhead inline-flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save changes
          </button>
        </div>
      </form>

      {showPhoneModal && (
        <PhoneVerificationModal
          onClose={() => setShowPhoneModal(false)}
          onSuccess={(newPhone) =>
            setProfile((prev) => (prev ? { ...prev, phone: newPhone } : null))
          }
        />
      )}
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="font-subhead text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

// Dialog Modal Component for verifying/changing phone number via Firebase Phone Auth OTP
function PhoneVerificationModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: (newPhone: string) => void;
}) {
  const { linkPhone } = useAuth();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);

  const sendOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const rawValue = String(fd.get("phone") || "").trim();
    const formatted = formatPhoneNumber(rawValue);

    // We regex-test the formatted phone number
    if (!/^\+?[1-9]\d{7,14}$/.test(formatted)) {
      toast.error(
        "Please enter a valid phone number. E.g. 9876543210 (starts with country code or defaults to India +91)",
      );
      return;
    }

    setLoading(true);
    try {
      // Setup Invisible reCAPTCHA verifier dynamically to prevent rendering conflicts
      getOrCreateRecaptchaContainer("profile-recaptcha-container");
      const recaptcha = new RecaptchaVerifier(auth, "profile-recaptcha-container", {
        size: "invisible",
      });

      const result = await signInWithPhoneNumber(auth, formatted, recaptcha);
      setConfirmationResult(result);
      setPhone(formatted);
      setStep("otp");
      toast.success("Verification code sent to " + formatted);
    } catch (err: any) {
      console.error(err);
      toast.error(
        err.message || "Failed to send verification SMS. Make sure SMS region is allowed.",
      );
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const token = String(fd.get("otp") || "").trim();
    if (!/^\d{6}$/.test(token)) {
      toast.error("Enter the 6-digit verification code");
      return;
    }

    setLoading(true);
    try {
      if (!confirmationResult) throw new Error("No pending OTP transaction found.");

      await linkPhone(phone, confirmationResult.verificationId, token);
      toast.success("Phone verified and saved successfully!");
      onSuccess(phone);
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Invalid OTP verification code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 transition-opacity duration-200">
      <div className="w-full max-w-sm rounded-2xl bg-background border border-border p-6 shadow-2xl animate-scale-up text-center relative">
        <button
          onClick={onClose}
          type="button"
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-3 bg-primary/5 rounded-full inline-block text-primary mb-4">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h2 className="font-display text-lg font-semibold text-foreground mb-2">
          Phone Verification
        </h2>
        <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
          Verify your mobile number via OTP for secure authentication.
        </p>

        {step === "phone" ? (
          <form onSubmit={sendOtp} className="space-y-3">
            <input
              name="phone"
              type="tel"
              required
              placeholder="+91 98765 43210"
              className="h-11 w-full rounded-full border border-border bg-background px-5 text-sm outline-none focus:border-primary text-text"
            />
            <button
              disabled={loading}
              className="font-subhead inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-medium text-primary-foreground transition-all duration-200 hover:opacity-90 disabled:opacity-60 cursor-pointer"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin text-white" />}
              Send OTP
            </button>
          </form>
        ) : (
          <form onSubmit={verifyOtp} className="space-y-3">
            <input
              name="otp"
              type="text"
              maxLength={6}
              required
              autoComplete="one-time-code"
              placeholder="6-digit code"
              className="h-11 w-full rounded-full border border-border bg-background px-5 text-center text-sm tracking-widest outline-none focus:border-primary text-text font-bold"
            />
            <button
              disabled={loading}
              className="font-subhead inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-medium text-primary-foreground transition-all duration-200 hover:opacity-90 disabled:opacity-60 cursor-pointer"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin text-white" />}
              Verify Code
            </button>
            <button
              type="button"
              onClick={() => setStep("phone")}
              className="font-subhead block w-full text-center text-xs text-muted-foreground hover:text-foreground mt-2"
            >
              Change phone number
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
