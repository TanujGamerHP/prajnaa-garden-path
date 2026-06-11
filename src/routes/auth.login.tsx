import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Mail, Phone, Loader2, ShieldCheck, Sparkles, AlertTriangle } from "lucide-react";
import { MarketingLayout } from "@/components/marketing/layout";
import { Logo } from "@/components/brand/logo";
import { useAuth } from "@/hooks/use-auth";
import { auth, isFirebaseConfigured } from "@/lib/firebase";
import {
  signInWithPopup,
  GoogleAuthProvider,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult,
} from "firebase/auth";

export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+")) {
    return cleaned;
  }
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }
  if (cleaned.startsWith("91") && cleaned.length === 12) {
    return `+${cleaned}`;
  }
  return cleaned.startsWith("0") ? `+91${cleaned.slice(1)}` : `+91${cleaned}`;
}

export function getOrCreateRecaptchaContainer(id: string) {
  if (typeof document === "undefined") return null;
  const existing = document.getElementById(id);
  if (existing) {
    existing.remove();
  }
  const el = document.createElement("div");
  el.id = id;
  el.className = "hidden";
  document.body.appendChild(el);
  return el;
}

export const Route = createFileRoute("/auth/login")({
  head: () => ({
    meta: [{ title: "Sign in — Prajnaa Farm" }, { name: "robots", content: "noindex" }],
  }),
  component: LoginPage,
});

type Mode = "email" | "phone";

function LoginPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<Mode>("phone"); // Preferred mode

  // Modal states
  const [showLinkPhoneModal, setShowLinkPhoneModal] = useState(false);
  const [showLinkEmailModal, setShowLinkEmailModal] = useState(false);

  useEffect(() => {
    if (user) {
      const hasPhone = !!user.phone;
      const hasEmail = !!user.email;

      const dismissPhone = sessionStorage.getItem("dismiss_link_phone") === "true";
      const dismissEmail = sessionStorage.getItem("dismiss_link_email") === "true";

      if (!hasPhone && !dismissPhone) {
        setShowLinkPhoneModal(true);
      } else if (!hasEmail && !dismissEmail) {
        setShowLinkEmailModal(true);
      } else {
        // Logged in, fully linked -> redirect to account dashboard
        navigate({ to: "/account", replace: true });
      }
    }
  }, [user, navigate]);

  return (
    <MarketingLayout>
      <div className="container-prj grid place-items-center py-16 md:py-20 relative">
        <div className="w-full max-w-sm transition-opacity duration-200">
          <div className="flex justify-center">
            <Logo />
          </div>
          <h1 className="font-display mt-8 text-center text-3xl font-semibold">Welcome back</h1>
          <p className="mt-2 text-center text-sm text-muted-foreground mb-6">
            Sign in to your Prajnaa Farm account.
          </p>

          {!isFirebaseConfigured && (
            <div className="mb-6 rounded-xl border border-warning/30 bg-warning/5 p-4 text-warning flex items-start gap-3 text-xs leading-relaxed animate-in fade-in slide-in-from-top-4 duration-300">
              <AlertTriangle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block mb-0.5">Firebase Configuration Required</span>
                Please add your Firebase credentials to the{" "}
                <code className="bg-warning/10 px-1 py-0.5 rounded font-mono text-[10px]">
                  .env
                </code>{" "}
                file (<code className="font-mono text-[10px]">VITE_FIREBASE_API_KEY</code>, etc.) to
                enable real Google & Phone OTP authentication.
              </div>
            </div>
          )}

          <div className="mt-8">
            <GoogleButton />
          </div>

          <div className="my-6 flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
          </div>

          <div className="grid grid-cols-2 gap-2 rounded-full bg-secondary p-1 mb-6">
            <button
              onClick={() => setMode("phone")}
              className={`font-subhead inline-flex items-center justify-center gap-2 rounded-full px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${mode === "phone" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
            >
              <Phone className="h-3.5 w-3.5" /> Phone
            </button>
            <button
              onClick={() => setMode("email")}
              className={`font-subhead inline-flex items-center justify-center gap-2 rounded-full px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${mode === "email" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
            >
              <Mail className="h-3.5 w-3.5" /> Email Password
            </button>
          </div>

          <div className="mt-6">{mode === "phone" ? <PhoneForm /> : <EmailForm />}</div>

          <p className="font-subhead mt-8 text-center text-xs text-muted-foreground">
            New here?{" "}
            <Link to="/auth/register" className="text-primary underline">
              Create an account
            </Link>
          </p>
        </div>

        {/* MODAL CASE 1: Google account missing Phone number */}
        {showLinkPhoneModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 transition-opacity duration-200">
            <div className="w-full max-w-sm rounded-2xl bg-background border border-border p-6 shadow-2xl animate-scale-up text-center">
              <div className="p-3 bg-primary/5 rounded-full inline-block text-primary mb-4">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h2 className="font-display text-lg font-semibold text-foreground mb-2">
                Secure Your Account
              </h2>
              <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
                Add your mobile number for account recovery and order updates.
              </p>

              <LinkPhoneSection
                onDismiss={() => {
                  sessionStorage.setItem("dismiss_link_phone", "true");
                  setShowLinkPhoneModal(false);
                  navigate({ to: "/account", replace: true });
                }}
              />
            </div>
          </div>
        )}

        {/* MODAL CASE 2: Phone account missing Email */}
        {showLinkEmailModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 transition-opacity duration-200">
            <div className="w-full max-w-sm rounded-2xl bg-background border border-border p-6 shadow-2xl animate-scale-up text-center">
              <div className="p-3 bg-accent/5 rounded-full inline-block text-accent mb-4">
                <Sparkles className="h-6 w-6" />
              </div>
              <h2 className="font-display text-lg font-semibold text-foreground mb-2">
                Add Email Address
              </h2>
              <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
                Connect your Google account for faster login.
              </p>

              <LinkEmailSection
                onDismiss={() => {
                  sessionStorage.setItem("dismiss_link_email", "true");
                  setShowLinkEmailModal(false);
                  navigate({ to: "/account", replace: true });
                }}
              />
            </div>
          </div>
        )}
      </div>
    </MarketingLayout>
  );
}

