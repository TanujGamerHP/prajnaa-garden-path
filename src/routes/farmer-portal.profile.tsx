import { createFileRoute, Link } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import { farmerBySlug } from "@/lib/mock/farmers";

export const Route = createFileRoute("/farmer-portal/profile")({
  component: FarmerProfile,
});

function FarmerProfile() {
  const f = farmerBySlug("asha-patel")!;
  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-semibold">Story page</h2>
          <p className="mt-1 text-sm text-muted-foreground">This is what customers see on your public farmer page.</p>
        </div>
        <Link to="/farmer/$slug" params={{ slug: f.slug }} className="font-subhead inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-2 text-xs hover:bg-secondary">
          View public page <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-background p-5 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Farmer name" defaultValue={f.name} />
            <Field label="Years of experience" type="number" defaultValue={f.yearsExperience} />
            <Field label="Village" defaultValue={f.village} />
            <Field label="State" defaultValue={f.state} />
            <Field label="Farming method" defaultValue={f.method} className="sm:col-span-2" />
            <label className="block sm:col-span-2">
              <span className="font-subhead text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Short story (preview)</span>
              <textarea defaultValue={f.storyPreview} rows={2} className="font-subhead mt-1.5 w-full rounded-xl border border-border bg-background p-3.5 text-sm outline-none focus:border-primary" />
            </label>
            <label className="block sm:col-span-2">
              <span className="font-subhead text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Full story</span>
              <textarea defaultValue={f.story} rows={6} className="font-subhead mt-1.5 w-full rounded-xl border border-border bg-background p-3.5 text-sm outline-none focus:border-primary" />
            </label>
          </div>
          <button className="font-subhead mt-6 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90">Save changes</button>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-background p-5">
            <p className="font-subhead text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Profile photo</p>
            <img src={f.image} alt={f.name} className="mt-3 aspect-[4/5] w-full rounded-xl object-cover" />
            <button className="font-subhead mt-3 w-full rounded-full border border-border bg-background py-2 text-xs hover:bg-secondary">Upload new</button>
          </div>
          <div className="rounded-2xl border border-border bg-background p-5">
            <p className="font-subhead text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Documents</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="flex items-center justify-between"><span>FSSAI License</span><span className="font-subhead rounded-full bg-success/15 px-2 py-0.5 text-[11px] text-success">Verified</span></li>
              <li className="flex items-center justify-between"><span>Aadhaar (KYC)</span><span className="font-subhead rounded-full bg-success/15 px-2 py-0.5 text-[11px] text-success">Verified</span></li>
              <li className="flex items-center justify-between"><span>Bank details</span><span className="font-subhead rounded-full bg-success/15 px-2 py-0.5 text-[11px] text-success">Verified</span></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, className = "", ...rest }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="font-subhead text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
      <input {...rest} className="font-subhead mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3.5 text-sm outline-none focus:border-primary" />
    </label>
  );
}
