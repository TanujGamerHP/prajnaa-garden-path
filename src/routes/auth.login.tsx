import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { MarketingLayout } from "@/components/marketing/layout";
import { Logo } from "@/components/brand/logo";

export const Route = createFileRoute("/auth/login")({
  head: () => ({
    meta: [{ title: "Sign in — Prajnaa Farm" }, { name: "robots", content: "noindex" }],
  }),
  component: LoginPage,
});

function LoginPage() {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  return (
    <MarketingLayout>
      <div className="container-prj grid place-items-center py-20">
        <div className="w-full max-w-sm">
          <div className="flex justify-center"><Logo /></div>
          <h1 className="font-display mt-8 text-center text-3xl font-semibold">Sign in</h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">Use your phone number to continue.</p>

          {step === "phone" ? (
            <form
              onSubmit={(e) => { e.preventDefault(); toast.success("OTP sent"); setStep("otp"); }}
              className="mt-8 space-y-4"
            >
              <input type="tel" required placeholder="Phone number" className="font-subhead h-12 w-full rounded-full border border-border bg-background px-5 text-sm outline-none focus:border-primary" />
              <button className="font-subhead h-12 w-full rounded-full bg-primary text-sm font-medium text-primary-foreground hover:opacity-90">Send OTP</button>
            </form>
          ) : (
            <form
              onSubmit={(e) => { e.preventDefault(); toast.success("Signed in"); }}
              className="mt-8 space-y-4"
            >
              <input type="text" required inputMode="numeric" maxLength={6} placeholder="6-digit OTP" className="font-subhead h-12 w-full rounded-full border border-border bg-background px-5 text-center text-base tracking-[0.5em] outline-none focus:border-primary" />
              <button className="font-subhead h-12 w-full rounded-full bg-primary text-sm font-medium text-primary-foreground hover:opacity-90">Verify & sign in</button>
              <button type="button" onClick={() => setStep("phone")} className="font-subhead block w-full text-center text-xs text-muted-foreground hover:text-foreground">Change number</button>
            </form>
          )}

          <p className="font-subhead mt-8 text-center text-xs text-muted-foreground">
            New here? <Link to="/auth/register" className="text-primary underline">Create an account</Link>
          </p>
        </div>
      </div>
    </MarketingLayout>
  );
}
