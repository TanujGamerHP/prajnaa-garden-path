import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Loader2, Lock, ShieldCheck } from "lucide-react";
import { AccountPageHeader } from "@/components/account/page-header";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/account/security")({
  component: SecurityPage,
});

const passwordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters").max(72),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Passwords do not match" });

function SecurityPage() {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [sentReset, setSentReset] = useState(false);

  const onChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = passwordSchema.safeParse({
      password: fd.get("password"),
      confirm: fd.get("confirm"),
    });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated");
    (e.currentTarget as HTMLFormElement).reset();
  };

  const sendReset = async () => {
    if (!user?.email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) return toast.error(error.message);
    setSentReset(true);
    toast.success("Reset link sent to your email");
  };

  return (
    <>
      <AccountPageHeader title="Security" description="Protect your account with a strong password." />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-primary" />
            <h2 className="font-display text-lg font-semibold">Change password</h2>
          </div>
          <form onSubmit={onChange} className="mt-4 grid gap-4">
            <Field label="New password">
              <input name="password" type="password" required minLength={8} className="input-prj" />
            </Field>
            <Field label="Confirm new password">
              <input name="confirm" type="password" required minLength={8} className="input-prj" />
            </Field>
            <button
              disabled={saving}
              className="font-subhead inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Update password
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <h2 className="font-display text-lg font-semibold">Account safety</h2>
          </div>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex items-center justify-between gap-3">
              <span>Email</span>
              <span className="text-muted-foreground">{user?.email}</span>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span>Email confirmed</span>
              <span className="text-muted-foreground">
                {user?.email_confirmed_at ? "Yes" : "Pending"}
              </span>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span>Two-factor auth</span>
              <span className="text-muted-foreground">Coming soon</span>
            </li>
          </ul>
          <button
            onClick={sendReset}
            disabled={sentReset}
            className="font-subhead mt-5 inline-flex h-10 items-center rounded-full border border-border px-4 text-xs uppercase tracking-[0.14em] hover:bg-secondary disabled:opacity-60"
          >
            {sentReset ? "Reset link sent" : "Email me a password reset link"}
          </button>
        </section>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="font-subhead text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}
