import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Loader2, Save, Upload, Trash2, ShieldCheck, User } from "lucide-react";
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

  const [activeTab, setActiveTab] = useState<"story" | "land">("story");
  const [form, setForm] = useState({
    headline: "",
    story: "",
    crops: "",
    farming_method: "natural",
    portrait_url: "",
    cover_image_url: "",
    // Land & Identity Details
    kishan_pehchan_patra: "",
    farm_size_acres: "",
    land_area_unit: "acres",
    khasra_numbers: "",
    cultivated_area: "",
    cultivator_type: "Owner",
  });

  const [uploadingPortrait, setUploadingPortrait] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const handlePortraitUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      toast.error("Image must be under 15 MB");
      return;
    }
    setUploadingPortrait(true);
    try {
      const compressedFile = await compressImage(file);
      const base64Url = await fileToBase64(compressedFile);
      setForm((prev) => ({ ...prev, portrait_url: base64Url }));
      toast.success("Profile picture uploaded successfully");
    } catch (err: any) {
      toast.error(err?.message ?? "Upload failed");
    } finally {
      setUploadingPortrait(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      toast.error("Image must be under 15 MB");
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
        kishan_pehchan_patra: farmer.kishan_pehchan_patra ?? "",
        farm_size_acres: farmer.farm_size_acres?.toString() ?? "",
        land_area_unit: farmer.land_area_unit ?? "acres",
        khasra_numbers: farmer.khasra_numbers ?? "",
        cultivated_area: farmer.cultivated_area?.toString() ?? "",
        cultivator_type: farmer.cultivator_type ?? "Owner",
      });
  }, [farmer]);

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!farmer) return;
      
      // Perform validation for fields in the Land & Identity tab
      if (!form.portrait_url) {
        throw new Error("Profile picture is required.");
      }
      if (!form.kishan_pehchan_patra.trim()) {
        throw new Error("Kishan Pehchan Patra / Farmer ID is required.");
      }
      if (!form.farm_size_acres || isNaN(Number(form.farm_size_acres))) {
        throw new Error("Valid land area size is required.");
      }
      if (!form.khasra_numbers.trim()) {
        throw new Error("Khasra numbers are required.");
      }
      if (!form.cultivated_area || isNaN(Number(form.cultivated_area))) {
        throw new Error("Valid cultivated area size is required.");
      }

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
          // New credentials
          kishan_pehchan_patra: form.kishan_pehchan_patra.trim(),
          farm_size_acres: Number(form.farm_size_acres),
          land_area_unit: form.land_area_unit,
          khasra_numbers: form.khasra_numbers.trim(),
          cultivated_area: Number(form.cultivated_area),
          cultivator_type: form.cultivator_type,
        })
        .eq("id", farmer.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profile saved successfully");
      qc.invalidateQueries({ queryKey: farmerKey(user?.id) });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });

  if (!farmer) return null;

  return (
    <div className="max-w-3xl space-y-6">
      {/* Title */}
      <div>
        <h2 className="font-display text-2xl font-semibold">Farmer Profile Settings</h2>
        <p className="text-sm text-muted-foreground">
          Manage your public story presentation and upload required land and ID credentials.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          type="button"
          onClick={() => setActiveTab("story")}
          className={`font-subhead px-5 py-2.5 text-sm font-semibold border-b-2 transition ${
            activeTab === "story"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Public Story
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("land")}
          className={`font-subhead px-5 py-2.5 text-sm font-semibold border-b-2 transition flex items-center gap-1.5 ${
            activeTab === "land"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          Land & Identity Details
        </button>
      </div>

      {/* Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          saveMut.mutate();
        }}
        className="space-y-4 rounded-2xl border border-border bg-background p-6"
      >
        {activeTab === "story" ? (
          <>
            <Field
              label="Headline"
              value={form.headline}
              onChange={(e) => setForm({ ...form, headline: e.target.value })}
              placeholder="e.g. Traditional organic cultivator from Shimla valleys"
            />
            <label className="block">
              <span className="font-subhead text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                Your story
              </span>
              <textarea
                rows={8}
                value={form.story}
                onChange={(e) => setForm({ ...form, story: e.target.value })}
                placeholder="Share your farming background, techniques, and philosophy..."
                className="font-subhead mt-1.5 w-full rounded-xl border border-border bg-background p-3.5 text-sm outline-none focus:border-primary"
              />
            </label>
            <Field
              label="Crops (comma separated)"
              value={form.crops}
              onChange={(e) => setForm({ ...form, crops: e.target.value })}
              placeholder="e.g. apples, cherries, walnuts"
            />
            <label className="block">
              <span className="font-subhead text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                Farming method
              </span>
              <select
                value={form.farming_method}
                onChange={(e) => setForm({ ...form, farming_method: e.target.value })}
                className="font-subhead mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3.5 text-sm capitalize outline-none focus:border-primary cursor-pointer"
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
                  Farmer Profile Picture *
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
                  <label className="flex flex-col items-center justify-center h-32 w-32 rounded-full border-2 border-dashed border-border hover:border-primary cursor-pointer transition-colors bg-background text-muted-foreground">
                    {uploadingPortrait ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        <span className="mt-1.5 text-[9px] font-semibold text-center px-2">
                          Upload Pic
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
                  <label className="flex flex-col items-center justify-center h-32 w-full rounded-2xl border-2 border-dashed border-border hover:border-primary cursor-pointer transition-colors bg-background text-muted-foreground">
                    {uploadingCover ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        <span className="mt-1.5 text-[10px] font-semibold">
                          Upload Banner
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
          </>
        ) : (
          <div className="space-y-4">
            {/* Kishan Pehchan Patra */}
            <Field
              label="Kishan Pehchan Patra / Farmer ID *"
              value={form.kishan_pehchan_patra}
              onChange={(e) => setForm({ ...form, kishan_pehchan_patra: e.target.value })}
              placeholder="e.g. HP-FARM-987654"
            />

            {/* Land Area and Unit */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <Field
                  label="Total Land Area *"
                  type="number"
                  step="0.1"
                  value={form.farm_size_acres}
                  onChange={(e) => setForm({ ...form, farm_size_acres: e.target.value })}
                  placeholder="e.g. 5.5"
                />
              </div>
              <div>
                <label className="block">
                  <span className="font-subhead text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                    Area Unit *
                  </span>
                  <select
                    value={form.land_area_unit}
                    onChange={(e) => setForm({ ...form, land_area_unit: e.target.value })}
                    className="font-subhead mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="acres">Acres</option>
                    <option value="hectares">Hectares</option>
                    <option value="bighas">Bighas</option>
                  </select>
                </label>
              </div>
            </div>

            {/* Cultivated Area */}
            <Field
              label="Cultivated Area *"
              type="number"
              step="0.1"
              value={form.cultivated_area}
              onChange={(e) => setForm({ ...form, cultivated_area: e.target.value })}
              placeholder="Area currently under cultivation"
            />

            {/* Khasra Numbers */}
            <Field
              label="Khasra Number(s) *"
              value={form.khasra_numbers}
              onChange={(e) => setForm({ ...form, khasra_numbers: e.target.value })}
              placeholder="e.g. 122/4, 125/2 (comma-separated)"
            />

            {/* Cultivator Type */}
            <label className="block">
              <span className="font-subhead text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                Cultivator Type *
              </span>
              <select
                value={form.cultivator_type}
                onChange={(e) => setForm({ ...form, cultivator_type: e.target.value })}
                className="font-subhead mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary cursor-pointer"
              >
                {["Owner", "Tenant", "Sharecropper", "Leased"].map((ct) => (
                  <option key={ct} value={ct}>
                    {ct}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        {/* Bottom Bar / Save Button */}
        <div className="flex items-center justify-between pt-2 border-t border-border mt-6">
          <p className="text-xs text-muted-foreground">
            Public Profile URL:{" "}
            <a
              href={`/farmer/${farmer.slug}`}
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline font-mono"
            >
              /farmer/{farmer.slug ?? "your-farm"}
            </a>
          </p>
          <button
            type="submit"
            disabled={saveMut.isPending}
            className="font-subhead inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50 hover:opacity-90 transition cursor-pointer"
          >
            {saveMut.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Profile
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
