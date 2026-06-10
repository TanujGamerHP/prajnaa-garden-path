import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Mail, Phone, Loader2 } from "lucide-react";
import { MarketingLayout } from "@/components/marketing/layout";
import { Logo } from "@/components/brand/logo";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/auth/login")({
  head: () => ({
    meta: [{ title: "Sign in — Prajnaa Farm" }, { name: "robots", content: "noindex" }],
  }),
  component: LoginPage,
});

type Mode = "email" | "phone";

function LoginPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [mode, setMode] = useState<Mode>("email");

  useEffect(() => {
    if (session) navigate({ to: "/account", replace: true });
  }, [session, navigate]);

  return (
    <MarketingLayout>
      <div className="container-prj grid place-items-center py-16 md:py-20">
        <div className="w-full max-w-sm">
          <div className="flex justify-center"><Logo /></div>
          <h1 className="font-display mt-8 text-center text-3xl font-semibold">Welcome back</h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">Sign in to your Prajnaa Farm account.</p>

          <GoogleButton />

          <div className="my-6 flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
          </div>

          <div className="grid grid-cols-2 gap-2 rounded-full bg-secondary p-1">
            <button
              onClick={() => setMode("email")}
              className={`font-subhead inline-flex items-center justify-center gap-2 rounded-full px-3 py-2 text-xs font-medium transition-colors ${mode === "email" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
            >
              <Mail className="h-3.5 w-3.5" /> Email
            </button>
            <button
              onClick={() => setMode("phone")}
              className={`font-subhead inline-flex items-center justify-center gap-2 rounded-full px-3 py-2 text-xs font-medium transition-colors ${mode === "phone" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
            >
              <Phone className="h-3.5 w-3.5" /> Phone
            </button>
          </div>

          <div className="mt-6">
            {mode === "email" ? <EmailForm /> : <PhoneForm />}
          </div>

          <p className="font-subhead mt-8 text-center text-xs text-muted-foreground">
            New here? <Link to="/auth/register" className="text-primary underline">Create an account</Link>
          </p>
        </div>
      </div>
    </MarketingLayout>
  );
}

export function GoogleButton({ label = "Continue with Google" }: { label?: string }) {
  const [loading, setLoading] = useState(false);
  const onClick = async () => {
    setLoading(true);
    try {
      const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/account" });
      if (res.error) {
        toast.error(res.error.message || "Google sign-in failed");
        setLoading(false);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Google sign-in failed");
      setLoading(false);
    }
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="font-subhead inline-flex h-12 w-full items-center justify-center gap-3 rounded-full border border-border bg-background text-sm font-medium transition-colors hover:bg-secondary disabled:opacity-60"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
      {label}
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09Z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.99.66-2.25 1.06-3.72 1.06-2.86 0-5.29-1.93-6.15-4.53H2.18v2.84A11 11 0 0 0 12 23Z"/>
      <path fill="#FBBC05" d="M5.85 14.11A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.35-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.95l3.67-2.84Z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.67 2.84C6.71 7.3 9.14 5.38 12 5.38Z"/>
    </svg>
  );
}

const emailSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

function EmailForm() {
  const [loading, setLoading] = useState(false);
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = emailSchema.safeParse({ email: fd.get("email"), password: fd.get("password") });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Signed in");
  };
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input name="email" type="email" required autoComplete="email" placeholder="Email" className="font-subhead h-12 w-full rounded-full border border-border bg-background px-5 text-sm outline-none focus:border-primary" />
      <input name="password" type="password" required autoComplete="current-password" placeholder="Password" className="font-subhead h-12 w-full rounded-full border border-border bg-background px-5 text-sm outline-none focus:border-primary" />
      <button disabled={loading} className="font-subhead inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60">
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Sign in
      </button>
    </form>
  );
}

const phoneSchema = z.string().trim().regex(/^\+?[1-9]\d{7,14}$/, "Use full international format, e.g. +919876543210");

function PhoneForm() {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const sendOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const value = String(fd.get("phone") || "").replace(/\s+/g, "");
    const parsed = phoneSchema.safeParse(value);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ phone: parsed.data });
    setLoading(false);
    if (error) {
      toast.error(error.message.includes("provider") || error.message.includes("SMS")
        ? "SMS provider not configured yet. Set up Twilio in Cloud → Auth Settings."
        : error.message);
      return;
    }
    setPhone(parsed.data);
    setStep("otp");
    toast.success("OTP sent to " + parsed.data);
  };

  const verifyOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const token = String(fd.get("otp") || "").trim();
    if (!/^\d{6}$/.test(token)) { toast.error("Enter the 6-digit code"); return; }
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({ phone, token, type: "sms" });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Signed in");
  };

  if (step === "phone") {
    return (
      <form onSubmit={sendOtp} className="space-y-3">
        <input name="phone" type="tel" required autoComplete="tel" placeholder="+91 98765 43210" className="font-subhead h-12 w-full rounded-full border border-border bg-background px-5 text-sm outline-none focus:border-primary" />
        <button disabled={loading} className="font-subhead inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Send OTP
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={verifyOtp} className="space-y-3">
      <input name="otp" type="text" inputMode="numeric" maxLength={6} required placeholder="6-digit code" className="font-subhead h-12 w-full rounded-full border border-border bg-background px-5 text-center text-base tracking-[0.5em] outline-none focus:border-primary" />
      <button disabled={loading} className="font-subhead inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60">
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Verify & sign in
      </button>
      <button type="button" onClick={() => setStep("phone")} className="font-subhead block w-full text-center text-xs text-muted-foreground hover:text-foreground">
        Change number
      </button>
    </form>
  );
}
