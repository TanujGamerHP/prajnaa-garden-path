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
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { slugify } from "@/lib/farmer/use-farmer";

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
    setFarmName("");
    setVillage("");
    setDistrict("");
    setState("");
    setPincode("");
    setFarmSize("");
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
    setFarmName(f.farm_name || "");
    setVillage(f.village || "");
    setDistrict(f.district || "");
    setState(f.state || "");
    setPincode(f.pincode || "");
    setFarmSize(f.farm_size_acres?.toString() || "");
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
        farm_name: farmName.trim(),
        slug: slugify(farmName),
        village: village.trim(),
        district: district.trim() || null,
        state: state.trim(),
        pincode: pincode.trim() || null,
        farm_size_acres: farmSize ? Number(farmSize) : null,
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
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground">Farm Size (acres)</label>
                    <input
                      type="text"
                      value={farmSize}
                      onChange={(e) => setFarmSize(e.target.value)}
                      className="font-subhead mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground">Years Farming</label>
                    <input
                      type="number"
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
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-xl font-semibold text-foreground">{farmer.full_name}</h3>
            <p className="font-subhead text-xs text-muted-foreground">
              {farmer.farm_name} · {farmer.village}, {farmer.state}
            </p>
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
        <Row k="PIN" v={farmer.pincode} />
        <Row k="Method" v={farmer.farming_method} />
        <Row k="Farm size" v={farmer.farm_size_acres ? `${farmer.farm_size_acres} acres` : "—"} />
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
        <Row k="UPI" v={farmer.upi_id} />
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
