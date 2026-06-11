import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { 
  ArrowLeft, 
  CheckCircle2, 
  MapPin, 
  Package, 
  Truck, 
  Calendar, 
  ShieldCheck, 
  Loader2, 
  X, 
  AlertTriangle,
  Edit,
  Plus,
  Minus,
  Trash2,
  RotateCcw
} from "lucide-react";
import { MarketingLayout } from "@/components/marketing/layout";
import { Reveal } from "@/components/reveal";
import { supabase } from "@/integrations/supabase/client";
import { inr } from "@/lib/format";
import { toast } from "sonner";
import { sendAdminEmailNotification } from "@/lib/api/notifications.server";

export const Route = createFileRoute("/orders/$id")({
  head: ({ params }) => ({
    meta: [{ title: `Order ${params.id} — Prajnaa Farm` }, { name: "robots", content: "noindex" }],
  }),
  component: OrderDetailPage,
  notFoundComponent: () => (
    <MarketingLayout>
      <div className="container-prj py-32 text-center">
        <h1 className="font-display text-4xl">Order not found</h1>
        <Link to="/account/orders" className="mt-4 inline-block text-primary underline">
          Back to your orders
        </Link>
      </div>
    </MarketingLayout>
  ),
});

const TRACKING_STEPS = [
  { status: "pending", label: "Ordered", desc: "Awaiting approval" },
  { status: "confirmed", label: "Confirmed", desc: "Delivery route assigned" },
  { status: "packed", label: "Packed", desc: "Ready for shipping" },
  { status: "shipped", label: "Shipped", desc: "In transit via courier" },
  { status: "delivered", label: "Delivered", desc: "Handed over" },
] as const;

