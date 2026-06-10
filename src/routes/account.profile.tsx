import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { AccountPageHeader } from "@/components/account/page-header";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

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
  phone: z
    .string()
    .trim()
    .regex(/^\+?[1-9]\d{7,14}$/u, "Use international format like +91…")
    .or(z.literal(""))
    .optional(),
  avatar_url: z.string().trim().url().or(z.literal("")).optional(),
});

function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("id, full_name, email, phone, avatar_url")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => setProfile((data as Profile) ?? null));
  }, [user]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    const fd = new FormData(e.currentTarget);
    const parsed = schema.safeParse({
      full_name: fd.get("full_name"),
      phone: fd.get("phone") || "",
      avatar_url: fd.get("avatar_url") || "",
    });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setSaving(true);
    const { data, error } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        email: user.email,
        full_name: parsed.data.full_name,
        phone: parsed.data.phone || null,
        avatar_url: parsed.data.avatar_url || null,
      })
      .select("id, full_name, email, phone, avatar_url")
      .single();
    setSaving(false);
    if (error) return toast.error(error.message);
    setProfile(data as Profile);
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
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="h-16 w-16 rounded-full object-cover" />
          ) : (
            (profile?.full_name || user?.email || "?").slice(0, 1).toUpperCase()
          )}
        </div>
        <div>
          <p className="font-display text-lg font-semibold">{profile?.full_name || "Add your name"}</p>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="mt-6 grid max-w-2xl gap-4 sm:grid-cols-2">
        <Field label="Full name">
          <input name="full_name" defaultValue={profile?.full_name ?? ""} required className="input-prj" />
        </Field>
        <Field label="Email">
          <input value={user?.email ?? ""} disabled className="input-prj opacity-70" />
        </Field>
        <Field label="Phone">
          <input name="phone" defaultValue={profile?.phone ?? ""} placeholder="+91…" className="input-prj" />
        </Field>
        <Field label="Avatar URL">
          <input
            name="avatar_url"
            defaultValue={profile?.avatar_url ?? ""}
            placeholder="https://…"
            className="input-prj"
          />
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
