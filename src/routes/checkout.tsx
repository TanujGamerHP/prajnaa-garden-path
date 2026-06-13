import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, ShoppingCart, MapPin, CreditCard, ChevronRight } from "lucide-react";
import { MarketingLayout } from "@/components/marketing/layout";
import { useCart, cartTotals } from "@/lib/cart-store";
import { inr } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { sendAdminEmailNotification } from "@/lib/api/notifications.server";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [{ title: "Checkout — Prajnaa Farm" }, { name: "robots", content: "noindex" }],
  }),
  component: CheckoutPage,
});

type FormAddress = {
  name: string;
  phone: string;
  email: string;
  address1: string;
  address2: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
};

function CheckoutPage() {
  const items = useCart((s) => s.items);
  const clear = useCart((s) => s.clear);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  
  const { subtotal, shipping, total } = cartTotals(items);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [payment, setPayment] = useState<"UPI" | "Card" | "COD">("UPI");
  const [placing, setPlacing] = useState(false);

  // Prefilled defaults for demo (removed mock/dummy data to ensure clean, blank form)
  const [address, setAddress] = useState<FormAddress>({
    name: "",
    phone: "",
    email: "",
    address1: "",
    address2: "",
    landmark: "",
    city: "",
    state: "",
    pincode: "",
  });

  // Prefill name, email, and phone with the authenticated user's actual profile details if available
  useEffect(() => {
    if (user) {
      setAddress((prev) => ({
        ...prev,
        name: prev.name || user.name || "",
        phone: prev.phone || user.phone || "",
        email: prev.email || user.email || "",
      }));
    }
  }, [user]);

  const handleInputChange = (key: keyof FormAddress, val: string) => {
    setAddress((prev) => ({ ...prev, [key]: val }));
  };

  const validateStep1 = () => {
    if (!address.name.trim()) return "Full name is required";
    if (!address.phone.trim()) return "Phone number is required";
    if (!address.email.trim()) return "Email is required";
    if (!address.address1.trim()) return "Address line 1 is required";
    if (!address.city.trim()) return "City is required";
    if (!address.state.trim()) return "State is required";
    if (!address.pincode.trim() || address.pincode.length < 6) return "Valid 6-digit Pincode is required";
    return null;
  };

  const handleNextStep = () => {
    if (activeStep === 1) {
      const err = validateStep1();
      if (err) {
        toast.error(err);
        return;
      }
      setActiveStep(2);
    } else if (activeStep === 2) {
      if (items.length === 0) {
        toast.error("Your cart is empty");
        return;
      }
      setActiveStep(3);
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateStep1();
    if (err) {
      toast.error(err);
      setActiveStep(1);
      return;
    }

    if (payment === "Card" || payment === "UPI") {
      // Redirect to Payment Gateway with details
      navigate({
        to: "/payment-gateway",
        search: {
          name: address.name,
          email: address.email,
          phone: address.phone,
          address1: address.address1,
          address2: address.address2 || "",
          landmark: address.landmark || "",
          city: address.city,
          state: address.state,
          pincode: address.pincode,
          paymentMethod: payment,
        },
      });
      return;
    }

    // Cash on Delivery (COD) Flow -> Place directly
    setPlacing(true);
    const orderId = `PRJ-${Math.floor(10000 + Math.random() * 89999)}`;
    const fullAddress = [
      address.address1,
      address.address2,
      address.landmark ? `Landmark: ${address.landmark}` : "",
      address.city,
      address.state,
      address.pincode,
    ]
      .filter(Boolean)
      .join(", ");

    // Resolve farmer_id and farmer_slug for each item dynamically from the database
    const slugs = items.map((item) => (item as any).baseSlug || item.slug);
    const { data: dbProducts } = await supabase
      .from("farmer_products")
      .select("slug, farmer_id")
      .in("slug", slugs);

    const farmerIds = dbProducts ? Array.from(new Set(dbProducts.map((p: any) => p.farmer_id))) : [];
    const { data: dbFarmers } = farmerIds.length > 0
      ? await supabase.from("farmer_profiles").select("id, slug").in("id", farmerIds)
      : { data: [] };

    const orderItems = items.map((item) => {
      const baseSlug = (item as any).baseSlug || item.slug;
      const dbProd = dbProducts?.find((p: any) => p.slug === baseSlug);
      const dbFarmer = dbProd ? dbFarmers?.find((f: any) => f.id === dbProd.farmer_id) : null;

      let farmerSlug = dbFarmer?.slug || "lakshmi-devi";
      let farmerId = dbProd?.farmer_id || "farmer_4";

      // Fallback for mock items
      if (!dbProd) {
        if (item.slug.includes("almonds")) {
          farmerSlug = "ramesh-singh";
          farmerId = "farmer_1";
        } else if (item.slug.includes("turmeric") || item.slug.includes("salt") || item.slug.includes("chilli")) {
          farmerSlug = "vikram-rao";
          farmerId = "farmer_2";
        } else if (item.slug.includes("pickle") || item.slug.includes("masala") || item.slug.includes("lemon")) {
          farmerSlug = "asha-patel";
          farmerId = "farmer_3";
        }
      }

      return {
        slug: item.slug,
        name: item.name,
        price: item.price,
        farmer_base_price: Math.round(item.price / 1.10),
        qty: item.qty,
        weight: item.weight,
        image: item.image,
        farmer_slug: farmerSlug,
        farmer_id: farmerId,
        status: "pending",
      };
    });

    const now = new Date().toISOString();
    const orderDoc = {
      order_id: orderId,
      user_id: user?.id || "anonymous",
      customer_name: address.name,
      customer_email: address.email,
      customer_phone: address.phone,
      shipping_name: address.name,
      shipping_address: fullAddress,
      shipping_phone: address.phone,
      payment_method: "COD",
      payment_status: "pending",
      status: "pending", // initial state awaiting admin assigning route/date
      subtotal,
      shipping_fee: shipping,
      total,
      created_at: now,
      updated_at: now,
      items: orderItems,
      tracking_history: [
        {
          status: "ordered",
          title: "Order Placed",
          description: "Cash on delivery selected. Awaiting admin dispatch route approval.",
          timestamp: now,
        }
      ],
      delivery_date: null,
      delivery_route: null,
      tracking_number: null,
      carrier_name: null,
    };

    try {
      const { error } = await supabase.from("orders").insert(orderDoc);
      if (error) throw error;

      // Save system notification for admin
      await supabase.from("system_notifications").insert({
        type: "order_placed",
        title: "New Order Placed (COD)",
        message: `Order "${orderId}" of ${inr(total)} placed by customer "${address.name}".`,
        read: false,
        metadata: {
          order_id: orderId,
          customer_name: address.name,
          total: total,
          payment_method: "COD",
        }
      });

      // Send email notification to admin
      try {
        await sendAdminEmailNotification({
          data: {
            subject: `[New Order] Order Placed (COD) - ${orderId}`,
            body: `A new Cash on Delivery (COD) order has been placed by customer "${address.name}".\n\nOrder Details:\n- Order ID: ${orderId}\n- Total: ${inr(total)}\n- Phone: ${address.phone}\n- Address: ${fullAddress}\n\nPlease assign a delivery route and date in the operations panel.\n\nItems count: ${orderItems.length}`,
          }
        });
      } catch (emailErr) {
        console.warn("Failed to send email notification to admin:", emailErr);
      }

      clear();
      toast.success("Order Placed Successfully!");
      navigate({ to: "/order-confirmation", search: { id: orderId } });
    } catch (err: any) {
      toast.error(err.message || "Failed to place order");
    } finally {
      setPlacing(false);
    }
  };

  if (items.length === 0 && activeStep !== 3) {
    return (
      <MarketingLayout>
        <div className="container-prj pt-16 md:pt-24 pb-32 text-center">
          <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <h1 className="font-display text-3xl font-semibold mt-4">Your cart is empty</h1>
          <p className="mt-2 text-muted-foreground max-w-sm mx-auto text-sm">
            You cannot checkout with an empty cart. Go back and explore our fresh produce.
          </p>
          <button
            onClick={() => navigate({ to: "/shop" })}
            className="font-subhead mt-6 inline-flex h-10 items-center rounded-full bg-primary px-6 text-xs uppercase tracking-[0.14em] font-medium text-primary-foreground hover:opacity-90 cursor-pointer"
          >
            Explore Shop
          </button>
        </div>
      </MarketingLayout>
    );
  }

  const steps = [
    { num: 1, label: "Shipping Address", icon: MapPin },
    { num: 2, label: "Verify Items", icon: ShoppingCart },
    { num: 3, label: "Secure Payment", icon: CreditCard },
  ] as const;

  return (
    <MarketingLayout>
      <div className="container-prj pt-10 md:pt-16 pb-24">
        {/* Stepper Indicator */}
        <div className="max-w-2xl mx-auto mb-10 md:mb-14">
          <div className="flex items-center justify-between relative">
            {/* Background line */}
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-border -z-10" />
            
            {steps.map((s) => {
              const Icon = s.icon;
              const isDone = activeStep > s.num;
              const isActive = activeStep === s.num;
              return (
                <div key={s.num} className="flex flex-col items-center">
                  <div
                    className={`h-9 w-9 rounded-full flex items-center justify-center border font-subhead text-sm font-semibold transition ${
                      isDone
                        ? "bg-primary border-primary text-primary-foreground"
                        : isActive
                          ? "bg-background border-primary text-primary shadow-[0_0_0_4px_oklch(var(--primary)/0.1)]"
                          : "bg-background border-border text-muted-foreground"
                    }`}
                  >
                    {isDone ? <Check className="h-4.5 w-4.5" /> : s.num}
                  </div>
                  <span
                    className={`font-subhead text-[10px] md:text-xs uppercase tracking-wider mt-2 font-medium ${
                      isActive ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid gap-10 lg:grid-cols-3">
          {/* Main Checkout Area */}
          <div className="space-y-8 lg:col-span-2">
            
            {/* Step 1: Address */}
            {activeStep === 1 && (
              <section className="bg-background rounded-3xl border border-border p-6 md:p-8 space-y-6 animate-fade-up">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5.5 w-5.5 text-primary" />
                  <h2 className="font-display text-xl font-semibold">Shipping details & contact</h2>
                </div>
                <p className="text-xs text-muted-foreground -mt-3">
                  Enter your address to determine delivery feasibility and shipping costs.
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Full Name"
                    required
                    value={address.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                  />
                  <Field
                    label="Phone Number"
                    type="tel"
                    required
                    value={address.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                  />
                  <Field
                    label="Email address"
                    type="email"
                    required
                    className="sm:col-span-2"
                    value={address.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                  />
                  <Field
                    label="Address Line 1"
                    required
                    className="sm:col-span-2"
                    placeholder="House number, apartment name, street"
                    value={address.address1}
                    onChange={(e) => handleInputChange("address1", e.target.value)}
                  />
                  <Field
                    label="Address Line 2"
                    placeholder="Optional area, village, sector"
                    value={address.address2}
                    onChange={(e) => handleInputChange("address2", e.target.value)}
                  />
                  <Field
                    label="Landmark"
                    placeholder="Optional nearby references"
                    value={address.landmark}
                    onChange={(e) => handleInputChange("landmark", e.target.value)}
                  />
                  <Field
                    label="City"
                    required
                    value={address.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                  />
                  <Field
                    label="State"
                    required
                    value={address.state}
                    onChange={(e) => handleInputChange("state", e.target.value)}
                  />
                  <Field
                    label="Pincode"
                    required
                    value={address.pincode}
                    onChange={(e) => handleInputChange("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))}
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    onClick={handleNextStep}
                    className="font-subhead h-11 inline-flex items-center gap-2 rounded-full bg-primary px-6 text-xs uppercase tracking-[0.14em] font-semibold text-primary-foreground hover:opacity-90 cursor-pointer"
                  >
                    Verify items & summary <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </section>
            )}

            {/* Step 2: Item verification */}
            {activeStep === 2 && (
              <section className="bg-background rounded-3xl border border-border p-6 md:p-8 space-y-6 animate-fade-up">
                <div className="flex items-center gap-3">
                  <ShoppingCart className="h-5.5 w-5.5 text-primary" />
                  <h2 className="font-display text-xl font-semibold">Verify product quantities & address</h2>
                </div>
                <p className="text-xs text-muted-foreground -mt-3">
                  Check item details, adjust quantities, and verify delivery address before selecting payment.
                </p>

                {/* Delivery address snapshot */}
                <div className="rounded-2xl bg-secondary/50 border border-border p-4 text-sm space-y-1">
                  <p className="font-subhead font-semibold text-xs uppercase tracking-wider text-muted-foreground">Delivery Address</p>
                  <p className="font-medium text-foreground">{address.name} · {address.phone}</p>
                  <p className="text-muted-foreground">
                    {[address.address1, address.address2, address.city, address.state, address.pincode].filter(Boolean).join(", ")}
                  </p>
                  <button 
                    onClick={() => setActiveStep(1)} 
                    className="text-xs text-primary font-semibold hover:underline mt-2 block"
                  >
                    Change address details
                  </button>
                </div>

                {/* Verification item list */}
                <div className="space-y-4">
                  <p className="font-subhead font-semibold text-xs uppercase tracking-wider text-muted-foreground">Order Items</p>
                  {items.map((i) => (
                    <div key={i.slug} className="flex gap-4 border border-border rounded-2xl p-4 bg-background items-center">
                      <img src={i.image} alt={i.name} className="h-16 w-16 rounded-xl object-cover border border-border" />
                      <div className="flex-1 min-w-0">
                        <p className="font-display font-medium text-sm text-foreground truncate">{i.name}</p>
                        <p className="text-xs text-muted-foreground">{i.weight}</p>
                        <p className="font-display font-semibold text-sm mt-1">{inr(i.price)}</p>
                      </div>

                      {/* Quantity selector in verification screen */}
                      <div className="flex items-center rounded-full border border-border bg-secondary/40 shrink-0">
                        <button
                          type="button"
                          onClick={() => setQty(i.slug, Math.max(1, i.qty - 1))}
                          className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-foreground font-semibold"
                        >
                          -
                        </button>
                        <span className="font-subhead text-xs w-6 text-center">{i.qty}</span>
                        <button
                          type="button"
                          onClick={() => setQty(i.slug, i.qty + 1)}
                          className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-foreground font-semibold"
                        >
                          +
                        </button>
                      </div>
                      
                      <button 
                        type="button"
                        onClick={() => remove(i.slug)}
                        className="text-xs text-destructive hover:underline p-1 shrink-0 ml-2 font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-border">
                  <button
                    onClick={() => setActiveStep(1)}
                    className="font-subhead h-11 inline-flex items-center gap-2 rounded-full border border-border px-5 text-xs uppercase tracking-[0.14em] font-semibold hover:bg-secondary cursor-pointer"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Back
                  </button>
                  <button
                    onClick={handleNextStep}
                    className="font-subhead h-11 inline-flex items-center gap-2 rounded-full bg-primary px-6 text-xs uppercase tracking-[0.14em] font-semibold text-primary-foreground hover:opacity-90 cursor-pointer"
                  >
                    Select Payment Method <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </section>
            )}

            {/* Step 3: Payment */}
            {activeStep === 3 && (
              <form onSubmit={handlePlaceOrder} className="bg-background rounded-3xl border border-border p-6 md:p-8 space-y-6 animate-fade-up">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5.5 w-5.5 text-primary" />
                  <h2 className="font-display text-xl font-semibold">Select payment method</h2>
                </div>
                <p className="text-xs text-muted-foreground -mt-3">
                  UPI or Card will redirect you to secure gateway. Cash on Delivery places order immediately.
                </p>

                <div className="grid gap-3 sm:grid-cols-3">
                  {(["UPI", "Card", "COD"] as const).map((m) => (
                    <label
                      key={m}
                      className={`font-subhead flex flex-col items-center justify-center cursor-pointer gap-2.5 rounded-2xl border p-5 transition-all text-center ${
                        payment === m
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border bg-background hover:bg-secondary/40"
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        checked={payment === m}
                        onChange={() => setPayment(m)}
                        className="accent-[var(--primary)] h-4 w-4"
                      />
                      <div className="text-sm font-semibold text-foreground">
                        {m === "COD" ? "Cash on Delivery" : m === "UPI" ? "UPI (GPay/UPI ID)" : "Credit/Debit Card"}
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {m === "COD" ? "Pay at your doorstep" : "Redirects to secure payment"}
                      </span>
                    </label>
                  ))}
                </div>

                <div className="rounded-2xl border border-border p-4 bg-secondary/20 flex gap-3 text-xs text-muted-foreground items-start leading-relaxed">
                  <Check className="h-4.5 w-4.5 text-success shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground">Prajnaa buyer protection policy</p>
                    <p className="mt-0.5">Secure payment options. Orders approved by admin verify original routes and provide tracking dates before dispatch.</p>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4">
                  <button
                    type="button"
                    onClick={() => setActiveStep(2)}
                    className="font-subhead h-11 inline-flex items-center gap-2 rounded-full border border-border px-5 text-xs uppercase tracking-[0.14em] font-semibold hover:bg-secondary cursor-pointer"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Back
                  </button>
                  <button
                    type="submit"
                    disabled={placing}
                    className="font-subhead h-11 inline-flex items-center gap-2 rounded-full bg-primary px-8 text-xs uppercase tracking-[0.14em] font-bold text-primary-foreground hover:opacity-90 disabled:opacity-60 cursor-pointer"
                  >
                    {placing ? "Processing order..." : payment === "COD" ? `Confirm Order · ${inr(total)}` : `Proceed to Pay · ${inr(total)}`}
                  </button>
                </div>
              </form>
            )}

          </div>

          {/* Aside Order Summary */}
          <aside className="h-fit rounded-3xl border border-border bg-secondary/20 p-6 md:p-7 space-y-6">
            <div>
              <h3 className="font-display text-lg font-semibold text-foreground">Checkout summary</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{items.length} unique items in cart</p>
            </div>

            <ul className="space-y-4 max-h-[220px] overflow-y-auto pr-1">
              {items.map((i) => (
                <li key={i.slug} className="flex gap-3 text-xs items-center">
                  <img src={i.image} alt={i.name} className="h-11 w-11 rounded-lg object-cover border border-border shrink-0" />
                  <div className="flex-grow min-w-0">
                    <p className="font-subhead font-semibold text-foreground truncate">{i.name}</p>
                    <p className="text-muted-foreground mt-0.5">Qty {i.qty} · {i.weight}</p>
                  </div>
                  <p className="font-subhead font-bold shrink-0">{inr(i.price * i.qty)}</p>
                </li>
              ))}
            </ul>

            <div className="border-t border-border pt-4 space-y-2.5 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{inr(subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Estimated shipping</span>
                <span>{shipping === 0 ? "Free" : inr(shipping)}</span>
              </div>
              <div className="border-t border-border my-2 pt-2.5 flex justify-between text-sm font-display font-bold text-foreground">
                <span>Total Amount</span>
                <span>{inr(total)}</span>
              </div>
            </div>

            {activeStep === 1 && (
              <div className="text-[10px] text-muted-foreground text-center border-t border-border pt-4 leading-relaxed">
                Step 1 of 3: Add Shipping Info to continue checkout.
              </div>
            )}
          </aside>
        </div>
      </div>
    </MarketingLayout>
  );
}

function Field({
  label,
  className = "",
  required,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; required?: boolean }) {
  return (
    <label className={`block ${className}`}>
      <span className="font-subhead text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-semibold">
        {label} {required && <span className="text-destructive font-display font-normal">*</span>}
      </span>
      <input
        {...rest}
        className="font-subhead mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3.5 text-sm outline-none transition focus:border-primary"
      />
    </label>
  );
}