function OrderDetailPage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState("");
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showItemsModal, setShowItemsModal] = useState(false);

  // Address Form States
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddress1, setEditAddress1] = useState("");
  const [editAddress2, setEditAddress2] = useState("");
  const [editLandmark, setEditLandmark] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editState, setEditState] = useState("");
  const [editPincode, setEditPincode] = useState("");

  const { data: order, isLoading, error } = useQuery({
    queryKey: ["customer-order-detail", id],
    queryFn: async () => {
      // First try doc id directly
      const { data: byId } = await supabase
        .from("orders")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (byId) return byId;

      // Fallback: search by order_id field
      const { data: byOrderId } = await supabase
        .from("orders")
        .select("*")
        .eq("order_id", id)
        .maybeSingle();

      if (byOrderId) return byOrderId;

      throw new Error("Order not found");
    },
  });

  // Load address data on open
  const openAddressModal = () => {
    if (!order) return;
    // Extract fields from address string if possible or fill defaults
    // Address format: line1, line2, Landmark: landmark, city, state, pincode
    const parts = order.shipping_address ? order.shipping_address.split(", ") : [];
    
    setEditName(order.shipping_name || order.customer_name || "");
    setEditPhone(order.shipping_phone || order.customer_phone || "");
    setEditAddress1(parts[0] || "");
    setEditAddress2(parts[1] || "");
    
    const landmarkPart = parts.find((p: string) => p.startsWith("Landmark:"));
    setEditLandmark(landmarkPart ? landmarkPart.replace("Landmark: ", "") : "");
    
    // Fallbacks
    setEditCity(order.shipping_address?.includes("Bengaluru") ? "Bengaluru" : parts[2] || "");
    setEditState(order.shipping_address?.includes("Karnataka") ? "Karnataka" : parts[3] || "");
    setEditPincode(order.shipping_address?.match(/\d{6}/)?.[0] || "");
    
    setShowAddressModal(true);
  };

  // Mutate Address Details
  const addressMut = useMutation({
    mutationFn: async () => {
      if (!order) return;
      const now = new Date().toISOString();
      const newAddress = [
        editAddress1,
        editAddress2,
        editLandmark ? `Landmark: ${editLandmark}` : "",
        editCity,
        editState,
        editPincode,
      ]
        .filter(Boolean)
        .join(", ");

      const newHistoryLog = {
        status: order.status,
        title: "Shipping Address Updated",
        description: `Customer updated shipping address to: ${newAddress}`,
        timestamp: now,
      };

      const patch = {
        shipping_name: editName,
        shipping_address: newAddress,
        shipping_phone: editPhone,
        tracking_history: [...(order.tracking_history || []), newHistoryLog],
        updated_at: now,
      };

      const { error } = await supabase.from("orders").update(patch).eq("id", order.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Shipping address updated successfully!");
      setShowAddressModal(false);
      qc.invalidateQueries({ queryKey: ["customer-order-detail", id] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update address");
    },
  });

  // Mutate Order Cancellation (With Inventory Stock Recovery)
  const cancelMut = useMutation({
    mutationFn: async () => {
      if (!order) return;
      const now = new Date().toISOString();

      const newHistoryLog = {
        status: "cancelled",
        title: "Order Cancelled by Customer",
        description: "The customer cancelled this shipment. Inventory stock has been returned to farmers.",
        timestamp: now,
      };

      const patch = {
        status: "cancelled",
        payment_status: order.payment_status === "paid" ? "refunded" : "cancelled",
        tracking_history: [...(order.tracking_history || []), newHistoryLog],
        updated_at: now,
      };

      // 1. Update order status in Firestore
      const { error: orderError } = await supabase.from("orders").update(patch).eq("id", order.id);
      if (orderError) throw orderError;

      // Save system notification for admin
      await supabase.from("system_notifications").insert({
        type: "order_cancelled",
        title: "Order Cancelled by Customer",
        message: `Order "${order.order_id || order.id}" has been cancelled by customer "${order.customer_name}".`,
        read: false,
        metadata: {
          order_id: order.order_id || order.id,
          customer_name: order.customer_name,
          total: order.total,
        }
      });

      // Send email notification to admin
      try {
        await sendAdminEmailNotification({
          data: {
            subject: `[Cancellation] Order Cancelled by Customer - ${order.order_id || order.id}`,
            body: `Customer "${order.customer_name}" has cancelled their order.\n\nOrder Details:\n- Order ID: ${order.order_id || order.id}\n- Refund Status: ${order.payment_status === "paid" ? "Refund Initiated (Online)" : "COD Order Cancelled"}\n- Amount: ${inr(order.total)}\n- Address: ${order.shipping_address}\n\nInventory has been returned to the respective farmers.`,
          }
        });
      } catch (emailErr) {
        console.warn("Failed to send email notification to admin:", emailErr);
      }

      // 2. Return reserved stocks back to farmer products
      for (const item of order.items || []) {
        const { data: prod } = await supabase
          .from("farmer_products")
          .select("stock")
          .eq("slug", item.slug)
          .maybeSingle();

        if (prod) {
          const currentStock = Number(prod.stock || 0);
          const newStock = currentStock + Number(item.qty || 1);
          await supabase
            .from("farmer_products")
            .update({ stock: String(newStock) })
            .eq("slug", item.slug);
        }
      }
    },
    onSuccess: () => {
      toast.success("Order cancelled successfully. Refund initiated.");
      setShowCancelModal(false);
      qc.invalidateQueries({ queryKey: ["customer-order-detail", id] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to cancel order");
    },
  });

  // Mutate Order Return
  const returnMut = useMutation({
    mutationFn: async (reasonText: string) => {
      if (!order) return;
      const now = new Date().toISOString();

      const newHistoryLog = {
        status: "returned",
        title: "Return Requested by Customer",
        description: `Customer requested a return. Reason: ${reasonText || "No reason provided"}`,
        timestamp: now,
      };

      const patch = {
        status: "returned",
        payment_status: "refunded",
        tracking_history: [...(order.tracking_history || []), newHistoryLog],
        updated_at: now,
      };

      // 1. Update order status in Supabase
      const { error: orderError } = await supabase.from("orders").update(patch).eq("id", order.id);
      if (orderError) throw orderError;

      // Save system notification for admin
      await supabase.from("system_notifications").insert({
        type: "order_returned",
        title: "Order Return Requested",
        message: `Order "${order.order_id || order.id}" has been returned by customer "${order.customer_name}". Reason: ${reasonText || "No reason provided"}`,
        read: false,
        metadata: {
          order_id: order.order_id || order.id,
          customer_name: order.customer_name,
          total: order.total,
          reason: reasonText,
        }
      });

      // Send email notification to admin
      try {
        await sendAdminEmailNotification({
          data: {
            subject: `[Return] Order Return Requested - ${order.order_id || order.id}`,
            body: `Customer "${order.customer_name}" has requested a return for their order.\n\nOrder Details:\n- Order ID: ${order.order_id || order.id}\n- Amount: ${inr(order.total)}\n- Return Reason: ${reasonText || "No reason provided"}\n- Address: ${order.shipping_address}\n\nPlease process the return and verification on the admin dashboard.`,
          }
        });
      } catch (emailErr) {
        console.warn("Failed to send email notification to admin:", emailErr);
      }

      // 2. Return stocks back to farmer products
      for (const item of order.items || []) {
        const { data: prod } = await supabase
          .from("farmer_products")
          .select("stock")
          .eq("slug", item.slug)
          .maybeSingle();

        if (prod) {
          const currentStock = Number(prod.stock || 0);
          const newStock = currentStock + Number(item.qty || 1);
          await supabase
            .from("farmer_products")
            .update({ stock: String(newStock) })
            .eq("slug", item.slug);
        }
      }
    },
    onSuccess: () => {
      toast.success("Return initiated successfully. Refund processed.");
      setShowReturnModal(false);
      setReturnReason("");
      qc.invalidateQueries({ queryKey: ["customer-order-detail", id] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to initiate return");
    },
  });

  // Items Editing State
  const [editingItems, setEditingItems] = useState<any[]>([]);
  const openItemsModal = () => {
    if (!order) return;
    setEditingItems(JSON.parse(JSON.stringify(order.items || [])));
    setShowItemsModal(true);
  };

  const handleEditQty = (slug: string, delta: number) => {
    setEditingItems((prev) =>
      prev.map((it) => {
        if (it.slug === slug) {
          const newQty = Math.max(1, it.qty + delta);
          return { ...it, qty: newQty };
        }
        return it;
      })
    );
  };

  const handleRemoveItem = (slug: string) => {
    setEditingItems((prev) => prev.filter((it) => it.slug !== slug));
  };

  // Mutate Order Items (Quantity edits & Stock recalculation)
  const itemsMut = useMutation({
    mutationFn: async () => {
      if (!order) return;
      if (editingItems.length === 0) {
        throw new Error("Cannot have an empty order. Please cancel the order instead.");
      }

      const now = new Date().toISOString();
      
      // Calculate new totals
      const newSubtotal = editingItems.reduce((acc, it) => acc + Number(it.price) * Number(it.qty), 0);
      const newShippingFee = newSubtotal > 999 ? 0 : 49;
      const newTotal = newSubtotal + newShippingFee;
      const difference = order.total - newTotal;

      const newHistoryLog = {
        status: order.status,
        title: "Order Items Modified",
        description: `Customer adjusted quantities. New Total: ${inr(newTotal)}. Difference: ${inr(Math.abs(difference))} ${difference > 0 ? "refunded" : "added to COD"}.`,
        timestamp: now,
      };

      const patch = {
        items: editingItems,
        subtotal: newSubtotal,
        shipping_fee: newShippingFee,
        total: newTotal,
        tracking_history: [...(order.tracking_history || []), newHistoryLog],
        updated_at: now,
      };

      // 1. Update order doc in Firestore
      const { error: orderError } = await supabase.from("orders").update(patch).eq("id", order.id);
      if (orderError) throw orderError;

      // 2. Adjust farmer inventory stocks based on quantity differences
      for (const oldItem of order.items || []) {
        const newItem = editingItems.find((it) => it.slug === oldItem.slug);
        
        // Fetch current product stock
        const { data: prod } = await supabase
          .from("farmer_products")
          .select("stock")
          .eq("slug", oldItem.slug)
          .maybeSingle();

        if (prod) {
          const currentStock = Number(prod.stock || 0);
          
          if (!newItem) {
            // Item removed entirely -> Return all stocks
            const newStock = currentStock + Number(oldItem.qty);
            await supabase
              .from("farmer_products")
              .update({ stock: String(newStock) })
              .eq("slug", oldItem.slug);
          } else {
            // Quantity changed -> Reconcile difference
            const diff = Number(oldItem.qty) - Number(newItem.qty);
            const newStock = currentStock + diff;
            await supabase
              .from("farmer_products")
              .update({ stock: String(newStock) })
              .eq("slug", oldItem.slug);
          }
        }
      }

      return { difference };
    },
    onSuccess: (data) => {
      const diff = data?.difference || 0;
      if (diff > 0) {
        toast.success(`Order items updated. Refund of ${inr(diff)} initiated!`);
      } else if (diff < 0) {
        toast.success(`Order items updated. Balance of ${inr(Math.abs(diff))} updated.`);
      } else {
        toast.success("Order items updated successfully!");
      }
      setShowItemsModal(false);
      qc.invalidateQueries({ queryKey: ["customer-order-detail", id] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to edit order items");
    },
  });

  if (isLoading) {
    return (
      <MarketingLayout>
        <div className="container-prj py-32 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground font-subhead">Loading shipment details...</p>
        </div>
      </MarketingLayout>
    );
  }

  if (error || !order) {
    throw notFound();
  }

  const orderId = order.order_id || order.id?.slice(0, 8).toUpperCase();
  const date = order.created_at
    ? new Date(order.created_at).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

  const getStepIndex = (status: string) => {
    switch (status) {
      case "pending": return 0;
      case "confirmed": return 1;
      case "packed": return 2;
      case "shipped": return 3;
      case "delivered": return 4;
      default: return 0;
    }
  };

  const currentStepIdx = getStepIndex(order.status);
  const items = order.items || [];
  
  // Checks if user is allowed to edit/cancel order
  const isEditable = order.status === "pending";
  const isCancellable = order.status === "pending" || order.status === "confirmed";

  return (
    <MarketingLayout>
      <section className="container-prj pt-10 pb-24 space-y-8 animate-fade-up">
        {/* Back Link */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/account/orders"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background hover:bg-secondary transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="font-display text-2xl font-bold">Track Shipment</h1>
              <p className="text-xs text-muted-foreground font-subhead">Order placed on {date}</p>
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="flex flex-wrap gap-2">
            {isEditable && (
              <button
                onClick={openItemsModal}
                className="font-subhead h-9 inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 text-xs font-semibold hover:bg-secondary cursor-pointer"
              >
                <Edit className="h-3.5 w-3.5 text-muted-foreground" /> Edit Order Items
              </button>
            )}
            
            {isCancellable && (
              <button
                onClick={openAddressModal}
                className="font-subhead h-9 inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 text-xs font-semibold hover:bg-secondary cursor-pointer"
              >
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" /> Change Address
              </button>
            )}

            {isCancellable && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="font-subhead h-9 inline-flex items-center gap-1.5 rounded-full border border-destructive/20 bg-destructive/5 px-4 text-xs font-bold text-destructive hover:bg-destructive/10 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" /> Cancel Order
              </button>
            )}

            {order.status === "delivered" && (
              <button
                onClick={() => setShowReturnModal(true)}
                className="font-subhead h-9 inline-flex items-center gap-1.5 rounded-full border border-warning/20 bg-warning/5 px-4 text-xs font-bold text-warning hover:bg-warning/10 cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Return Order
              </button>
            )}
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Tracking Details */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Visual Timeline Card */}
            <Reveal>
              <div className="rounded-3xl border border-border bg-background p-6 md:p-8 space-y-8 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
                  <div>
                    <span className="text-[10px] uppercase tracking-[0.14em] font-semibold text-muted-foreground font-subhead">Shipment ID</span>
                    <h2 className="font-display text-lg font-bold text-foreground mt-0.5">{orderId}</h2>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase tracking-[0.14em] font-semibold text-muted-foreground font-subhead">Status</span>
                    <p className="font-subhead text-xs font-bold text-primary uppercase mt-1 tracking-wider border border-primary/20 bg-primary/5 rounded-full px-3 py-0.5">
                      {order.status}
                    </p>
                  </div>
                </div>

                {/* Stepper Timeline */}
                {order.status === "cancelled" ? (
                  <div className="flex items-center gap-3 rounded-2xl bg-destructive/5 border border-destructive/10 p-5 text-destructive text-xs">
                    <AlertTriangle className="h-5.5 w-5.5 shrink-0" />
                    <div>
                      <p className="font-semibold font-display">This order has been cancelled</p>
                      <p className="mt-0.5 leading-relaxed">No delivery will be attempted. If payment was made online, it will be refunded to your source account.</p>
                    </div>
                  </div>
                ) : (
                  <div className="relative flex items-center justify-between max-w-xl mx-auto">
                    <div className="absolute left-0 right-0 top-4 h-0.5 bg-border -z-10" />
                    <div 
                      className="absolute left-0 top-4 h-0.5 bg-primary -z-10 transition-all duration-500" 
                      style={{ width: `${(currentStepIdx / 4) * 100}%` }}
                    />

                    {TRACKING_STEPS.map((s, idx) => {
                      const isActive = idx === currentStepIdx;
                      const isPassed = idx < currentStepIdx;

                      return (
                        <div key={s.status} className="flex flex-col items-center relative z-10">
                          <div
                            className={`h-8.5 w-8.5 rounded-full flex items-center justify-center border font-display text-xs font-bold transition-all duration-300 ${
                              isPassed
                                ? "bg-primary border-primary text-primary-foreground"
                                : isActive
                                  ? "bg-background border-primary text-primary shadow-[0_0_0_4px_oklch(var(--primary)/0.1)] scale-110"
                                  : "bg-background border-border text-muted-foreground"
                            }`}
                          >
                            {isPassed ? <CheckCircle2 className="h-4.5 w-4.5 fill-primary text-primary-foreground" /> : idx + 1}
                          </div>
                          <span
                            className={`font-subhead text-[9px] uppercase tracking-wider mt-2 font-bold text-center ${
                              isActive ? "text-primary" : "text-muted-foreground"
                            }`}
                          >
                            {s.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Shipping summary if approved */}
                {order.status !== "pending" && order.status !== "cancelled" && order.delivery_route && (
                  <div className="grid gap-4 sm:grid-cols-2 rounded-2xl bg-secondary/35 border border-border p-4 text-xs">
                    <div>
                      <span className="text-muted-foreground font-subhead block mb-0.5">Delivery Route Assigned</span>
                      <span className="font-semibold text-foreground">{order.delivery_route}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground font-subhead block mb-0.5">Estimated Arrival Date</span>
                      <span className="font-semibold text-foreground flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-primary" /> {order.delivery_date ? new Date(order.delivery_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                      </span>
                    </div>
                    <div className="border-t border-border/80 pt-2.5 sm:col-span-2 grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-muted-foreground font-subhead block mb-0.5">Shipping Carrier</span>
                        <span className="font-semibold text-foreground flex items-center gap-1.5">
                          <Truck className="h-3.5 w-3.5 text-primary" /> {order.carrier_name}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground font-subhead block mb-0.5">Original Tracking ID</span>
                        <span className="font-mono font-bold text-foreground text-[11px]">{order.tracking_number}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Reveal>

            {/* Tracking Logs History */}
            <Reveal delay={100}>
              <div className="rounded-3xl border border-border bg-background p-6 md:p-8 space-y-5 shadow-sm">
                <h3 className="font-display text-base font-bold text-foreground">Detailed Transit History</h3>
                
                {order.tracking_history && order.tracking_history.length > 0 ? (
                  <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                    {order.tracking_history.map((log: any, idx: number) => {
                      const logTime = log.timestamp 
                        ? new Date(log.timestamp).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "";
                      return (
                        <div key={idx} className="relative group animate-fade-up">
                          <div className={`absolute -left-[22px] top-1.5 h-3 w-3 rounded-full border-2 bg-background transition ${
                            idx === order.tracking_history.length - 1 
                              ? "border-primary scale-110 shadow-[0_0_0_3px_oklch(var(--primary)/0.15)]" 
                              : "border-border"
                          }`} />
                          
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-muted-foreground font-subhead block">{logTime}</span>
                            <h4 className="font-display font-semibold text-sm text-foreground">{log.title}</h4>
                            <p className="text-xs text-muted-foreground leading-relaxed">{log.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No tracking logs have been posted yet.</p>
                )}
              </div>
            </Reveal>

          </div>

          {/* Sidebar Invoice Summary */}
          <aside className="space-y-6">
            
            {/* Delivery address */}
            <div className="rounded-3xl border border-border bg-background p-6 space-y-4 shadow-sm">
              <h3 className="font-display text-base font-bold text-foreground">Delivery details</h3>
              
              <div className="space-y-3.5 text-xs">
                <div className="flex gap-2.5 items-start">
                  <MapPin className="h-4.5 w-4.5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground">{order.shipping_name || order.customer_name}</p>
                    <p className="text-muted-foreground mt-0.5 leading-relaxed">{order.shipping_address}</p>
                    {order.customer_phone && <p className="text-muted-foreground mt-1.5 font-medium">📞 {order.customer_phone}</p>}
                  </div>
                </div>
                
                <div className="border-t border-border pt-3.5 flex gap-2.5 items-start">
                  <ShieldCheck className="h-4.5 w-4.5 text-success shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground">Payment Information</p>
                    <p className="text-muted-foreground mt-0.5 capitalize">Method: {order.payment_method}</p>
                    <p className={`font-semibold mt-1 ${
                      order.payment_status === "paid" 
                        ? "text-success" 
                        : order.payment_status === "refunded"
                          ? "text-destructive"
                          : "text-warning"
                    }`}>
                      Status: {order.payment_status === "paid" ? "Paid" : order.payment_status === "refunded" ? "Refunded" : "Cash on Delivery Pending"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Items summary */}
            <div className="rounded-3xl border border-border bg-background p-6 space-y-4 shadow-sm">
              <h3 className="font-display text-base font-bold text-foreground">Items summary</h3>
              
              <ul className="space-y-4">
                {items.map((i: any) => (
                  <li key={i.slug} className="flex gap-3 text-xs items-center">
                    {i.image && (
                      <img
                        src={i.image}
                        alt={i.name}
                        className="h-11 w-11 rounded-lg object-cover border border-border shrink-0"
                      />
                    )}
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
                  <span>{inr(order.subtotal || order.total - order.shipping_fee)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping fee</span>
                  <span>{order.shipping_fee === 0 ? "Free" : inr(order.shipping_fee)}</span>
                </div>
                <div className="border-t border-border pt-2.5 flex justify-between text-sm font-display font-bold text-foreground">
                  <span>Grand Total</span>
                  <span>{inr(order.total)}</span>
                </div>
              </div>
            </div>

          </aside>
        </div>
      </section>

      {/* --- DIALOG MODALS --- */}

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-background border border-border rounded-3xl p-6 space-y-6 shadow-lift animate-fade-up">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-foreground">Cancel Order</h3>
                <p className="text-xs text-muted-foreground mt-0.5">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to cancel order <span className="font-semibold text-foreground">{orderId}</span>? Farmer crop reserves will be returned, and online payments will be refunded.
            </p>

            <div className="flex gap-2.5">
              <button
                onClick={() => setShowCancelModal(false)}
                className="font-subhead h-10 flex-1 rounded-full border border-border text-xs font-semibold hover:bg-secondary transition cursor-pointer"
              >
                No, keep order
              </button>
              <button
                onClick={() => cancelMut.mutate()}
                disabled={cancelMut.isPending}
                className="font-subhead h-10 flex-1 rounded-full bg-destructive text-xs font-bold text-destructive-foreground hover:opacity-90 disabled:opacity-50 transition cursor-pointer"
              >
                {cancelMut.isPending ? "Cancelling..." : "Yes, cancel order"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return Confirmation Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-background border border-border rounded-3xl p-6 space-y-6 shadow-lift animate-fade-up">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-warning/10 text-warning flex items-center justify-center shrink-0">
                <RotateCcw className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-foreground">Return Order</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Please provide a reason for return.</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-subhead text-[10px] uppercase tracking-wider text-muted-foreground">Reason for Return</label>
              <textarea
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                placeholder="e.g. Received damaged products, items missing, incorrect order..."
                rows={3}
                className="w-full rounded-xl border border-border p-3 text-xs outline-none focus:border-primary transition resize-none bg-background text-foreground"
              />
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={() => {
                  setShowReturnModal(false);
                  setReturnReason("");
                }}
                className="font-subhead h-10 flex-1 rounded-full border border-border text-xs font-semibold hover:bg-secondary transition cursor-pointer text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={() => returnMut.mutate(returnReason)}
                disabled={returnMut.isPending || !returnReason.trim()}
                className="font-subhead h-10 flex-1 rounded-full bg-warning text-xs font-bold text-warning-foreground hover:opacity-90 disabled:opacity-50 transition cursor-pointer"
              >
                {returnMut.isPending ? "Submitting..." : "Submit Return"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Address Edit Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-background border border-border rounded-3xl p-6 space-y-4 shadow-lift animate-fade-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h3 className="font-display font-bold text-base text-foreground">Edit Shipping Address</h3>
              <button onClick={() => setShowAddressModal(false)} className="h-7 w-7 rounded-full hover:bg-secondary flex items-center justify-center">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-muted-foreground block mb-1">Full Name</span>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 outline-none focus:border-primary"
                  />
                </label>
                <label className="block">
                  <span className="text-muted-foreground block mb-1">Phone Number</span>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 outline-none focus:border-primary"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-muted-foreground block mb-1">Address Line 1</span>
                <input
                  type="text"
                  value={editAddress1}
                  onChange={(e) => setEditAddress1(e.target.value)}
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 outline-none focus:border-primary"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-muted-foreground block mb-1">Address Line 2 (Optional)</span>
                  <input
                    type="text"
                    value={editAddress2}
                    onChange={(e) => setEditAddress2(e.target.value)}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 outline-none focus:border-primary"
                  />
                </label>
                <label className="block">
                  <span className="text-muted-foreground block mb-1">Landmark</span>
                  <input
                    type="text"
                    value={editLandmark}
                    onChange={(e) => setEditLandmark(e.target.value)}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 outline-none focus:border-primary"
                  />
                </label>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <label className="block">
                  <span className="text-muted-foreground block mb-1">City</span>
                  <input
                    type="text"
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    className="h-10 w-full rounded-lg border border-border bg-background px-2.5 outline-none focus:border-primary"
                  />
                </label>
                <label className="block">
                  <span className="text-muted-foreground block mb-1">State</span>
                  <input
                    type="text"
                    value={editState}
                    onChange={(e) => setEditState(e.target.value)}
                    className="h-10 w-full rounded-lg border border-border bg-background px-2.5 outline-none focus:border-primary"
                  />
                </label>
                <label className="block">
                  <span className="text-muted-foreground block mb-1">Pincode</span>
                  <input
                    type="text"
                    value={editPincode}
                    onChange={(e) => setEditPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="h-10 w-full rounded-lg border border-border bg-background px-2.5 outline-none focus:border-primary"
                  />
                </label>
              </div>
            </div>

            <button
              onClick={() => addressMut.mutate()}
              disabled={addressMut.isPending}
              className="font-subhead h-11 w-full rounded-full bg-primary text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition mt-4 cursor-pointer"
            >
              {addressMut.isPending ? "Saving address..." : "Save Delivery Address"}
            </button>
          </div>
        </div>
      )}

      {/* Edit Items Modal */}
      {showItemsModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-background border border-border rounded-3xl p-6 space-y-5 shadow-lift animate-fade-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h3 className="font-display font-bold text-base text-foreground">Adjust Order Items</h3>
              <button onClick={() => setShowItemsModal(false)} className="h-7 w-7 rounded-full hover:bg-secondary flex items-center justify-center">
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Verify quantities. Stock updates will synchronize with the farm catalog, and payment balances will recalculate automatically.
            </p>

            <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
              {editingItems.map((item) => (
                <div key={item.slug} className="flex gap-3 border border-border rounded-xl p-3 bg-secondary/5 items-center">
                  {item.image && (
                    <img src={item.image} alt={item.name} className="h-10 w-10 rounded-lg object-cover border border-border" />
                  )}
                  <div className="flex-1 min-w-0 text-xs">
                    <p className="font-display font-medium text-foreground truncate">{item.name}</p>
                    <p className="font-semibold text-muted-foreground mt-0.5">{inr(item.price)}</p>
                  </div>

                  <div className="flex items-center rounded-full border border-border bg-background shrink-0">
                    <button
                      type="button"
                      onClick={() => handleEditQty(item.slug, -1)}
                      className="h-7 w-7 flex items-center justify-center font-bold text-muted-foreground hover:text-foreground text-sm"
                    >
                      -
                    </button>
                    <span className="font-subhead text-xs w-6 text-center text-foreground font-semibold">{item.qty}</span>
                    <button
                      type="button"
                      onClick={() => handleEditQty(item.slug, 1)}
                      className="h-7 w-7 flex items-center justify-center font-bold text-muted-foreground hover:text-foreground text-sm"
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.slug)}
                    className="p-1 hover:text-destructive text-muted-foreground transition shrink-0 ml-1"
                    title="Remove item"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => itemsMut.mutate()}
              disabled={itemsMut.isPending}
              className="font-subhead h-11 w-full rounded-full bg-primary text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition cursor-pointer mt-3"
            >
              {itemsMut.isPending ? "Updating order totals..." : "Update Order Items"}
            </button>
          </div>
        </div>
      )}

    </MarketingLayout>
  );
}
