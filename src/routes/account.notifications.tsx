import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { AccountPageHeader } from "@/components/account/page-header";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/account/notifications")({
  component: NotificationsPage,
});

type Prefs = {
  user_id: string;
  order_updates_email: boolean;
  order_updates_sms: boolean;
  promotions_email: boolean;
  promotions_sms: boolean;
  newsletter: boolean;
};

const DEFAULTS: Omit<Prefs, "user_id"> = {
  order_updates_email: true,
  order_updates_sms: true,
  promotions_email: true,
  promotions_sms: false,
  newsletter: true,
};

function NotificationsPage() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<Omit<Prefs, "user_id">>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          const { user_id: _u, updated_at: _ua, ...rest } = data as Prefs & { updated_at?: string };
          setPrefs(rest as Omit<Prefs, "user_id">);
        }
        setLoading(false);
      });
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("notification_preferences")
      .upsert({ user_id: user.id, ...prefs });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Preferences saved");
  };

  const rows: { key: keyof typeof prefs; label: string; description: string }[] = [
    { key: "order_updates_email", label: "Order updates · Email", description: "Confirmations, shipping, delivery." },
    { key: "order_updates_sms", label: "Order updates · SMS", description: "Text alerts for major status changes." },
    { key: "promotions_email", label: "Promotions · Email", description: "Sales, drops, early access." },
    { key: "promotions_sms", label: "Promotions · SMS", description: "Occasional time-sensitive offers." },
    { key: "newsletter", label: "Newsletter", description: "Stories from farms, recipes, seasons." },
  ];

  if (loading) {
    return (
      <div className="grid place-items-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <AccountPageHeader
        title="Notifications"
        description="Choose how we reach you. You can change this any time."
      />
      <div className="divide-y divide-border rounded-2xl border border-border bg-card">
        {rows.map((r) => (
          <label key={r.key} className="flex items-center justify-between gap-4 px-5 py-4">
            <div>
              <p className="font-display text-sm font-medium">{r.label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{r.description}</p>
            </div>
            <Toggle
              checked={prefs[r.key]}
              onChange={(v) => setPrefs((p) => ({ ...p, [r.key]: v }))}
            />
          </label>
        ))}
      </div>
      <div className="mt-6">
        <button
          onClick={save}
          disabled={saving}
          className="font-subhead inline-flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save preferences
        </button>
      </div>
    </>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
        checked ? "bg-primary" : "bg-border"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-background shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}
