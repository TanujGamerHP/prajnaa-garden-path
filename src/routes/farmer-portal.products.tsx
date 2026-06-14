import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil, Trash2, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useFarmerProfile, slugify } from "@/lib/farmer/use-farmer";
import { compressImage } from "@/lib/image-compress";
import { fileToBase64 } from "@/lib/file-to-base64";
import { inr } from "@/lib/format";

export const Route = createFileRoute("/farmer-portal/products")({ component: ProductsPage });

const productSchema = z.object({
  name: z.string().trim().min(2).max(120),
  category: z.string().trim().min(2).max(60),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Valid price"),
  stock: z.string().regex(/^\d+$/, "Whole number"),
  unit: z.string().min(1).max(20),
  images: z.array(z.string()).optional(),
  variants: z.array(
    z.object({
      unit: z.string().min(1).max(30),
      price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Valid price"),
      stock: z.string().regex(/^\d+$/, "Whole number"),
      image: z.string().optional().or(z.literal("")),
    })
  ).optional().nullable(),
});

type FormState = z.infer<typeof productSchema>;
const empty: FormState = {
  name: "",
  category: "dry-fruits",
  description: "",
  price: "",
  stock: "0",
  unit: "kg",
  images: [],
  variants: [],
};

function ProductsPage() {
  const { data: farmer } = useFarmerProfile();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null); // 'thumbnail' | 'additional' | null
  const [activeStep, setActiveStep] = useState(1);

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number,
  ) => {
    const file = e.target.files?.[0];
    if (!file || !farmer) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB");
      return;
    }
    const typeLabel = index === 0 ? "thumbnail" : "additional";
    setUploadingImage(typeLabel);
    try {
      const compressedFile = await compressImage(file);
      const base64Url = await fileToBase64(compressedFile);

      setUploadedImages((prev) => {
        const next = [...prev];
        next[index] = base64Url;
        return next;
      });
      toast.success("Image uploaded successfully");
    } catch (err: any) {
      toast.error(err?.message ?? "Upload failed");
    } finally {
      setUploadingImage(null);
    }
  };

  const handleRemoveImage = (index: number) => {
    setUploadedImages((prev) => {
      const next = [...prev];
      next[index] = "";
      while (next.length > 0 && !next[next.length - 1]) {
        next.pop();
      }
      return next;
    });
  };

  const { data: products = [], isLoading } = useQuery({
    enabled: !!farmer?.id,
    queryKey: ["farmer-products", farmer?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("farmer_products")
        .select("*")
        .eq("farmer_id", farmer!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const upsertMut = useMutation({
    mutationFn: async (input: FormState & { id?: string }) => {
      if (!farmer) throw new Error("No farmer profile");
      const payload = {
        ...(input.id ? { id: input.id } : {}),
        farmer_id: farmer.id,
        user_id: farmer.user_id,
        name: input.name.trim(),
        slug: slugify(input.name) + "-" + Math.random().toString(36).slice(2, 6),
        category: input.category,
        description: input.description || null,
        price: Number(input.price),
        stock: parseInt(input.stock, 10),
        unit: input.unit,
        images: input.images || [],
        status: farmer.status === "approved" ? "published" : "draft",
        variants: (input.variants || []).map((v) => ({
          unit: v.unit.trim(),
          price: Number(v.price),
          stock: parseInt(v.stock, 10),
          image: v.image || "",
        })),
      } as const;
      if (input.id) {
        const { error } = await supabase.from("farmer_products").update(payload).eq("id", input.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("farmer_products").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Product updated" : "Product added");
      qc.invalidateQueries({ queryKey: ["farmer-products", farmer?.id] });
      setShowForm(false);
      setEditing(null);
      setForm(empty);
      setUploadedImages([]);
      setActiveStep(1);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("farmer_products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["farmer-products", farmer?.id] });
    },
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();

    const vList = form.variants || [];
    if (vList.length === 0) {
      toast.error("Please select at least one weight variant.");
      return;
    }
    for (let i = 0; i < vList.length; i++) {
      const v = vList[i];
      if (!v.price || isNaN(Number(v.price)) || Number(v.price) <= 0) {
        toast.error(`Please enter a valid price for the ${v.unit} variant.`);
        return;
      }
    }

    let formToValidate = { ...form };
    const firstVariant = vList[0];
    const totalStock = vList.reduce((sum, v) => sum + (parseInt(v.stock, 10) || 0), 0);
    formToValidate.price = firstVariant.price;
    formToValidate.stock = String(totalStock);
    formToValidate.unit = firstVariant.unit;

    const updatedForm = { ...formToValidate, images: uploadedImages };
    const res = productSchema.safeParse(updatedForm);
    if (!res.success) {
      const errs: Record<string, string> = {};
      res.error.issues.forEach((i) => {
        errs[i.path[0] as string] = i.message;
      });
      toast.error("Form validation failed. Please check all fields.");
      setErrors(errs);
      return;
    }

    setErrors({});
    upsertMut.mutate({ ...res.data, id: editing ?? undefined });
  };

  const startEdit = (p: any) => {
    setEditing(p.id);
    const pImages = p.images ?? [];
    setUploadedImages(pImages);

    let parsedVariants: { unit: string; price: string; stock: string; image: string }[] = [];
    if (p.variants && p.variants.length > 0) {
      parsedVariants = p.variants.map((v: any) => ({
        unit: v.unit,
        price: String(v.price),
        stock: String(v.stock || 999),
        image: v.image || "",
      }));
    } else {
      let legacyUnit = p.unit || "500g";
      if (legacyUnit === "kg") legacyUnit = "1kg";
      if (legacyUnit === "g") legacyUnit = "500g";
      parsedVariants = [{
        unit: legacyUnit,
        price: String(p.price || ""),
        stock: String(p.stock || 999),
        image: "",
      }];
    }

    setForm({
      name: p.name,
      category: p.category,
      description: p.description ?? "",
      price: String(p.price || ""),
      stock: String(p.stock || 999),
      unit: p.unit || "500g",
      images: pImages,
      variants: parsedVariants,
    });
    setShowForm(true);
    setActiveStep(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold">Products</h2>
          <p className="text-sm text-muted-foreground">List and manage your produce.</p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditing(null);
            setForm(empty);
            setUploadedImages([]);
          }}
          className="font-subhead inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          <Plus className="h-4 w-4" /> New product
        </button>
      </div>

      {showForm && (() => {
        const handleNextStep = () => {
          if (activeStep === 1) {
            if (!form.name.trim()) {
              toast.error("Product title is required");
              return;
            }
            if (form.name.trim().length < 2) {
              toast.error("Product title must be at least 2 characters");
              return;
            }
          }
          if (activeStep === 2) {
            if (!form.category) {
              toast.error("Category is required");
              return;
            }
          }
          if (activeStep === 3) {
            if (!uploadedImages[0]) {
              toast.error("Main product image is required");
              return;
            }
          }
          setActiveStep((prev) => prev + 1);
        };

        const steps = [
          { number: 1, label: "Title" },
          { number: 2, label: "Category" },
          { number: 3, label: "Images" },
          { number: 4, label: "Description" },
          { number: 5, label: "Variants" }
        ];

        return (
          <form onSubmit={submit} className="rounded-2xl border border-border bg-background p-6">
            {/* Stepper Progress Bar */}
            <div className="mb-8 flex items-center justify-between border-b border-border pb-6 overflow-x-auto">
              {steps.map((s, idx) => {
                const isCompleted = activeStep > s.number;
                const isActive = activeStep === s.number;
                return (
                  <div key={s.number} className="flex flex-1 items-center last:flex-initial shrink-0">
                    <div className="flex items-center gap-2">
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                          isActive
                            ? "bg-primary text-primary-foreground font-semibold"
                            : isCompleted
                            ? "bg-primary/20 text-primary border border-primary/30"
                            : "bg-secondary text-muted-foreground border border-border"
                        }`}
                      >
                        {s.number}
                      </div>
                      <span className="font-subhead text-[10px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                        {s.label}
                      </span>
                    </div>
                    {idx < steps.length - 1 && (
                      <div
                        className={`h-0.5 min-w-[2rem] mx-4 flex-1 transition-colors ${
                          isCompleted ? "bg-primary/50" : "bg-border"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Wizard Steps Content */}
            <div className="space-y-4">
              {activeStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-display text-base font-semibold text-foreground">
                      Step 1: Product Title
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Enter the name of your organic product. Use a clear, descriptive title.
                    </p>
                  </div>
                  <F
                    label="Product Name / Title"
                    placeholder="e.g. Premium California Almonds"
                    v={form.name}
                    on={(v) => setForm({ ...form, name: v })}
                    err={errors.name}
                  />
                </div>
              )}

              {activeStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-display text-base font-semibold text-foreground">
                      Step 2: Category
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Select the category that best fits your product.
                    </p>
                  </div>
                  <Sel
                    label="Category"
                    v={form.category}
                    on={(v) => setForm({ ...form, category: v })}
                    opts={[
                      { value: "dry-fruits", label: "Dry Fruits" },
                      { value: "nuts", label: "Nuts" },
                      { value: "seeds", label: "Seeds" },
                      { value: "spices", label: "Spices" },
                      { value: "herbs", label: "Herbs" },
                      { value: "plants", label: "Plants" },
                      { value: "pickles", label: "Pickles" },
                      { value: "salts", label: "Salts" },
                      { value: "masalas", label: "Masalas" },
                    ]}
                  />
                </div>
              )}

              {activeStep === 3 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-display text-base font-semibold text-foreground">
                      Step 3: Product Images
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Upload photos of your product to show customers the packaged product and the real farm produce inside.
                    </p>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    {/* Main Image Upload Slot */}
                    <div className="space-y-2">
                      <span className="font-subhead text-[10px] uppercase tracking-[0.14em] text-muted-foreground block font-semibold">
                        Main Product Image (Packaged Product) *
                      </span>
                      {uploadedImages[0] ? (
                        <div className="relative group h-40 w-full rounded-2xl overflow-hidden border border-border">
                          <img
                            src={uploadedImages[0]}
                            alt="Main Product"
                            className="h-full w-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(0)}
                              className="rounded-full bg-destructive p-2 text-destructive-foreground hover:bg-destructive/90 transition-transform hover:scale-105"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center h-40 w-full rounded-2xl border-2 border-dashed border-border hover:border-primary cursor-pointer transition-colors bg-background">
                          {uploadingImage === "thumbnail" ? (
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                          ) : (
                            <>
                              <Upload className="h-5 w-5 text-muted-foreground" />
                              <span className="mt-2 text-xs font-medium text-muted-foreground">
                                Upload Main Image
                              </span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, 0)}
                            className="hidden"
                            disabled={uploadingImage !== null}
                          />
                        </label>
                      )}
                    </div>

                    {/* Raw Image Upload Slot */}
                    <div className="space-y-2">
                      <span className="font-subhead text-[10px] uppercase tracking-[0.14em] text-muted-foreground block font-semibold">
                        Raw Product Image (Actual Produce)
                      </span>
                      {uploadedImages[1] ? (
                        <div className="relative group h-40 w-full rounded-2xl overflow-hidden border border-border">
                          <img
                            src={uploadedImages[1]}
                            alt="Raw Produce"
                            className="h-full w-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(1)}
                              className="rounded-full bg-destructive p-2 text-destructive-foreground hover:bg-destructive/90 transition-transform hover:scale-105"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center h-40 w-full rounded-2xl border-2 border-dashed border-border hover:border-primary cursor-pointer transition-colors bg-background">
                          {uploadingImage === "additional" ? (
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                          ) : (
                            <>
                              <Upload className="h-5 w-5 text-muted-foreground" />
                              <span className="mt-2 text-xs font-medium text-muted-foreground">
                                Upload Raw Image (Optional)
                              </span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, 1)}
                            className="hidden"
                            disabled={uploadingImage !== null}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeStep === 4 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-display text-base font-semibold text-foreground">
                      Step 4: Description
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Describe your product's flavor, origin, organic standards, health benefits, and usage.
                    </p>
                  </div>
                  <label className="block">
                    <span className="font-subhead text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold">
                      Product Description
                    </span>
                    <textarea
                      rows={5}
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      className="font-subhead mt-1.5 w-full rounded-xl border border-border bg-background p-3.5 text-sm outline-none focus:border-primary"
                      placeholder="e.g. Premium California Almonds sourced from traditional orchards..."
                    />
                  </label>
                </div>
              )}

              {activeStep === 5 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-display text-base font-semibold text-foreground">
                      Step 5: Weight Variants & Pricing
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Select one or more weight sizes and specify their prices.
                    </p>
                  </div>

                  {/* Predefined checkboxes */}
                  <div className="flex flex-wrap gap-2.5 p-4 border border-dashed border-[#f0e6d2] rounded-2xl bg-[#fdfbf7]">
                    {["100g", "250g", "500g", "1kg", "2kg", "5kg"].map((unit) => {
                      const isChecked = (form.variants || []).some((v) => v.unit === unit);
                      return (
                        <label
                          key={unit}
                          className={`flex items-center gap-2 rounded-xl px-4 py-2 border text-xs font-semibold transition cursor-pointer select-none ${
                            isChecked
                              ? "bg-primary border-primary text-primary-foreground"
                              : "bg-background border-border text-foreground hover:border-muted-foreground/50 hover:bg-secondary/40"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              let updated = [...(form.variants || [])];
                              if (checked) {
                                if (!updated.some((v) => v.unit === unit)) {
                                  updated.push({ unit, price: "", stock: "999", image: "" });
                                }
                              } else {
                                updated = updated.filter((v) => v.unit !== unit);
                              }
                              const PREDEFINED_ORDER = ["100g", "250g", "500g", "1kg", "2kg", "5kg"];
                              updated.sort((a, b) => PREDEFINED_ORDER.indexOf(a.unit) - PREDEFINED_ORDER.indexOf(b.unit));
                              setForm({ ...form, variants: updated });
                            }}
                            className="hidden"
                          />
                          {unit}
                        </label>
                      );
                    })}
                  </div>

                  {/* Predefined Dynamic Cards */}
                  <div className="grid gap-4 sm:grid-cols-2 mt-4">
                    {(form.variants || []).map((vItem, idx) => (
                      <div
                        key={vItem.unit}
                        className="flex flex-col gap-3 rounded-2xl border border-border bg-background p-4 shadow-sm"
                      >
                        <span className="font-display text-sm font-bold text-primary">
                          {vItem.unit} Variant
                        </span>
                        <div className="w-full">
                          <label className="block">
                            <span className="font-subhead text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-semibold">
                              Price (INR)
                            </span>
                            <div className="relative mt-1.5 flex items-center">
                              <span className="absolute left-3 text-sm text-muted-foreground">₹</span>
                              <input
                                type="number"
                                step="0.01"
                                placeholder="e.g. 120"
                                value={vItem.price}
                                onChange={(e) => {
                                  const newV = [...(form.variants || [])];
                                  if (newV[idx]) {
                                    newV[idx] = { ...newV[idx], price: e.target.value };
                                  }
                                  setForm({ ...form, variants: newV });
                                }}
                                className="font-subhead h-11 w-full rounded-xl border border-border bg-background pl-6 pr-3 text-sm outline-none focus:border-primary"
                              />
                            </div>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Stepper Footer Buttons */}
            <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
              {activeStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setActiveStep(activeStep - 1)}
                  className="font-subhead rounded-full border border-border px-5 py-2 text-xs font-semibold hover:bg-secondary transition-colors cursor-pointer"
                >
                  Back
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditing(null);
                  }}
                  className="font-subhead rounded-full border border-border px-5 py-2 text-xs font-semibold hover:bg-secondary/55 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              )}

              {activeStep < 5 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="font-subhead rounded-full bg-primary px-6 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/95 transition-colors cursor-pointer"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={upsertMut.isPending}
                  className="font-subhead inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50 hover:bg-primary/95 transition-colors cursor-pointer"
                >
                  {upsertMut.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editing ? "Save changes" : "Add product"}
                </button>
              )}
            </div>
          </form>
        );
      })()}

      <div className="rounded-2xl border border-border bg-background">
        {isLoading ? (
          <div className="grid place-items-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : products.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            No products yet. Click "New product" to add one.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="font-subhead text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                <th className="px-5 py-3 text-left">Product</th>
                <th className="text-left">Category</th>
                <th className="text-left">Status</th>
                <th className="text-right">Stock</th>
                <th className="text-right">Price</th>
                <th className="px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p: any) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="px-5 py-3 font-medium">{p.name}</td>
                  <td className="capitalize text-muted-foreground">{p.category}</td>
                  <td className="capitalize text-muted-foreground">{p.status}</td>
                  <td className="text-right">
                    {p.stock} {p.unit}
                  </td>
                  <td className="text-right font-medium">{inr(Number(p.price))}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="inline-flex gap-2">
                      <button
                        onClick={() => startEdit(p)}
                        className="rounded-md p-1.5 hover:bg-secondary"
                        aria-label="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("Delete this product?")) delMut.mutate(p.id);
                        }}
                        className="rounded-md p-1.5 text-destructive hover:bg-destructive/10"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function F({
  label,
  v,
  on,
  err,
  ...rest
}: {
  label: string;
  v: string;
  on: (v: string) => void;
  err?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="font-subhead text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </span>
      <input
        {...rest}
        value={v}
        onChange={(e) => on(e.target.value)}
        className={`font-subhead mt-1.5 h-11 w-full rounded-xl border bg-background px-3.5 text-sm outline-none focus:border-primary ${err ? "border-destructive" : "border-border"}`}
      />
      {err && <span className="mt-1 block text-xs text-destructive">{err}</span>}
    </label>
  );
}
function Sel({
  label,
  v,
  on,
  opts,
}: {
  label: string;
  v: string;
  on: (v: string) => void;
  opts: (string | { value: string; label: string })[];
}) {
  return (
    <label className="block">
      <span className="font-subhead text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </span>
      <select
        value={v}
        onChange={(e) => on(e.target.value)}
        className="font-subhead mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3.5 text-sm outline-none focus:border-primary capitalize"
      >
        {opts.map((o) => {
          const val = typeof o === "string" ? o : o.value;
          const lbl = typeof o === "string" ? o : o.label;
          return (
            <option key={val} value={val}>
              {lbl}
            </option>
          );
        })}
      </select>
    </label>
  );
}
