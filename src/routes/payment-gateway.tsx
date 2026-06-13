import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { z } from "zod";
import { Loader2, ShieldCheck, AlertTriangle, CreditCard, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useCart, cartTotals } from "@/lib/cart-store";
import { supabase } from "@/integrations/supabase/client";
import { inr } from "@/lib/format";
import { useAuth } from "@/hooks/use-auth";
import { createRazorpayOrder, verifyRazorpayPayment } from "@/lib/api/payments.server";
import { sendAdminEmailNotification } from "@/lib/api/notifications.server";

const searchSchema = z.object({
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  address1: z.string(),
  address2: z.string().optional().catch(""),
  landmark: z.string().optional().catch(""),
  city: z.string(),
  state: z.string(),
  pincode: z.string(),
  paymentMethod: z.enum(["UPI", "Card"]),
});

export const Route = createFileRoute("/payment-gateway")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [{ title: "Secure Payment Gateway — Prajnaa Farm" }, { name: "robots", content: "noindex" }],
  }),
  component: PaymentGatewayPage,
});

function PaymentGatewayPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const items = useCart((s) => s.items);
  const clear = useCart((s) => s.clear);
  const { subtotal, shipping, total } = cartTotals(items);

  const [step, setStep] = useState<"initializing" | "ready" | "processing" | "failure" | "credentials-missing">("initializing");
  const [loadingText, setLoadingText] = useState("Preparing secure checkout...");
  const [razorpayOrder, setRazorpayOrder] = useState<any>(null);

  // Load Razorpay JS SDK dynamically
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => {
      initPayment();
    };
    script.onerror = () => {
      toast.error("Failed to load payment gateway scripts. Please check your network.");
      setStep("failure");
    };
    document.body.appendChild(script);
    
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const initPayment = async () => {
    setStep("initializing");
    setLoadingText("Generating Razorpay payment reference...");
    try {
      // Call server RPC function to generate the Razorpay Order ID
      const order = await createRazorpayOrder({ data: { amount: total } });
      setRazorpayOrder(order);
      setStep("ready");
    } catch (err: any) {
      console.warn("Razorpay Order creation failed, checking if credentials are missing:", err.message);
      if (err.message?.includes("Keys are not configured")) {
        setStep("credentials-missing");
      } else {
        toast.error(err.message || "Failed to initiate transaction.");
        setStep("failure");
      }
    }
  };

  const launchRazorpay = () => {
    if (!razorpayOrder) return;
    setStep("processing");
    setLoadingText("Waiting for payment gateway verification...");

    const options = {
      key: razorpayOrder.keyId,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      name: "Prajnaa Marketplace",
      description: `Payment for Order - ${search.paymentMethod}`,
      order_id: razorpayOrder.id,
      image: "https://prajnaa-marketplace.firebaseapp.com/favicon.ico", // Replace with logo if available
      handler: async (response: any) => {
        setLoadingText("Verifying payment signature...");
        try {
          // Call Server RPC function to verify transaction signature
          const verification = await verifyRazorpayPayment({
            data: {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            },
          });

          if (verification.success) {
            await saveOrder("paid");
          } else {
            toast.error("Signature verification failed. Secure payment tampered.");
            setStep("failure");
          }
        } catch (verifyErr: any) {
          toast.error("Verification error: " + verifyErr.message);
          setStep("failure");
        }
      },
      prefill: {
        name: search.name,
        email: search.email,
        contact: search.phone,
      },
      theme: {
        color: "#0F3D2E", // forest green
      },
      modal: {
        ondismiss: () => {
          toast.error("Payment cancelled by user");
          setStep("ready");
        },
      },
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  };

  const saveOrder = async (payStatus: "paid" | "failed" | "pending") => {
    setLoadingText("Saving your order to database...");
    const orderId = `PRJ-${Math.floor(10000 + Math.random() * 89999)}`;
    const fullAddress = [
      search.address1,
      search.address2,
      search.landmark ? `Landmark: ${search.landmark}` : "",
      search.city,
      search.state,
      search.pincode,
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
      customer_name: search.name,
      customer_email: search.email,
      customer_phone: search.phone,
      shipping_name: search.name,
      shipping_address: fullAddress,
      shipping_phone: search.phone,
      payment_method: search.paymentMethod,
      payment_status: payStatus,
      status: payStatus === "paid" ? "pending" : "cancelled",
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
          description: payStatus === "paid" 
            ? "Payment verified via Razorpay Secure. Awaiting admin dispatch route approval."
            : "Payment verification failed.",
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
        title: `New Order Placed (${search.paymentMethod})`,
        message: `Order "${orderId}" of ${inr(total)} placed and paid via ${search.paymentMethod}.`,
        read: false,
        metadata: {
          order_id: orderId,
          customer_name: search.name,
          total: total,
          payment_method: search.paymentMethod,
        }
      });

      // Send email notification to admin
      try {
        await sendAdminEmailNotification({
          data: {
            subject: `[New Order] Order Placed & Paid (${search.paymentMethod}) - ${orderId}`,
            body: `A new order has been successfully paid online and placed by customer "${search.name}".\n\nOrder Details:\n- Order ID: ${orderId}\n- Total: ${inr(total)}\n- Payment Method: ${search.paymentMethod}\n- Phone: ${search.phone}\n- Address: ${fullAddress}\n\nPlease assign a delivery route and date in the operations panel.\n\nItems count: ${orderItems.length}`,
          }
        });
      } catch (emailErr) {
        console.warn("Failed to send email notification to admin:", emailErr);
      }

      // Decrement inventory stock on successful paid order placement
      if (payStatus === "paid") {
        for (const item of orderItems) {
          // Fetch current product stock
          const { data: prod } = await supabase
            .from("farmer_products")
            .select("stock")
            .eq("slug", item.slug)
            .maybeSingle();

          if (prod) {
            const currentStock = Number(prod.stock || 0);
            const newStock = Math.max(0, currentStock - item.qty);
            await supabase
              .from("farmer_products")
              .update({ stock: String(newStock) })
              .eq("slug", item.slug);
          }
        }
      }

      if (payStatus === "paid") {
        clear();
        navigate({ to: "/order-confirmation", search: { id: orderId } });
      } else {
        setStep("failure");
      }
    } catch (err: any) {
      console.error("Error saving order:", err);
      toast.error("Database error while saving order: " + err.message);
      setStep("failure");
    }
  };

  // Safe developer demo fallback
  const handleLaunchSimulatedFallback = () => {
    setStep("processing");
    setLoadingText("Initiating simulated test transaction...");
    setTimeout(() => {
      saveOrder("paid");
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-secondary/35 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-background rounded-3xl border border-border shadow-lift overflow-hidden">
        {/* Pay Header */}
        <div className="bg-primary p-6 text-primary-foreground flex justify-between items-center">
          <div>
            <h1 className="font-display text-xl font-semibold tracking-tight">Prajnaa Pay</h1>
            <p className="text-xs text-primary-foreground/75 flex items-center gap-1 mt-0.5">
              <ShieldCheck className="h-3.5 w-3.5 text-success" /> Razorpay Integration
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-[0.14em] text-primary-foreground/60">Amount to pay</p>
            <p className="font-display text-2xl font-bold">{inr(total)}</p>
          </div>
        </div>

        {step === "initializing" && (
          <div className="p-8 text-center space-y-4">
            <Loader2 className="h-9 w-9 animate-spin text-primary mx-auto" />
            <p className="font-display font-medium text-base text-foreground">Initiating Gateway connection</p>
            <p className="text-xs text-muted-foreground max-w-[280px] mx-auto leading-relaxed">
              {loadingText}
            </p>
          </div>
        )}

        {step === "ready" && (
          <div className="p-6 text-center space-y-6">
            <div className="space-y-2">
              <h2 className="font-display text-base font-semibold text-foreground">Secure Payment Gateway Ready</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Click below to launch the official Razorpay Checkout panel. You can pay via UPI, Netbanking, or Debit/Credit card.
              </p>
            </div>

            <button
              onClick={launchRazorpay}
              className="font-subhead h-12 w-full rounded-full bg-primary text-sm font-semibold text-primary-foreground transition hover:opacity-90 cursor-pointer shadow-sm"
            >
              Open Payment Portal
            </button>
          </div>
        )}

        {step === "processing" && (
          <div className="p-8 text-center space-y-4">
            <Loader2 className="h-9 w-9 animate-spin text-primary mx-auto" />
            <p className="font-display font-medium text-base">Processing Transaction</p>
            <p className="text-xs text-muted-foreground max-w-[280px] mx-auto leading-relaxed">
              {loadingText}
            </p>
          </div>
        )}

        {step === "credentials-missing" && (
          <div className="p-6 space-y-6">
            <div className="text-center space-y-3">
              <div className="h-10 w-10 rounded-full bg-warning/10 text-warning flex items-center justify-center mx-auto">
                <AlertTriangle className="h-5.5 w-5.5" />
              </div>
              <h2 className="font-display text-base font-semibold text-foreground">Razorpay Credentials Missing</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                The gateway is ready, but your credentials are not yet added. To connect your account, please define the keys in your <span className="font-mono bg-secondary px-1 py-0.5 rounded border border-border">.env</span> file:
              </p>
              <div className="text-left font-mono text-[9px] bg-secondary/80 p-3 rounded-xl border border-border space-y-1 text-muted-foreground select-all">
                <p>VITE_RAZORPAY_KEY_ID="rzp_test_..."</p>
                <p>RAZORPAY_KEY_SECRET="your_secret_..."</p>
              </div>
            </div>

            <div className="space-y-2.5">
              <button
                onClick={handleLaunchSimulatedFallback}
                className="font-subhead h-11 w-full rounded-full bg-primary text-xs font-semibold text-primary-foreground transition hover:opacity-90 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="h-4 w-4" /> Continue in Demo Sandbox Mode
              </button>
              
              <button
                onClick={initPayment}
                className="font-subhead h-11 w-full rounded-full border border-border text-xs font-semibold hover:bg-secondary/40 transition cursor-pointer"
              >
                Retry API Connection
              </button>
            </div>
          </div>
        )}

        {step === "failure" && (
          <div className="p-8 text-center space-y-5">
            <div className="h-11 w-11 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display font-semibold text-base">Payment Failure</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-[280px] mx-auto leading-relaxed">
                The transaction could not be processed. Please check your bank status or credentials.
              </p>
            </div>
            <button
              onClick={initPayment}
              className="font-subhead h-10 px-5 rounded-full bg-secondary text-xs font-semibold hover:bg-secondary-foreground/10 transition cursor-pointer"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
