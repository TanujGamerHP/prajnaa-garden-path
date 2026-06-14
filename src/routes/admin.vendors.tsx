import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  X,
  Loader2,
  FileText,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Eye,
  Plus,
  Trash2,
  Edit,
  Upload,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { slugify } from "@/lib/farmer/use-farmer";
import { compressImage } from "@/lib/image-compress";
import { fileToBase64 } from "@/lib/file-to-base64";

export const Route = createFileRoute("/admin/vendors")({ component: AdminVendors });

type Tab = "pending" | "approved" | "rejected" | "draft" | "suspended";

function AdminVendors() {
  const [tab, setTab] = useState<Tab>("pending");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const qc = useQueryClient();

  // Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [editFarmer, setEditFarmer] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  // Form Fields State
  const [linkUserId, setLinkUserId] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [aadhaarLast4, setAadhaarLast4] = useState("");
  const [panNumber, setPanNumber] = useState("");
  const [farmName, setFarmName] = useState("");
  const [village, setVillage] = useState("");
  const [district, setDistrict] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [farmSize, setFarmSize] = useState("");
  const [yearsFarming, setYearsFarming] = useState("");
  const [farmingMethod, setFarmingMethod] = useState("organic");
  const [crops, setCrops] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankIfsc, setBankIfsc] = useState("");
  const [upiId, setUpiId] = useState("");
  const [headline, setHeadline] = useState("");
  const [story, setStory] = useState("");
  const [portraitUrl, setPortraitUrl] = useState("");
  const [kishanPehchanPatra, setKishanPehchanPatra] = useState("");
  const [landAreaUnit, setLandAreaUnit] = useState("acres");
  const [khasraNumbers, setKhasraNumbers] = useState("");
  const [cultivatedArea, setCultivatedArea] = useState("");
  const [cultivatorType, setCultivatorType] = useState("Owner");
  const [uploadingPortrait, setUploadingPortrait] = useState(false);
  const [farmerStatus, setFarmerStatus] = useState<Tab>("approved");

  // Fetch all users list
  const { data: usersList = [] } = useQuery({
    queryKey: ["admin-users-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone");
      if (error) throw error;
      return data ?? [];
    },
  });

  // Fetch existing farmer profiles to filter
  const { data: allFarmerProfiles = [] } = useQuery({
    queryKey: ["admin-all-farmer-profiles-ids"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("farmer_profiles")
        .select("user_id");
      if (error) throw error;
      return data ?? [];
    },
  });

  const existingFarmerUserIds = new Set(allFarmerProfiles.map((f: any) => f.user_id));
  const eligibleUsers = usersList.filter(
    (u: any) => !existingFarmerUserIds.has(u.id) || (editFarmer && u.id === editFarmer.user_id)
  );

  const { data: farmers = [], isLoading } = useQuery({
    queryKey: ["admin-farmers", tab],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("farmer_profiles")
        .select("*")
        .eq("status", tab)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: counts } = useQuery({
    queryKey: ["admin-farmer-counts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("farmer_profiles").select("status");
      if (error) throw error;
      const out: Record<string, number> = {};
      (data ?? []).forEach((r: any) => {
        out[r.status] = (out[r.status] ?? 0) + 1;
      });
      return out;
    },
  });

  const selected = farmers.find((f: any) => f.id === selectedId);

  const openAdd = () => {
    setEditFarmer(null);
    setLinkUserId("");
    setFullName("");
    setPhone("");
    setEmail("");
    setAadhaarLast4("");
    setPanNumber("");
    setPortraitUrl("");
    setKishanPehchanPatra("");
    setFarmName("");
    setVillage("");
    setDistrict("");
    setState("");
    setPincode("");
    setFarmSize("");
    setLandAreaUnit("acres");
    setKhasraNumbers("");
    setCultivatedArea("");
    setCultivatorType("Owner");
    setYearsFarming("");
    setFarmingMethod("organic");
    setCrops("");
    setBankName("");
    setBankAccountName("");
    setBankAccountNumber("");
    setBankIfsc("");
    setUpiId("");
    setHeadline("");
    setStory("");
    setFarmerStatus("approved");
    setIsOpen(true);
  };

  const openEdit = (f: any) => {
    setEditFarmer(f);
    setLinkUserId(f.user_id);
    setFullName(f.full_name || "");
    setPhone(f.phone || "");
    setEmail(f.email || "");
    setAadhaarLast4(f.aadhaar_last4 || "");
    setPanNumber(f.pan_number || "");
    setPortraitUrl(f.portrait_url || "");
    setKishanPehchanPatra(f.kishan_pehchan_patra || "");
    setFarmName(f.farm_name || "");
    setVillage(f.village || "");
    setDistrict(f.district || "");
    setState(f.state || "");
    setPincode(f.pincode || "");
    setFarmSize(f.farm_size_acres?.toString() || "");
    setLandAreaUnit(f.land_area_unit || "acres");
    setKhasraNumbers(f.khasra_numbers || "");
    setCultivatedArea(f.cultivated_area?.toString() || "");
    setCultivatorType(f.cultivator_type || "Owner");
    setYearsFarming(f.years_farming?.toString() || "");
    setFarmingMethod(f.farming_method || "organic");
    setCrops((f.crops ?? []).join(", "));
    setBankName(f.bank_name || "");
    setBankAccountName(f.bank_account_name || "");
    setBankAccountNumber(f.bank_account_number || "");
    setBankIfsc(f.bank_ifsc || "");
    setUpiId(f.upi_id || "");
    setHeadline(f.headline || "");
    setStory(f.story || "");
    setFarmerStatus(f.status || "approved");
    setIsOpen(true);
  };

  const handleAdminPortraitUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setPortraitUrl(base64Url);
      toast.success("Profile picture uploaded successfully");
    } catch (err: any) {
      toast.error(err?.message ?? "Upload failed");
    } finally {
      setUploadingPortrait(false);
    }
  };

  const handleAdminRemovePortrait = () => {
    setPortraitUrl("");
  };

  const deleteFarmer = async (farmer: any) => {
    if (
      !confirm(
        `Are you sure you want to delete ${farmer.full_name}? This will permanently remove their products, payouts, KYC documents, and clear their farmer role. This action is irreversible.`
      )
    ) {
      return;
    }

    try {
      // 1. Delete associated products
      await supabase.from("farmer_products").delete().eq("farmer_id", farmer.id);

      // 2. Delete associated documents
      await supabase.from("farmer_documents").delete().eq("farmer_id", farmer.id);

      // 3. Delete associated payouts
      await supabase.from("farmer_payouts").delete().eq("farmer_id", farmer.id);

      // 4. Remove farmer role from user_roles
      await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", farmer.user_id)
        .eq("role", "farmer");

      // 5. Delete farmer profile
      const { error } = await supabase.from("farmer_profiles").delete().eq("id", farmer.id);
      if (error) throw error;

      toast.success("Farmer profile deleted successfully");
      setSelectedId(null);
      qc.invalidateQueries({ queryKey: ["admin-farmers"] });
      qc.invalidateQueries({ queryKey: ["admin-farmer-counts"] });
      qc.invalidateQueries({ queryKey: ["admin-all-farmer-profiles-ids"] });
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to delete farmer");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim() || !farmName.trim() || !village.trim() || !state.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setSaving(true);
    try {
      const targetUserId = editFarmer ? editFarmer.user_id : (linkUserId || crypto.randomUUID());

      // If registering a brand new user
      if (!editFarmer && !linkUserId) {
        const { error: profileErr } = await supabase.from("profiles").insert({
          id: targetUserId,
          full_name: fullName.trim(),
          email: email.trim() || null,
          phone: phone.trim() || null,
        });
        if (profileErr) throw profileErr;
      } else {
        // Update user profile record to keep aligned
        await supabase
          .from("profiles")
          .update({
            full_name: fullName.trim(),
            email: email.trim() || null,
            phone: phone.trim() || null,
          })
          .eq("id", targetUserId);
      }

      // Assign role if not exists
      await supabase
        .from("user_roles")
        .insert({ user_id: targetUserId, role: "farmer" })
        .then(() => {}, () => {});

      const payload = {
        user_id: targetUserId,
        full_name: fullName.trim(),
        phone: phone.trim(),
        email: email.trim() || null,
        aadhaar_last4: aadhaarLast4.trim() || null,
        pan_number: panNumber.toUpperCase().trim() || null,
        portrait_url: portraitUrl.trim() || null,
        kishan_pehchan_patra: kishanPehchanPatra.trim(),
        farm_name: farmName.trim(),
        slug: slugify(farmName),
        village: village.trim(),
        district: district.trim() || null,
        state: state.trim(),
        pincode: pincode.trim() || null,
        farm_size_acres: farmSize ? Number(farmSize) : null,
        land_area_unit: landAreaUnit,
        khasra_numbers: khasraNumbers.trim(),
        cultivated_area: cultivatedArea ? Number(cultivatedArea) : null,
        cultivator_type: cultivatorType,
        years_farming: yearsFarming ? parseInt(yearsFarming, 10) : null,
        farming_method: farmingMethod,
        crops: crops
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean),
        bank_name: bankName.trim() || null,
        bank_account_name: bankAccountName.trim() || null,
        bank_account_number: bankAccountNumber.trim() || null,
        bank_ifsc: bankIfsc.toUpperCase().trim() || null,
        upi_id: upiId.trim() || null,
        headline: headline.trim() || null,
        story: story.trim() || null,
        status: farmerStatus,
        approved_at: farmerStatus === "approved" ? new Date().toISOString() : null,
      };

      let error;
      if (editFarmer) {
        const { error: err } = await supabase
          .from("farmer_profiles")
          .update(payload)
          .eq("id", editFarmer.id);
        error = err;
      } else {
        const { error: err } = await supabase.from("farmer_profiles").insert(payload);
        error = err;
      }

      if (error) throw error;

      toast.success(editFarmer ? "Farmer profile updated" : "Farmer registered successfully");
      setIsOpen(false);
      setEditFarmer(null);
      
      qc.invalidateQueries({ queryKey: ["admin-farmers"] });
      qc.invalidateQueries({ queryKey: ["admin-farmer-counts"] });
      qc.invalidateQueries({ queryKey: ["admin-all-farmer-profiles-ids"] });
      qc.invalidateQueries({ queryKey: ["admin-users-list"] });
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to save farmer");
    } finally {
      setSaving(false);
    }
  };

  const handleLinkUserChange = (uid: string) => {
    setLinkUserId(uid);
    if (uid) {
      const selectedUser = eligibleUsers.find((u: any) => u.id === uid);
      if (selectedUser) {
        setFullName(selectedUser.full_name || "");
        setEmail(selectedUser.email || "");
        setPhone(selectedUser.phone || "");
      }
    } else {
      setFullName("");
      setEmail("");
      setPhone("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-semibold">Farmer approvals</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Review registrations, inspect KYC documents, and approve or reject vendors.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="font-subhead inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Register Farmer
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["pending", "approved", "rejected", "draft", "suspended"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => {
              setTab(t);
              setSelectedId(null);
            }}
            className={`font-subhead inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs capitalize transition ${
              tab === t
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-background hover:bg-secondary"
            }`}
          >
            {t}
            <span
              className={`rounded-full px-1.5 text-[10px] ${tab === t ? "bg-primary-foreground/20" : "bg-secondary"}`}
            >
              {counts?.[t] ?? 0}
            </span>
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-background">
          {isLoading ? (
            <div className="grid place-items-center py-16">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : farmers.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">No {tab} farmers.</p>
          ) : (
            <ul className="divide-y divide-border">
              {farmers.map((f: any) => (
                <li key={f.id}>
                  <button
                    onClick={() => setSelectedId(f.id)}
                    className={`w-full px-5 py-4 text-left transition hover:bg-secondary/50 ${selectedId === f.id ? "bg-secondary/60" : ""}`}
                  >
                    <p className="font-display text-sm font-semibold">{f.full_name}</p>
                    <p className="font-subhead mt-0.5 text-xs text-muted-foreground">
                      {f.farm_name} · {f.village}, {f.state}
                    </p>
                    <p className="font-subhead mt-1 text-[11px] text-muted-foreground">
                      Applied {new Date(f.created_at).toLocaleDateString()}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="lg:col-span-3">
          {selected ? (
            <FarmerDetail
              farmer={selected}
              onChange={() => {
                qc.invalidateQueries({ queryKey: ["admin-farmers"] });
                qc.invalidateQueries({ queryKey: ["admin-farmer-counts"] });
                setSelectedId(null);
              }}
              onEdit={openEdit}
              onDelete={deleteFarmer}
            />
          ) : (
            <div className="grid h-full min-h-64 place-items-center rounded-2xl border border-dashed border-border p-8 text-center">
              <p className="text-sm text-muted-foreground">
                Select a farmer to review their application.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Register/Edit Farmer Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-2xl border border-border bg-background shadow-2xl animate-scale-up my-8">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h3 className="font-display text-lg font-semibold text-foreground">
                {editFarmer ? `Edit ${editFarmer.full_name}` : "Register New Farmer"}
              </h3>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setEditFarmer(null);
                }}
                className="grid h-8 w-8 place-items-center rounded-full border border-border text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {!editFarmer && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Link to User Account
                  </label>
                  <select
                    value={linkUserId}
                    onChange={(e) => handleLinkUserChange(e.target.value)}
                    className="font-subhead mt-2 w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-primary"
                  >
                    <option value="">Create brand new user profile</option>
                    {eligibleUsers.map((u: any) => (
                      <option key={u.id} value={u.id}>
                        {u.full_name} ({u.email || u.phone || "No Contact"})
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Link this profile to an existing registered user, or create a new user profile record.
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <h4 className="font-display text-sm font-semibold border-b pb-2 text-primary">Personal Details</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="font-subhead mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground">Phone *</label>
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="font-subhead mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="font-subhead mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground">Aadhaar (Last 4 digits)</label>
                    <input
                      type="text"
                      maxLength={4}
                      value={aadhaarLast4}
                      onChange={(e) => setAadhaarLast4(e.target.value)}
                      placeholder="e.g. 1234"
                      className="font-subhead mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground">PAN Number</label>
                    <input
                      type="text"
                      value={panNumber}
                      onChange={(e) => setPanNumber(e.target.value)}
                      placeholder="e.g. ABCDE1234F"
                      className="font-subhead mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground">Kishan Pehchan Patra / Farmer ID *</label>
                    <input
                      type="text"
                      required
                      value={kishanPehchanPatra}
                      onChange={(e) => setKishanPehchanPatra(e.target.value)}
                      placeholder="e.g. HP-FARM-987654"
                      className="font-subhead mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Farmer Profile Picture *
                    </label>
                    <div className="flex items-center gap-4">
                      {portraitUrl ? (
                        <div className="relative h-16 w-16 rounded-full border border-border overflow-hidden">
                          <img src={portraitUrl} className="h-full w-full object-cover" />
                          <button
                            type="button"
                            onClick={handleAdminRemovePortrait}
                            className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 hover:opacity-100 transition duration-200 cursor-pointer"
                            title="Remove photo"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center border border-border text-muted-foreground">
                          <User className="h-6 w-6" />
                        </div>
                      )}
                      
                      <label className="flex h-9 items-center justify-center border border-dashed border-border rounded-xl cursor-pointer bg-secondary/10 px-3 text-xs hover:bg-secondary/30 transition text-muted-foreground font-subhead font-medium gap-1.5">
                        {uploadingPortrait ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <>
                            <Upload className="h-3.5 w-3.5" />
                            <span>Upload Photo</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAdminPortraitUpload}
                          disabled={uploadingPortrait}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-display text-sm font-semibold border-b pb-2 text-primary">Farm Details</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground">Farm Name *</label>
                    <input
                      type="text"
                      required
                      value={farmName}
                      onChange={(e) => setFarmName(e.target.value)}
                      className="font-subhead mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground">Village *</label>
                    <input
                      type="text"
                      required
                      value={village}
                      onChange={(e) => setVillage(e.target.value)}
                      className="font-subhead mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground">District</label>
                    <input
                      type="text"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="font-subhead mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground">State *</label>
                    <input
                      type="text"
                      required
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="font-subhead mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground">Pincode</label>
                    <input
                      type="text"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      className="font-subhead mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-muted-foreground">Total Land Area *</label>
                      <input
                        type="number"
                        step="0.1"
                        required
                        value={farmSize}
                        onChange={(e) => setFarmSize(e.target.value)}
                        className="font-subhead mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground">Unit *</label>
                      <select
                        value={landAreaUnit}
                        onChange={(e) => setLandAreaUnit(e.target.value)}
                        className="font-subhead mt-1 w-full rounded-xl border border-border bg-background px-2 py-2 text-sm outline-none focus:border-primary cursor-pointer"
                      >
                        <option value="acres">Acres</option>
                        <option value="hectares">Hectares</option>
                        <option value="bighas">Bighas</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground">Cultivated Area *</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={cultivatedArea}
                      onChange={(e) => setCultivatedArea(e.target.value)}
                      placeholder="Cultivated Area"
                      className="font-subhead mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground">Khasra Number(s) *</label>
                    <input
                      type="text"
                      required
                      value={khasraNumbers}
                      onChange={(e) => setKhasraNumbers(e.target.value)}
                      placeholder="e.g. 122/4, 125/2"
                      className="font-subhead mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground">Cultivator Type *</label>
                    <select
                      value={cultivatorType}
                      onChange={(e) => setCultivatorType(e.target.value)}
                      className="font-subhead mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary cursor-pointer"
                    >
                      <option value="Owner">Owner</option>
                      <option value="Tenant">Tenant</option>
                      <option value="Sharecropper">Sharecropper</option>
                      <option value="Leased">Leased</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground">Years Farming *</label>
                    <input
                      type="number"
                      required
                      value={yearsFarming}
                      onChange={(e) => setYearsFarming(e.target.value)}
                      className="font-subhead mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground">Farming Method</label>
                    <select
                      value={farmingMethod}
                      onChange={(e) => setFarmingMethod(e.target.value)}
                      className="font-subhead mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    >
                      <option value="organic">Organic</option>
                      <option value="natural">Natural</option>
                      <option value="regenerative">Regenerative</option>
                      <option value="traditional">Traditional</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-muted-foreground">Crops (comma-separated)</label>
                    <input
                      type="text"
                      value={crops}
                      onChange={(e) => setCrops(e.target.value)}
                      placeholder="e.g. Wheat, Basmati Rice, Mustard"
                      className="font-subhead mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-display text-sm font-semibold border-b pb-2 text-primary">Bank Details</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground">Bank Name</label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="font-subhead mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground">Account Holder Name</label>
                    <input
                      type="text"
                      value={bankAccountName}
                      onChange={(e) => setBankAccountName(e.target.value)}
                      className="font-subhead mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground">Account Number</label>
                    <input
                      type="text"
                      value={bankAccountNumber}
                      onChange={(e) => setBankAccountNumber(e.target.value)}
                      className="font-subhead mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground">IFSC Code</label>
                    <input
                      type="text"
                      value={bankIfsc}
                      onChange={(e) => setBankIfsc(e.target.value)}
                      className="font-subhead mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-muted-foreground">UPI ID</label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="e.g. farmer@upi"
                      className="font-subhead mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-display text-sm font-semibold border-b pb-2 text-primary">Public Profile & Story</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground">One-line Headline</label>
                    <input
                      type="text"
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      placeholder="e.g. Sowing natural goodness in rural Haryana"
                      className="font-subhead mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground">Story</label>
                    <textarea
                      rows={4}
                      value={story}
                      onChange={(e) => setStory(e.target.value)}
                      placeholder="Tell us about the farmer, their methods, and their values..."
                      className="font-subhead mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-display text-sm font-semibold border-b pb-2 text-primary">Status</h4>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground">Farmer Status</label>
                  <select
                    value={farmerStatus}
                    onChange={(e) => setFarmerStatus(e.target.value as Tab)}
                    className="font-subhead mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  >
                    <option value="approved">Approved</option>
                    <option value="pending">Pending Review</option>
                    <option value="draft">Draft</option>
                    <option value="suspended">Suspended</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setEditFarmer(null);
                  }}
                  className="font-subhead rounded-full border border-border px-5 py-2.5 text-xs font-medium hover:bg-secondary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="font-subhead inline-flex items-center gap-1.5 rounded-full bg-primary px-6 py-2.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 cursor-pointer"
                >
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {editFarmer ? "Save Changes" : "Register Farmer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function FarmerDetail({
  farmer,
  onChange,
  onEdit,
  onDelete,
}: {
  farmer: any;
  onChange: () => void;
  onEdit: (f: any) => void;
  onDelete: (f: any) => void;
}) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  // Product modal states
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<any | null>(null);
  const [prodName, setProdName] = useState("");
  const [prodCategory, setProdCategory] = useState("dry-fruits");
  const [prodPrice, setProdPrice] = useState("");
  const [prodUnit, setProdUnit] = useState("kg");
  const [prodStock, setProdStock] = useState("0");
  const [prodDescription, setProdDescription] = useState("");
  const [prodImages, setProdImages] = useState<string[]>([]);
  const [prodSaving, setProdSaving] = useState(false);
  const [prodUploadingImage, setProdUploadingImage] = useState(false);
  const [prodVariants, setProdVariants] = useState<{ unit: string; price: string; stock: string; image: string }[]>([]);  const [prodActiveStep, setProdActiveStep] = useState(1);

  const { data: docs = [] } = useQuery({
    queryKey: ["admin-farmer-docs", farmer.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("farmer_documents")
        .select("*")
        .eq("farmer_id", farmer.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: products = [], refetch: refetchProducts } = useQuery({
    queryKey: ["admin-farmer-products", farmer.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("farmer_products")
        .select("*")
        .eq("farmer_id", farmer.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const openAddProduct = () => {
    setEditProduct(null);
    setProdName("");
    setProdCategory("dry-fruits");
    setProdPrice("");
    setProdUnit("kg");
    setProdStock("0");
    setProdDescription("");
    setProdImages([]);
    setProdVariants([]);
    setProdActiveStep(1);
    setIsProductModalOpen(true);
  };

  const openEditProduct = (prod: any) => {
    setEditProduct(prod);
    setProdName(prod.name || "");
    setProdCategory(prod.category || "dry-fruits");
    setProdPrice(String(prod.price || ""));
    setProdUnit(prod.unit || "kg");
    setProdStock(String(prod.stock || "0"));
    setProdDescription(prod.description || "");
    setProdImages(prod.images || []);

    let parsedVariants: { unit: string; price: string; stock: string; image: string }[] = [];
    if (prod.variants && prod.variants.length > 0) {
      parsedVariants = prod.variants.map((v: any) => ({
        unit: v.unit,
        price: String(v.price),
        stock: String(v.stock || 999),
        image: v.image || "",
      }));
    } else {
      let legacyUnit = prod.unit || "500g";
      if (legacyUnit === "kg") legacyUnit = "1kg";
      if (legacyUnit === "g") legacyUnit = "500g";
      parsedVariants = [{
        unit: legacyUnit,
        price: String(prod.price || ""),
        stock: String(prod.stock || 999),
        image: "",
      }];
    }

    setProdVariants(parsedVariants);
    setProdActiveStep(1);
    setIsProductModalOpen(true);
  };;

  const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB");
      return;
    }
    setProdUploadingImage(true);
    try {
      const compressedFile = await compressImage(file);
      const base64Url = await fileToBase64(compressedFile);
      setProdImages((prev) => [...prev, base64Url]);
      toast.success("Image uploaded successfully");
    } catch (err: any) {
      toast.error(err?.message ?? "Upload failed");
    } finally {
      setProdUploadingImage(false);
    }
  };

  const handleRemoveProductImage = (index: number) => {
    setProdImages((prev) => {
      const next = [...prev];
      next[index] = "";
      while (next.length > 0 && !next[next.length - 1]) {
        next.pop();
      }
      return next;
    });
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim()) {
      toast.error("Product name is required");
      return;
    }

    if (prodVariants.length === 0) {
      toast.error("Please select at least one weight variant.");
      return;
    }
    for (let i = 0; i < prodVariants.length; i++) {
      const v = prodVariants[i];
      if (!v.price || isNaN(Number(v.price)) || Number(v.price) <= 0) {
        toast.error(`Please enter a valid price for the ${v.unit} variant.`);
        return;
      }
    }

    const firstVariant = prodVariants[0];
    const totalStock = prodVariants.reduce((sum, v) => sum + (parseInt(v.stock, 10) || 0), 0);
    const finalPrice = firstVariant.price;
    const finalStock = String(totalStock);
    const finalUnit = firstVariant.unit;

    setProdSaving(true);
    try {
      const slug = editProduct
        ? editProduct.slug
        : slugify(prodName.trim()) + "-" + Math.random().toString(36).slice(2, 6);

      const payload = {
        farmer_id: farmer.id,
        name: prodName.trim(),
        category: prodCategory,
        price: Number(finalPrice),
        stock: Number(finalStock),
        unit: finalUnit.trim(),
        description: prodDescription.trim(),
        images: prodImages,
        slug,
        status: editProduct ? editProduct.status : "published", // default to published for admin adds
        created_at: editProduct ? editProduct.created_at : new Date().toISOString(),
        variants: prodVariants.map((v) => ({
          unit: v.unit.trim(),
          price: Number(v.price),
          stock: parseInt(v.stock, 10),
          image: v.image || "",
        })),
      };

      if (editProduct) {
        const { error } = await supabase
          .from("farmer_products")
          .update(payload)
          .eq("id", editProduct.id);
        if (error) throw error;
        toast.success("Product updated successfully");
      } else {
        const { error } = await supabase.from("farmer_products").insert(payload);
        if (error) throw error;
        toast.success("Product added successfully");
      }

      setIsProductModalOpen(false);
      refetchProducts();
      qc.invalidateQueries({ queryKey: ["admin-products"] }); // Sync global admin product list too
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to save product");
    } finally {
      setProdSaving(false);
    }
  };

  const handleDeleteProduct = async (prod: any) => {
    if (!confirm(`Are you sure you want to permanently delete "${prod.name}"?`)) return;
    try {
      const { error } = await supabase.from("farmer_products").delete().eq("id", prod.id);
      if (error) throw error;
      toast.success("Product deleted successfully");
      refetchProducts();
      qc.invalidateQueries({ queryKey: ["admin-products"] }); // Sync global list
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to delete product");
    }
  };

  const toggleProductStatus = async (prod: any, status: "published" | "archived" | "draft") => {
    try {
      const { error } = await supabase.from("farmer_products").update({ status }).eq("id", prod.id);
      if (error) throw error;
      toast.success(`Product marked as ${status}`);
      refetchProducts();
      qc.invalidateQueries({ queryKey: ["admin-products"] }); // Sync global list
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to update product status");
    }
  };

  const updateStatus = async (status: "approved" | "rejected" | "suspended" | "pending") => {
    setBusy(status);
    try {
      const patch: any = { status };
      if (status === "approved") {
        patch.approved_at = new Date().toISOString();
        patch.rejection_reason = null;

        // Automatically verify all pending/submitted documents for this farmer
        const { error: docError } = await supabase
          .from("farmer_documents")
          .update({
            status: "verified",
            verified_at: new Date().toISOString(),
          })
          .eq("farmer_id", farmer.id)
          .neq("status", "verified");

        if (docError) {
          console.warn("Failed to automatically verify documents:", docError);
        }
      }
      if (status === "rejected") {
        patch.rejection_reason = reason.trim() || "Application did not meet our criteria.";
      }
      const { error } = await supabase.from("farmer_profiles").update(patch).eq("id", farmer.id);
      if (error) throw error;
      toast.success(`Farmer ${status}`);
      onChange();
    } catch (e: any) {
      toast.error(e?.message ?? "Could not update");
    } finally {
      setBusy(null);
    }
  };

  const updateDoc = async (
    id: string,
    status: "verified" | "rejected" | "pending",
    notes?: string,
  ) => {
    const patch: any = { status, notes: notes ?? null };
    if (status === "verified") patch.verified_at = new Date().toISOString();
    const { error } = await supabase.from("farmer_documents").update(patch).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Document ${status}`);
    onChange();
  };

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLabel, setPreviewLabel] = useState("");

  const viewDoc = (fileUrl: string, label: string) => {
    if (fileUrl.startsWith("data:")) {
      // Base64 data URL — show directly in modal
      setPreviewUrl(fileUrl);
      setPreviewLabel(label);
    } else {
      // Legacy path — try opening in new tab
      window.open(fileUrl, "_blank");
    }
  };

  const verifiedCount = docs.filter((d: any) => d.status === "verified").length;

  return (
    <>
    <div className="rounded-2xl border border-border bg-background">
      <div className="border-b border-border px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            {farmer.portrait_url ? (
              <img
                src={farmer.portrait_url}
                alt={farmer.full_name}
                className="h-14 w-14 rounded-full object-cover border-2 border-primary/20 shadow-sm"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary border border-border text-muted-foreground">
                <User className="h-6 w-6" />
              </div>
            )}
            <div>
              <h3 className="font-display text-xl font-semibold text-foreground">{farmer.full_name}</h3>
              <p className="font-subhead text-xs text-muted-foreground">
                {farmer.farm_name} · {farmer.village}, {farmer.state}
              </p>
            </div>
          </div>
          <span
            className={`font-subhead rounded-full px-3 py-1 text-xs capitalize ${
              farmer.status === "approved"
                ? "bg-success/15 text-success"
                : farmer.status === "rejected"
                  ? "bg-destructive/15 text-destructive"
                  : farmer.status === "pending"
                    ? "bg-warning/15 text-warning"
                    : "bg-secondary text-muted-foreground"
            }`}
          >
            {farmer.status}
          </span>
        </div>
      </div>

      <div className="grid gap-4 px-6 py-5 sm:grid-cols-2 text-sm">
        <Row k="Phone" v={farmer.phone} />
        <Row k="Email" v={farmer.email} />
        <Row
          k="Aadhaar (last 4)"
          v={farmer.aadhaar_last4 ? `xxxx-xxxx-${farmer.aadhaar_last4}` : "—"}
        />
        <Row k="PAN" v={farmer.pan_number} />
        <Row k="Kishan Pehchan Patra (Farmer ID)" v={farmer.kishan_pehchan_patra} />
        <Row k="PIN" v={farmer.pincode} />
        <Row k="Farming Method" v={farmer.farming_method} />
        <Row k="Cultivator Type" v={farmer.cultivator_type || "—"} />
        <Row k="Total Farm Size" v={farmer.farm_size_acres ? `${farmer.farm_size_acres} ${farmer.land_area_unit || "acres"}` : "—"} />
        <Row k="Cultivated Area" v={farmer.cultivated_area ? `${farmer.cultivated_area} ${farmer.land_area_unit || "acres"}` : "—"} />
        <Row k="Khasra Number(s)" v={farmer.khasra_numbers || "—"} />
        <Row k="Years farming" v={farmer.years_farming?.toString()} />
        <Row k="Bank" v={farmer.bank_name} />
        <Row
          k="Account"
          v={
            farmer.bank_account_number
              ? `•••• ${farmer.bank_account_number.slice(-4)} · ${farmer.bank_ifsc}`
              : "—"
          }
        />
        <Row k="UPI ID" v={farmer.upi_id} />
        <Row k="Crops" v={(farmer.crops ?? []).join(", ")} />
      </div>

      {farmer.story && (
        <div className="border-t border-border px-6 py-5">
          <p className="font-subhead text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            Story
          </p>
          <p className="mt-2 text-sm leading-relaxed">{farmer.story}</p>
        </div>
      )}

      <div className="border-t border-border px-6 py-5">
        <div className="flex items-center justify-between">
          <p className="font-subhead text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            KYC documents ({verifiedCount}/{docs.length} verified)
          </p>
        </div>
        {docs.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No documents uploaded yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {docs.map((d: any) => (
              <li
                key={d.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border p-3 text-sm"
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium capitalize">{d.doc_type.replace(/_/g, " ")}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(d.created_at).toLocaleDateString()}
                  </span>
                  <span
                    className={`font-subhead rounded-full px-2 py-0.5 text-[10px] capitalize ${
                      d.status === "verified"
                        ? "bg-success/15 text-success"
                        : d.status === "rejected"
                          ? "bg-destructive/15 text-destructive"
                          : "bg-warning/15 text-warning"
                    }`}
                  >
                    {d.status}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => viewDoc(d.file_url, d.doc_type?.replace(/_/g, " ") || d.label || "Document")}
                    className="grid h-7 w-7 place-items-center rounded-full border border-border hover:bg-secondary cursor-pointer"
                    title="View"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => updateDoc(d.id, "verified")}
                    className="grid h-7 w-7 place-items-center rounded-full border border-border text-success hover:bg-success/10 cursor-pointer"
                    title="Verify"
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      const n = prompt("Rejection note (optional):") ?? undefined;
                      updateDoc(d.id, "rejected", n || "Document unclear or invalid");
                    }}
                    className="grid h-7 w-7 place-items-center rounded-full border border-border text-destructive hover:bg-destructive/10 cursor-pointer"
                    title="Reject"
                  >
                    <ShieldAlert className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-border px-6 py-5">
        <div className="flex items-center justify-between">
          <p className="font-subhead text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            Farmer's Products ({products.length})
          </p>
          <button
            onClick={openAddProduct}
            className="font-subhead inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-[10px] font-semibold text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-3 w-3" /> Add Product
          </button>
        </div>

        {products.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No products listed by this farmer yet.</p>
        ) : (
          <ul className="mt-3 space-y-2.5">
            {products.map((p: any) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3 text-sm"
              >
                <div className="flex items-center gap-3">
                  {p.images?.[0] ? (
                    <img
                      src={p.images[0]}
                      alt={p.name}
                      className="h-10 w-10 rounded-lg object-cover border border-border"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center border border-border">
                      <span className="text-[9px] text-muted-foreground">No img</span>
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-foreground">{p.name}</p>
                    <p className="font-subhead text-[10px] text-muted-foreground capitalize">
                      {p.category.replace(/-/g, " ")} · ₹{p.price}/{p.unit} · {p.stock} {p.unit} in stock
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`font-subhead rounded-full px-2 py-0.5 text-[9px] capitalize ${
                      p.status === "published"
                        ? "bg-success/15 text-success"
                        : p.status === "draft"
                          ? "bg-warning/15 text-warning"
                          : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {p.status}
                  </span>
                  
                  {p.status !== "published" && (
                    <button
                      onClick={() => toggleProductStatus(p, "published")}
                      className="font-subhead rounded-full border border-border px-2 py-0.5 text-[9px] hover:bg-secondary cursor-pointer"
                      title="Publish Product"
                    >
                      Publish
                    </button>
                  )}
                  {p.status === "published" && (
                    <button
                      onClick={() => toggleProductStatus(p, "archived")}
                      className="font-subhead rounded-full border border-border px-2 py-0.5 text-[9px] hover:bg-secondary cursor-pointer"
                      title="Archive Product"
                    >
                      Archive
                    </button>
                  )}

                  <button
                    onClick={() => openEditProduct(p)}
                    className="grid h-7 w-7 place-items-center rounded-full border border-border hover:bg-secondary text-muted-foreground hover:text-foreground cursor-pointer"
                    title="Edit Details"
                  >
                    <Edit className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(p)}
                    className="grid h-7 w-7 place-items-center rounded-full border border-border text-destructive hover:bg-destructive/10 cursor-pointer"
                    title="Delete Product"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-border px-6 py-5">
        <label className="block">
          <span className="font-subhead text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            Rejection reason (if rejecting)
          </span>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            className="font-subhead mt-1.5 w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-primary"
            placeholder="Bank details could not be verified..."
          />
        </label>

        <div className="mt-4 flex flex-wrap gap-2">
          {farmer.status !== "approved" && (
            <button
              disabled={busy !== null}
              onClick={() => updateStatus("approved")}
              className="font-subhead inline-flex items-center gap-1.5 rounded-full bg-success px-5 py-2.5 text-sm font-medium text-success-foreground disabled:opacity-50 cursor-pointer"
            >
              {busy === "approved" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              Approve farmer
            </button>
          )}
          {farmer.status !== "rejected" && (
            <button
              disabled={busy !== null}
              onClick={() => updateStatus("rejected")}
              className="font-subhead inline-flex items-center gap-1.5 rounded-full border border-destructive bg-destructive/10 px-5 py-2.5 text-sm font-medium text-destructive disabled:opacity-50 cursor-pointer"
            >
              {busy === "rejected" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <X className="h-3.5 w-3.5" />
              )}
              Reject
            </button>
          )}
          {farmer.status === "approved" && (
            <button
              disabled={busy !== null}
              onClick={() => updateStatus("suspended")}
              className="font-subhead inline-flex items-center gap-1.5 rounded-full border border-border px-5 py-2.5 text-sm disabled:opacity-50 cursor-pointer"
            >
              Suspend
            </button>
          )}
          
          <button
            onClick={() => onEdit(farmer)}
            className="font-subhead inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-5 py-2.5 text-sm hover:bg-secondary cursor-pointer"
          >
            <Edit className="h-3.5 w-3.5" /> Edit Profile
          </button>
          
          <button
            onClick={() => onDelete(farmer)}
            className="font-subhead inline-flex items-center gap-1.5 rounded-full border border-destructive bg-destructive/5 px-5 py-2.5 text-sm text-destructive hover:bg-destructive/15 cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete Farmer
          </button>

          {farmer.slug && farmer.status === "approved" && (
            <a
              href={`/farmer/${farmer.slug}`}
              target="_blank"
              rel="noreferrer"
              className="font-subhead ml-auto inline-flex items-center gap-1.5 rounded-full border border-border px-5 py-2.5 text-sm hover:bg-secondary"
            >
              View public page <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>

      {/* Document Preview Modal */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setPreviewUrl(null)}
        >
          <div
            className="relative w-full max-w-3xl rounded-2xl border border-border bg-background shadow-2xl animate-scale-up overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <h3 className="font-display text-sm font-semibold capitalize">{previewLabel}</h3>
                <span className="font-subhead rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
                  KYC Document
                </span>
              </div>
              <button
                onClick={() => setPreviewUrl(null)}
                className="grid h-8 w-8 place-items-center rounded-full border border-border text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center justify-center bg-secondary/20 p-6" style={{ maxHeight: "70vh" }}>
              {previewUrl.startsWith("data:application/pdf") ? (
                <iframe
                  src={previewUrl}
                  title="Document preview"
                  className="h-[60vh] w-full rounded-xl border border-border bg-white"
                />
              ) : (
                <img
                  src={previewUrl}
                  alt={previewLabel}
                  className="max-h-[60vh] max-w-full rounded-xl border border-border object-contain shadow-lg"
                />
              )}
            </div>
            <div className="flex items-center justify-between border-t border-border px-6 py-3">
              <p className="font-subhead text-[11px] text-muted-foreground">
                Farmer: {farmer.full_name}
              </p>
              <button
                onClick={() => setPreviewUrl(null)}
                className="font-subhead inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-medium hover:bg-secondary transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Add/Edit Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-background shadow-2xl animate-scale-up my-8">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h3 className="font-display text-base font-semibold text-foreground">
                {editProduct ? `Edit Product: ${editProduct.name}` : "Add New Product"}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-full border border-border text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {(() => {
              const handleNextStep = () => {
                if (prodActiveStep === 1) {
                  if (!prodName.trim()) {
                    toast.error("Product name is required");
                    return;
                  }
                  if (prodName.trim().length < 2) {
                    toast.error("Product name must be at least 2 characters");
                    return;
                  }
                }
                if (prodActiveStep === 2) {
                  if (!prodCategory) {
                    toast.error("Category is required");
                    return;
                  }
                }
                if (prodActiveStep === 3) {
                  if (!prodImages[0]) {
                    toast.error("Main product image is required");
                    return;
                  }
                }
                setProdActiveStep((prev) => prev + 1);
              };

              const handleImageUploadStep = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > 5 * 1024 * 1024) {
                  toast.error("Image must be under 5 MB");
                  return;
                }
                setProdUploadingImage(true);
                try {
                  const compressedFile = await compressImage(file);
                  const base64Url = await fileToBase64(compressedFile);
                  setProdImages((prev) => {
                    const next = [...prev];
                    next[index] = base64Url;
                    return next;
                  });
                  toast.success("Image uploaded successfully");
                } catch (err: any) {
                  toast.error(err?.message ?? "Upload failed");
                } finally {
                  setProdUploadingImage(false);
                }
              };

              const steps = [
                { number: 1, label: "Title" },
                { number: 2, label: "Category" },
                { number: 3, label: "Images" },
                { number: 4, label: "Description" },
                { number: 5, label: "Variants" }
              ];

              return (
                <form onSubmit={handleSaveProduct} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                  {/* Stepper Progress Bar */}
                  <div className="mb-6 flex items-center justify-between border-b border-border pb-4 overflow-x-auto">
                    {steps.map((s, idx) => {
                      const isCompleted = prodActiveStep > s.number;
                      const isActive = prodActiveStep === s.number;
                      return (
                        <div key={s.number} className="flex flex-1 items-center last:flex-initial shrink-0">
                          <div className="flex items-center gap-1.5">
                            <div
                              className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition-colors ${
                                isActive
                                  ? "bg-primary text-primary-foreground font-semibold"
                                  : isCompleted
                                  ? "bg-primary/20 text-primary border border-primary/30"
                                  : "bg-secondary text-muted-foreground border border-border"
                              }`}
                            >
                              {s.number}
                            </div>
                            <span className="font-subhead text-[9px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                              {s.label}
                            </span>
                          </div>
                          {idx < steps.length - 1 && (
                            <div
                              className={`h-0.5 min-w-[1.5rem] mx-2 flex-1 transition-colors ${
                                isCompleted ? "bg-primary/50" : "bg-border"
                              }`}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Wizard Step Content */}
                  <div className="space-y-4">
                    {prodActiveStep === 1 && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Product Name / Title *
                          </label>
                          <input
                            type="text"
                            required
                            value={prodName}
                            onChange={(e) => setProdName(e.target.value)}
                            className="font-subhead mt-1.5 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                            placeholder="e.g. Organic Kashmiri Saffron"
                          />
                        </div>
                      </div>
                    )}

                    {prodActiveStep === 2 && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Category *
                          </label>
                          <select
                            value={prodCategory}
                            onChange={(e) => setProdCategory(e.target.value)}
                            className="font-subhead mt-1.5 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary capitalize cursor-pointer"
                          >
                            <option value="dry-fruits">Dry Fruits</option>
                            <option value="nuts">Nuts</option>
                            <option value="seeds">Seeds</option>
                            <option value="spices">Spices</option>
                            <option value="herbs">Herbs</option>
                            <option value="plants">Plants</option>
                            <option value="pickles">Pickles</option>
                            <option value="salts">Salts</option>
                            <option value="masalas">Masalas</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {prodActiveStep === 3 && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Product Images *
                          </label>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            Upload photos of the product. The main image is for the packaged product, and the raw image is for the produce inside.
                          </p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          {/* Main Image Upload Slot */}
                          <div className="space-y-2.5">
                            <span className="font-subhead text-[10px] uppercase tracking-[0.14em] text-muted-foreground block font-semibold">
                              Main Product Image (Packaged Product) *
                            </span>
                            {prodImages[0] ? (
                              <div className="relative group h-32 w-full rounded-xl overflow-hidden border border-border">
                                <img
                                  src={prodImages[0]}
                                  alt="Main Product"
                                  className="h-full w-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveProductImage(0)}
                                    className="rounded-full bg-destructive p-1.5 text-destructive-foreground hover:bg-destructive/90 transition-transform hover:scale-105"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <label className="flex flex-col items-center justify-center h-32 w-full rounded-xl border border-dashed border-border hover:border-primary cursor-pointer transition-colors bg-background">
                                {prodUploadingImage ? (
                                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                ) : (
                                  <>
                                    <Upload className="h-4 w-4 text-muted-foreground" />
                                    <span className="mt-1.5 text-[10px] font-medium text-muted-foreground">
                                      Upload Main Image
                                    </span>
                                  </>
                                )}
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleImageUploadStep(e, 0)}
                                  className="hidden"
                                  disabled={prodUploadingImage}
                                />
                              </label>
                            )}
                          </div>

                          {/* Raw Image Upload Slot */}
                          <div className="space-y-2.5">
                            <span className="font-subhead text-[10px] uppercase tracking-[0.14em] text-muted-foreground block font-semibold">
                              Raw Product Image (Actual Produce)
                            </span>
                            {prodImages[1] ? (
                              <div className="relative group h-32 w-full rounded-xl overflow-hidden border border-border">
                                <img
                                  src={prodImages[1]}
                                  alt="Raw Produce"
                                  className="h-full w-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveProductImage(1)}
                                    className="rounded-full bg-destructive p-1.5 text-destructive-foreground hover:bg-destructive/90 transition-transform hover:scale-105"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <label className="flex flex-col items-center justify-center h-32 w-full rounded-xl border border-dashed border-border hover:border-primary cursor-pointer transition-colors bg-background">
                                {prodUploadingImage ? (
                                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                ) : (
                                  <>
                                    <Upload className="h-4 w-4 text-muted-foreground" />
                                    <span className="mt-1.5 text-[10px] font-medium text-muted-foreground">
                                      Upload Raw Image (Optional)
                                    </span>
                                  </>
                                )}
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleImageUploadStep(e, 1)}
                                  className="hidden"
                                  disabled={prodUploadingImage}
                                />
                              </label>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {prodActiveStep === 4 && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Description
                          </label>
                          <textarea
                            value={prodDescription}
                            onChange={(e) => setProdDescription(e.target.value)}
                            rows={4}
                            className="font-subhead mt-1.5 w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-primary"
                            placeholder="Tell customers about this product, its origin, taste, health benefits..."
                          />
                        </div>
                      </div>
                    )}

                    {prodActiveStep === 5 && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Weight Variants & Pricing
                          </label>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            Select one or more weight sizes and specify their prices.
                          </p>
                        </div>

                        {/* Predefined checkboxes */}
                        <div className="flex flex-wrap gap-2 p-3 border border-dashed border-[#f0e6d2] rounded-xl bg-[#fdfbf7]">
                          {["100g", "250g", "500g", "1kg", "2kg", "5kg"].map((unit) => {
                            const isChecked = prodVariants.some((v) => v.unit === unit);
                            return (
                              <label
                                key={unit}
                                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 border text-xs font-semibold transition cursor-pointer select-none ${
                                  isChecked
                                    ? "bg-primary border-primary text-primary-foreground font-semibold"
                                    : "bg-background border-border text-foreground hover:border-muted-foreground/50 hover:bg-secondary/40"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    let updated = [...prodVariants];
                                    if (checked) {
                                      if (!updated.some((v) => v.unit === unit)) {
                                        updated.push({ unit, price: "", stock: "999", image: "" });
                                      }
                                    } else {
                                      updated = updated.filter((v) => v.unit !== unit);
                                    }
                                    const PREDEFINED_ORDER = ["100g", "250g", "500g", "1kg", "2kg", "5kg"];
                                    updated.sort((a, b) => PREDEFINED_ORDER.indexOf(a.unit) - PREDEFINED_ORDER.indexOf(b.unit));
                                    setProdVariants(updated);
                                  }}
                                  className="hidden"
                                />
                                {unit}
                              </label>
                            );
                          })}
                        </div>

                        {/* Dynamic Predefined cards */}
                        <div className="grid gap-3.5 sm:grid-cols-2 mt-3.5">
                          {prodVariants.map((vItem, idx) => (
                            <div
                              key={vItem.unit}
                              className="flex flex-col gap-2 rounded-xl border border-border bg-background p-3.5 shadow-sm text-xs"
                            >
                              <span className="font-display font-bold text-primary text-sm">
                                {vItem.unit} Variant
                              </span>
                              <div className="w-full">
                                <label className="block text-[10px] font-semibold text-muted-foreground uppercase">
                                  Price (INR)
                                </label>
                                <div className="relative mt-1 flex items-center">
                                  <span className="absolute left-2.5 text-xs text-muted-foreground">₹</span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    placeholder="e.g. 120"
                                    value={vItem.price}
                                    onChange={(e) => {
                                      const newV = [...prodVariants];
                                      if (newV[idx]) {
                                        newV[idx] = { ...newV[idx], price: e.target.value };
                                      }
                                      setProdVariants(newV);
                                    }}
                                    className="font-subhead h-9 w-full rounded-lg border border-border bg-background pl-5 pr-2.5 text-xs outline-none focus:border-primary"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Stepper Footer Buttons */}
                  <div className="border-t border-border pt-4 flex justify-between items-center">
                    {prodActiveStep > 1 ? (
                      <button
                        type="button"
                        onClick={() => setProdActiveStep(prodActiveStep - 1)}
                        className="font-subhead rounded-full border border-border px-4 py-2 text-xs font-semibold hover:bg-secondary transition"
                      >
                        Back
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsProductModalOpen(false)}
                        className="font-subhead rounded-full border border-border px-4 py-2 text-xs font-semibold hover:bg-secondary transition"
                      >
                        Cancel
                      </button>
                    )}

                    {prodActiveStep < 5 ? (
                      <button
                        type="button"
                        onClick={handleNextStep}
                        className="font-subhead rounded-full bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/95 transition"
                      >
                        Next
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={prodSaving}
                        className="font-subhead inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-55 transition cursor-pointer"
                      >
                        {prodSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        {editProduct ? "Update Product" : "Add Product"}
                      </button>
                    )}
                  </div>
                </form>
              );
            })()}
          </div>
        </div>
      )}
    </>
  );
}

function Row({ k, v }: { k: string; v: string | null | undefined }) {
  return (
    <div>
      <p className="font-subhead text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        {k}
      </p>
      <p className="mt-1 font-medium">{v || "—"}</p>
    </div>
  );
}
