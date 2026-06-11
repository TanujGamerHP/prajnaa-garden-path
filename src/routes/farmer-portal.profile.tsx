import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Loader2, Save, Upload, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useFarmerProfile, farmerKey } from "@/lib/farmer/use-farmer";
import { useAuth } from "@/hooks/use-auth";
import { compressImage } from "@/lib/image-compress";
import { fileToBase64 } from "@/lib/file-to-base64";

export const Route = createFileRoute("/farmer-portal/profile")({ component: ProfilePage });

function ProfilePage() {
  const { user } = useAuth();
  const { data: farmer } = useFarmerProfile();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    headline: "",
    story: "",
    crops: "",
    farming_method: "natural",
    portrait_url: "",
    cover_image_url: "",
  });

  const [uploadingPortrait, setUploadingPortrait] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const handlePortraitUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB");
      return;
    }
    setUploadingPortrait(true);
    try {
      const compressedFile = await compressImage(file);
      const base64Url = await fileToBase64(compressedFile);
      setForm((prev) => ({ ...prev, portrait_url: base64Url }));
      toast.success("Portrait photo uploaded successfully");
    } catch (err: any) {
      toast.error(err?.message ?? "Upload failed");
    } finally {
      setUploadingPortrait(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB");
      return;
    }
    setUploadingCover(true);
    try {
      const compressedFile = await compressImage(file);
      const base64Url = await fileToBase64(compressedFile);
      setForm((prev) => ({ ...prev, cover_image_url: base64Url }));
      toast.success("Cover image uploaded successfully");
    } catch (err: any) {
      toast.error(err?.message ?? "Upload failed");
    } finally {
      setUploadingCover(false);
    }
  };

  const handleRemovePortrait = () => {
    setForm((prev) => ({ ...prev, portrait_url: "" }));
  };

  const handleRemoveCover = () => {
    setForm((prev) => ({ ...prev, cover_image_url: "" }));
  };

  useEffect(() => {
    if (farmer)
      setForm({
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
      const { error } = await supabase
        .from("farmer_profiles")
        .update({
          headline: form.headline.trim(),
          story: form.story.trim(),
          crops: form.crops
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          farming_method: form.farming_method,
          portrait_url: form.portrait_url.trim() || null,
          cover_image_url: form.cover_image_url.trim() || null,
        })
        .eq("id", farmer.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Story page saved");
      qc.invalidateQueries({ queryKey: farmerKey(user?.id) });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });

  if (!farmer) return null;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="font-display text-2xl font-semibold">Your story page</h2>
        <p className="text-sm text-muted-foreground">
          This is what customers see on your public farmer page.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          saveMut.mutate();
        }}
        className="space-y-4 rounded-2xl border border-border bg-background p-6"
      >
        <Field
          label="Headline"
          value={form.headline}
          onChange={(e) => setForm({ ...form, headline: e.target.value })}
        />
        <label className="block">
          <span className="font-subhead text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            Your story
          </span>
          <textarea
            rows={8}
            value={form.story}
            onChange={(e) => setForm({ ...form, story: e.target.value })}
            className="font-subhead mt-1.5 w-full rounded-xl border border-border bg-background p-3.5 text-sm outline-none focus:border-primary"
          />
        </label>
        <Field
          label="Crops (comma separated)"
          value={form.crops}
          onChange={(e) => setForm({ ...form, crops: e.target.value })}
        />
        <label className="block">
          <span className="font-subhead text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            Farming method
          </span>
          <select
            value={form.farming_method}
            onChange={(e) => setForm({ ...form, farming_method: e.target.value })}
            className="font-subhead mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3.5 text-sm capitalize"
          >
            {["organic", "natural", "regenerative", "traditional"].map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </label>
        {/* Media Upload Section */}
        <div className="grid gap-6 md:grid-cols-2 border border-dashed border-border rounded-2xl p-5 bg-secondary/15 my-4">
          {/* Portrait Photo Upload */}
          <div className="space-y-2 flex flex-col items-center">
            <span className="font-subhead text-[10px] uppercase tracking-[0.14em] text-muted-foreground block text-center w-full">
              Portrait Photo (Public Profile)
            </span>
            {form.portrait_url ? (
              <div className="relative group h-32 w-32 rounded-full overflow-hidden border border-border">
                <img
                  src={form.portrait_url}
                  alt="Portrait"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    type="button"
                    onClick={handleRemovePortrait}
                    className="rounded-full bg-destructive p-2 text-destructive-foreground hover:bg-destructive/90 transition-transform hover:scale-105"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-32 w-32 rounded-full border-2 border-dashed border-border hover:border-primary cursor-pointer transition-colors bg-background">
                {uploadingPortrait ? (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <Upload className="h-4 w-4 text-muted-foreground" />
                    <span className="mt-1.5 text-[10px] font-medium text-muted-foreground text-center px-2">
                      Upload Portrait
                    </span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePortraitUpload}
                  className="hidden"
                  disabled={uploadingPortrait || uploadingCover}
                />
              </label>
            )}
          </div>

          {/* Cover Photo Upload */}
          <div className="space-y-2 flex flex-col justify-between">
            <div>
              <span className="font-subhead text-[10px] uppercase tracking-[0.14em] text-muted-foreground block mb-2">
                Cover Banner Photo
              </span>
            </div>
            {form.cover_image_url ? (
              <div className="relative group h-32 w-full rounded-2xl overflow-hidden border border-border">
                <img
                  src={form.cover_image_url}
                  alt="Cover Banner"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    type="button"
                    onClick={handleRemoveCover}
                    className="rounded-full bg-destructive p-2 text-destructive-foreground hover:bg-destructive/90 transition-transform hover:scale-105"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-32 w-full rounded-2xl border-2 border-dashed border-border hover:border-primary cursor-pointer transition-colors bg-background">
                {uploadingCover ? (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <Upload className="h-4 w-4 text-muted-foreground" />
                    <span className="mt-1.5 text-[10px] font-medium text-muted-foreground">
                      Upload Cover Banner
                    </span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  className="hidden"
                  disabled={uploadingPortrait || uploadingCover}
                />
              </label>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-muted-foreground">
            Public URL:{" "}
            <code className="text-foreground">/farmer/{farmer.slug ?? "your-farm"}</code>
          </p>
          <button
            type="submit"
            disabled={saveMut.isPending}
            className="font-subhead inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {saveMut.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}{" "}
            Save
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block">
      <span className="font-subhead text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </span>
      <input
        {...rest}
        className="font-subhead mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3.5 text-sm outline-none focus:border-primary"
      />
    </label>
  );
}