// Google Sign-In Component using native OAuth Popup selector
export function GoogleButton({ label = "Continue with Google" }: { label?: string }) {
  const [loading, setLoading] = useState(false);

  const onClick = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    // Prompt the native Google account selector explicitly
    provider.setCustomParameters({ prompt: "select_account" });

    try {
      await signInWithPopup(auth, provider);
      toast.success("Successfully authenticated with Google");
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Google Sign-In failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="font-subhead inline-flex h-12 w-full items-center justify-center gap-3 rounded-full border border-border bg-background text-sm font-medium transition-all duration-200 hover:bg-secondary disabled:opacity-60 cursor-pointer"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <GoogleIcon />}
      {label}
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.99.66-2.25 1.06-3.72 1.06-2.86 0-5.29-1.93-6.15-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.85 14.11A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.35-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.95l3.67-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.67 2.84C6.71 7.3 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}

// Phone Sign-In Form utilizing Firebase phone verification and reCAPTCHA
const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[1-9]\d{7,14}$/, "Use full international format, e.g. +919876543210");

function PhoneForm() {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  // Rate Limiting States
  const [otpRequests, setOtpRequests] = useState(0);
  const [otpAttempts, setOtpAttempts] = useState(0);
  const [otpSentTime, setOtpSentTime] = useState<number | null>(null);

  const sendOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (otpRequests >= 5) {
      toast.error("Maximum OTP requests reached (Rate Limit). Try again in 15 minutes.");
      return;
    }

    const fd = new FormData(e.currentTarget);
    const rawValue = String(fd.get("phone") || "").trim();
    const formatted = formatPhoneNumber(rawValue);
    const parsed = phoneSchema.safeParse(formatted);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    setLoading(true);

    try {
      // Setup Invisible reCAPTCHA verifier dynamically to prevent rendering conflicts
      getOrCreateRecaptchaContainer("recaptcha-container");
      const recaptcha = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
      });

      const result = await signInWithPhoneNumber(auth, parsed.data, recaptcha);

      setConfirmationResult(result);
      setPhone(parsed.data);
      setOtpRequests((prev) => prev + 1);
      setOtpSentTime(Date.now());
      setOtpAttempts(0); // reset verification attempts
      setStep("otp");

      toast.success("Verification code sent to " + parsed.data);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to deliver OTP SMS. Verify your number format.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (otpAttempts >= 5) {
      toast.error("Too many incorrect attempts. Please request a new OTP.");
      return;
    }
    if (otpSentTime && Date.now() - otpSentTime > 5 * 60 * 1000) {
      toast.error("Verification code expired (5 minutes limit). Please request a new one.");
      return;
    }

    const fd = new FormData(e.currentTarget);
    const token = String(fd.get("otp") || "").trim();
    if (!/^\d{6}$/.test(token)) {
      toast.error("Enter the 6-digit code");
      return;
    }

    setLoading(true);

    try {
      if (!confirmationResult) throw new Error("No pending confirmation found.");

      await confirmationResult.confirm(token);
      toast.success("Verification complete. Welcome!");
    } catch (err: any) {
      console.error(err);
      setOtpAttempts((prev) => prev + 1);
      toast.error(err.message || "Invalid OTP code entered.");
    } finally {
      setLoading(false);
    }
  };

  if (step === "phone") {
    return (
      <form onSubmit={sendOtp} className="space-y-3 transition-all duration-200">
        <input
          name="phone"
          type="tel"
          required
          autoComplete="tel"
          placeholder="+91 98765 43210"
          className="font-subhead h-12 w-full rounded-full border border-border bg-background px-5 text-sm outline-none focus:border-primary text-text"
        />
        <button
          disabled={loading}
          className="font-subhead inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-medium text-primary-foreground transition-all duration-200 hover:opacity-90 disabled:opacity-60 cursor-pointer"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin text-white" />}
          Send OTP
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={verifyOtp} className="space-y-3 transition-all duration-200">
      <input
        name="otp"
        type="text"
        inputMode="numeric"
        maxLength={6}
        required
        autoComplete="one-time-code"
        placeholder="6-digit code"
        className="font-subhead h-12 w-full rounded-full border border-border bg-background px-5 text-center text-base tracking-[0.5em] outline-none focus:border-primary text-text font-bold"
      />
      <button
        disabled={loading}
        className="font-subhead inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-medium text-primary-foreground transition-all duration-200 hover:opacity-90 disabled:opacity-60 cursor-pointer"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin text-white" />}
        Verify & sign in
      </button>
      <button
        type="button"
        onClick={() => setStep("phone")}
        className="font-subhead block w-full text-center text-xs text-muted-foreground hover:text-foreground"
      >
        Change number
      </button>
    </form>
  );
}

