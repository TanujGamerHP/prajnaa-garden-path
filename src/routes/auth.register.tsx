import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { MarketingLayout } from "@/components/marketing/layout";
import { Logo } from "@/components/brand/logo";

export const Route = createFileRoute("/auth/register")({
  head: () => ({
    meta: [{ title: "Create account — Prajnaa Farm" }, { name: "robots", content: "noindex" }],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  return (
    <MarketingLayout>
      <div className="container-prj grid place-items-center py-20">
        <div className="w-full max-w-sm">
          <div className="flex justify-center"><Logo /></div>
          <h1 className="font-display mt-8 text-center text-3xl font-semibold">Create account</h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">Start with your phone — we'll send an OTP.</p>
          <form onSubmit={(e) => { e.preventDefault(); toast.success("Welcome to Prajnaa Farm"); }} className="mt-8 space-y-3">
            <input type="text" placeholder="Full name" required className="font-subhead h-12 w-full rounded-full border border-border bg-background px-5 text-sm outline-none focus:border-primary" />
            <input type="email" placeholder="Email" required className="font-subhead h-12 w-full rounded-full border border-border bg-background px-5 text-sm outline-none focus:border-primary" />
            <input type="tel" placeholder="Phone" required className="font-subhead h-12 w-full rounded-full border border-border bg-background px-5 text-sm outline-none focus:border-primary" />
            <button className="font-subhead h-12 w-full rounded-full bg-primary text-sm font-medium text-primary-foreground hover:opacity-90">Create account</button>
          </form>
          <p className="font-subhead mt-8 text-center text-xs text-muted-foreground">
            Already have an account? <Link to="/auth/login" className="text-primary underline">Sign in</Link>
          </p>
        </div>
      </div>
    </MarketingLayout>
  );
}
