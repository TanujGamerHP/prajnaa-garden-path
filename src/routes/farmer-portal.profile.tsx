import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useFarmerProfile, farmerKey } from "@/lib/farmer/use-farmer";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/farmer-portal/profile")({ component: ProfilePage });

function ProfilePage() {
  const { user } = useAuth();
  const { data: farmer } = useFarmerProfile();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    headline: "", story: "", crops: "", farming_method: "natural",
    portrait_url: "", cover_image_url: "",
  });

  useEffect(() => {
    if (farmer) setForm({
      headline: farmer.headline ?? "",
      story: farmer.story ?? "",
      crops: (farmer.crops ?? []).join(", "),
      farming_method: farmer.farming_method ?? "natural",
      portrait_url: farmer.portrait_url ?? "",
      cover_image_url: farmer.cover_image_url ?? "",
    });
  }, [farmer]);

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!farmer) return;
      const { error } = await supabase.from("farmer_profiles").update({
        headline: form.headline.trim(),
        story: form.story.trim(),
        crops: form.crops.split(",").map((s) => s.trim()).filter(Boolean),
        farming_method: form.farming_method,
        portrait_url: form.portrait_url.trim() || null,
        cover_image_url: form.cover_image_url.trim() || null,
      }).eq("id", farmer.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Story page saved"); qc.invalidateQueries({ queryKey: farmerKey(user?.id) }); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });

  if (!farmer) return null;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="font-display text-2xl font-semibold">Your story page</h2>
        <p className="text-sm text-muted-foreground">This is what customers see on your public farmer page.</p>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); saveMut.mutate(); }} className="space-y-4 rounded-2xl border border-border bg-background p-6">
        <Field label="Headline" value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} />
        <label className="block">
          <span className="font-subhead text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Your story</span>
          <textarea rows={8} value={form.story} onChange={(e) => setForm({ ...form, story: e.target.value })} className="font-subhead mt-1.5 w-full rounded-xl border border-border bg-background p-3.5 text-sm outline-none focus:border-primary" />
        </label>
        <Field label="Crops (comma separated)" value={form.crops} onChange={(e) => setForm({ ...form, crops: e.target.value })} />
        <label className="block">
          <span className="font-subhead text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Farming method</span>
          <select value={form.farming_method} onChange={(e) => setForm({ ...form, farming_method: e.target.value })} className="font-subhead mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3.5 text-sm capitalize">
            {["organic","natural","regenerative","traditional"].map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </label>
        <Field label="Portrait image URL" value={form.portrait_url} onChange={(e) => setForm({ ...form, portrait_url: e.target.value })} />
        <Field label="Cover image URL" value={form.cover_image_url} onChange={(e) => setForm({ ...form, cover_image_url: e.target.value })} />

        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-muted-foreground">Public URL: <code className="text-foreground">/farmer/{farmer.slug ?? "your-farm"}</code></p>
          <button type="submit" disabled={saveMut.isPending} className="font-subhead inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50">
            {saveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, ...rest }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block">
      <span className="font-subhead text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
      <input {...rest} className="font-subhead mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3.5 text-sm outline-none focus:border-primary" />
    </label>
  );
}
