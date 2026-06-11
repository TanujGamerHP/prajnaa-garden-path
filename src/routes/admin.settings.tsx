import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Shield, ShieldOff, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/admin/settings")({ component: AdminSettings });

function AdminSettings() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const { data: admins = [], isLoading } = useQuery({
    queryKey: ["admin-list"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("list_admins");
      if (error) throw error;
      return (data as { user_id: string; email: string; created_at: string }[]) ?? [];
    },
  });

  const promote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    try {
      const { error } = await supabase.rpc("promote_user_to_admin", { target_email: email.trim() });
      if (error) throw error;
      toast.success(`${email} promoted to admin`);
      setEmail("");
      qc.invalidateQueries({ queryKey: ["admin-list"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Could not promote");
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (uid: string, em: string) => {
    if (uid === user?.id && !confirm("You are about to remove your own admin access. Continue?"))
      return;
    if (!confirm(`Remove admin access from ${em}?`)) return;
    const { error } = await supabase.rpc("revoke_admin", { target_user_id: uid });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Admin removed");
    qc.invalidateQueries({ queryKey: ["admin-list"] });
    qc.invalidateQueries({ queryKey: ["is-admin"] });
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h2 className="font-display text-3xl font-semibold">Admin settings</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage who can access the admin panel. Admins have full control over farmers, products,
          settlements, and customer data.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-background p-6">
        <h3 className="font-display text-lg font-semibold">Grant admin access</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          The user must have signed up at least once. Enter the email they registered with.
        </p>
        <form onSubmit={promote} className="mt-4 flex flex-wrap gap-2">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="person@example.com"
            className="font-subhead h-11 flex-1 min-w-64 rounded-full border border-border bg-background px-4 text-sm outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={busy}
            className="font-subhead inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            Promote to admin
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-border bg-background">
        <div className="flex items-center gap-2 border-b border-border px-6 py-4">
          <Shield className="h-4 w-4 text-primary" />
          <h3 className="font-display text-lg font-semibold">Current admins ({admins.length})</h3>
        </div>
        {isLoading ? (
          <div className="grid place-items-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : admins.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">No admins configured.</p>
        ) : (
          <ul className="divide-y divide-border">
            {admins.map((a) => (
              <li
                key={a.user_id}
                className="flex flex-wrap items-center justify-between gap-3 px-6 py-4"
              >
                <div>
                  <p className="font-medium">{a.email}</p>
                  <p className="font-subhead text-[11px] text-muted-foreground">
                    Admin since {new Date(a.created_at).toLocaleDateString()}
                    {a.user_id === user?.id && " · You"}
                  </p>
                </div>
                <button
                  onClick={() => revoke(a.user_id, a.email)}
                  className="font-subhead inline-flex items-center gap-1.5 rounded-full border border-destructive/30 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10"
                >
                  <ShieldOff className="h-3.5 w-3.5" /> Revoke
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-warning/30 bg-warning/5 p-5 text-sm">
        <p className="font-display text-base font-semibold">Security notes</p>
        <ul className="mt-2 space-y-1 text-muted-foreground list-disc pl-5">
          <li>
            The admin URL (<code>/admin</code>) is unlisted and excluded from search engines.
          </li>
          <li>
            Only signed-in users with the admin role can access any admin page — others see an
            "Admin only" screen.
          </li>
          <li>The last remaining admin cannot be removed to prevent accidental lock-out.</li>
        </ul>
      </div>
    </div>
  );
}
