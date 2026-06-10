import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { MarketingLayout } from "@/components/marketing/layout";
import { Logo } from "@/components/brand/logo";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { GoogleButton } from "./auth.login";

export const Route = createFileRoute("/auth/register")({
  head: () => ({
    meta: [{ title: "Create account — Prajnaa Farm" }, { name: "robots", content: "noindex" }],
  }),
  component: RegisterPage,
});

const schema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name").max(80),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().regex(/^\+?[1-9]\d{7,14}$/, "Phone must be in international format, e.g. +919876543210").optional().or(z.literal("")),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
});

function RegisterPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session) navigate({ to: "/account", replace: true });
  }, [session, navigate]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = schema.safeParse({
      full_name: fd.get("full_name"),
      email: fd.get("email"),
      phone: fd.get("phone") || "",
      password: fd.get("password"),
    });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/account`,
        data: { full_name: parsed.data.full_name, phone: parsed.data.phone || null },
      },
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Welcome to Prajnaa Farm");
  };

  return (
    <MarketingLayout>
      <div className="container-prj grid place-items-center py-16 md:py-20">
        <div className="w-full max-w-sm">
          <div className="flex justify-center"><Logo /></div>
          <h1 className="font-display mt-8 text-center text-3xl font-semibold">Create account</h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">Join the Prajnaa Farm community.</p>

          <div className="mt-6"><GoogleButton label="Sign up with Google" /></div>

          <div className="my-6 flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={onSubmit} className="space-y-3">
            <input name="full_name" type="text" required autoComplete="name" placeholder="Full name" className="font-subhead h-12 w-full rounded-full border border-border bg-background px-5 text-sm outline-none focus:border-primary" />
            <input name="email" type="email" required autoComplete="email" placeholder="Email" className="font-subhead h-12 w-full rounded-full border border-border bg-background px-5 text-sm outline-none focus:border-primary" />
            <input name="phone" type="tel" autoComplete="tel" placeholder="Phone (optional, +91…)" className="font-subhead h-12 w-full rounded-full border border-border bg-background px-5 text-sm outline-none focus:border-primary" />
            <input name="password" type="password" required autoComplete="new-password" placeholder="Password (min 8 chars)" className="font-subhead h-12 w-full rounded-full border border-border bg-background px-5 text-sm outline-none focus:border-primary" />
            <button disabled={loading} className="font-subhead inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Create account
            </button>
          </form>

          <p className="font-subhead mt-8 text-center text-xs text-muted-foreground">
            Already have an account? <Link to="/auth/login" className="text-primary underline">Sign in</Link>
          </p>
        </div>
      </div>
    </MarketingLayout>
  );
}