// Modal Component sections for Linking Credentials
function LinkPhoneSection({ onDismiss }: { onDismiss: () => void }) {
  const { linkPhone } = useAuth();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const sendLinkOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const rawValue = String(fd.get("phone") || "").trim();
    const formatted = formatPhoneNumber(rawValue);
    const parsed = phoneSchema.safeParse(formatted);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    setLoading(true);
    try {
      // Setup Link Invisible reCAPTCHA verifier dynamically to prevent rendering conflicts
      getOrCreateRecaptchaContainer("link-recaptcha-anchor");
      const recaptcha = new RecaptchaVerifier(auth, "link-recaptcha-anchor", {
        size: "invisible",
      });
      const result = await signInWithPhoneNumber(auth, parsed.data, recaptcha);
      setConfirmationResult(result);
      setPhone(parsed.data);
      setStep("otp");
      toast.success("OTP sent to " + parsed.data);
    } catch (err: any) {
      toast.error(err.message || "Failed to send verification SMS");
    } finally {
      setLoading(false);
    }
  };

  const verifyAndLink = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const token = String(fd.get("otp") || "").trim();
    if (!/^\d{6}$/.test(token)) {
      toast.error("Enter the 6-digit code");
      return;
    }

    setLoading(true);
    try {
      if (!confirmationResult) throw new Error("No pending OTP transaction found.");
      await linkPhone(phone, confirmationResult.verificationId, token);
      toast.success("Account secured successfully!");
      onDismiss();
    } catch (err: any) {
      toast.error(err.message || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {step === "phone" ? (
        <form onSubmit={sendLinkOtp} className="space-y-3">
          <input
            name="phone"
            type="tel"
            required
            placeholder="+91 98765 43210"
            className="h-10 w-full rounded-full border border-border px-4 text-xs outline-none focus:border-primary text-text"
          />
          <div className="flex gap-2 justify-center">
            <button
              type="button"
              onClick={onDismiss}
              className="rounded-full border border-border px-5 py-2 text-xs font-semibold text-muted-foreground hover:bg-secondary"
            >
              Later
            </button>
            <button
              disabled={loading}
              className="rounded-full bg-primary text-white px-5 py-2 text-xs font-semibold hover:opacity-90 flex items-center gap-1.5 cursor-pointer"
            >
              {loading && <Loader2 className="h-3 w-3 animate-spin text-white" />}
              Add Mobile Number
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={verifyAndLink} className="space-y-3">
          <input
            name="otp"
            type="text"
            maxLength={6}
            required
            autoComplete="one-time-code"
            placeholder="6-digit code"
            className="h-10 w-full rounded-full border border-border px-4 text-center text-xs tracking-widest outline-none focus:border-primary text-text font-bold"
          />
          <div className="flex gap-2 justify-center">
            <button
              type="button"
              onClick={() => setStep("phone")}
              className="rounded-full border border-border px-5 py-2 text-xs font-semibold text-muted-foreground hover:bg-secondary"
            >
              Back
            </button>
            <button
              disabled={loading}
              className="rounded-full bg-primary text-white px-5 py-2 text-xs font-semibold hover:opacity-90 flex items-center gap-1.5 cursor-pointer"
            >
              {loading && <Loader2 className="h-3 w-3 animate-spin text-white" />}
              Verify OTP
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function LinkEmailSection({ onDismiss }: { onDismiss: () => void }) {
  const { linkGoogle } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleLinkGoogle = async () => {
    setLoading(true);
    try {
      await linkGoogle();
      toast.success("Google account linked successfully!");
      onDismiss();
    } catch (err: any) {
      toast.error(err.message || "Failed to link Google account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2 justify-center">
      <button
        type="button"
        onClick={onDismiss}
        className="rounded-full border border-border px-5 py-2 text-xs font-semibold text-muted-foreground hover:bg-secondary"
      >
        Later
      </button>
      <button
        onClick={handleLinkGoogle}
        disabled={loading}
        className="rounded-full bg-primary text-white px-5 py-2 text-xs font-semibold hover:opacity-90 flex items-center gap-1.5 cursor-pointer"
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin text-white" /> : <GoogleIcon />}
        Connect Google
      </button>
    </div>
  );
}

// Fallback Email Form (Legacy / compatibility)
const emailSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

function EmailForm() {
  const [loading, setLoading] = useState(false);
  const { refreshUserProfile } = useAuth();

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = emailSchema.safeParse({ email: fd.get("email"), password: fd.get("password") });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    setLoading(true);
    try {
      const { signInWithEmailAndPassword } = await import("firebase/auth");
      await signInWithEmailAndPassword(auth, parsed.data.email, parsed.data.password);
      toast.success("Signed in successfully");
    } catch (err: any) {
      toast.error(err.message || "Email sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input
        name="email"
        type="email"
        required
        autoComplete="email"
        placeholder="Email"
        className="font-subhead h-12 w-full rounded-full border border-border bg-background px-5 text-sm outline-none focus:border-primary text-text"
      />
      <input
        name="password"
        type="password"
        required
        autoComplete="current-password"
        placeholder="Password"
        className="font-subhead h-12 w-full rounded-full border border-border bg-background px-5 text-sm outline-none focus:border-primary text-text"
      />
      <button
        disabled={loading}
        className="font-subhead inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-medium text-primary-foreground transition-all duration-200 hover:opacity-90 disabled:opacity-60 cursor-pointer"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin text-white" />}
        Sign in
      </button>
    </form>
  );
}
