import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Loader2,
  ShoppingBag,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  User,
  MapPin,
  Building,
  Calendar,
  Sprout,
  Coins,
  FileText,
  AlertCircle,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/shell";
import { supabase } from "@/integrations/supabase/client";
import { useFarmerProfile } from "@/lib/farmer/use-farmer";
import { inr } from "@/lib/format";

export const Route = createFileRoute("/farmer-portal/dashboard")({ component: FarmerDashboard });

function FarmerDashboard() {
  const { data: farmer } = useFarmerProfile();
  const farmerId = farmer?.id;
  const farmerSlug = farmer?.slug;

  const { data: products = [], isLoading: pLoading } = useQuery({
    enabled: !!farmerId,
    queryKey: ["farmer-products", farmerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("farmer_products")
        .select("*")
        .eq("farmer_id", farmerId!);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: payouts = [] } = useQuery({
    enabled: !!farmerId,
    queryKey: ["farmer-payouts", farmerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("farmer_payouts")
        .select("*")
        .eq("farmer_id", farmerId!)
        .order("period_end", { ascending: false })
        .limit(3);
      if (error) throw error;
      return data ?? [];
    },
  });

  // Query customer orders containing this farmer's products
  const { data: orders = [], isLoading: oLoading } = useQuery({
    enabled: !!farmerSlug,
    queryKey: ["farmer-dashboard-orders", farmerSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).filter((o: any) => 
        o.items?.some((item: any) => item.farmer_slug === farmerSlug)
      );
    },
  });

  if (!farmer) return null;

  if (farmer.status !== "approved") {
    return <FarmerPendingDashboard farmer={farmer} />;
  }

  const active = products.filter((p: any) => p.status === "published").length;
  const lowStock = products.filter((p: any) => p.stock < 10);
  const nextPayout = payouts.find((p: any) => p.status !== "paid");
  
  // Calculate lifetime earnings dynamically from non-cancelled orders, deducting 10% admin commission
  const lifetime = orders
    .filter((o: any) => o.status !== "cancelled")
    .reduce((sum: number, o: any) => {
      const farmerItems = o.items?.filter((i: any) => i.farmer_slug === farmerSlug) || [];
      const orderFarmerTotal = farmerItems.reduce((acc: number, item: any) => {
        const basePrice = item.farmer_base_price || Number(item.price || 0) / 1.10;
        return acc + basePrice * Number(item.qty || 1);
      }, 0);
      return sum + orderFarmerTotal;
    }, 0);

  const pendingPackingCount = orders.filter((o: any) => 
    o.items.some((i: any) => i.farmer_slug === farmerSlug && (i.status === "pending" || i.status === "confirmed"))
  ).length;

  return (
    <div className="space-y-8 animate-fade-up">
      <div>
        <h2 className="font-display text-3xl font-semibold">
          Good day, {farmer.full_name.split(" ")[0]}.
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">Here's how your farm is doing today.</p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Lifetime earnings" value={inr(lifetime)} />
        <StatCard 
          label="Incoming orders" 
          value={String(orders.length)} 
          delta={orders.length > 0 ? `${pendingPackingCount} pending packing` : "No pending orders"} 
        />
        <StatCard label="Active listings" value={String(active)} />
        <StatCard
          label="Next payout"
          value={nextPayout ? inr(Number(nextPayout.net_amount)) : "—"}
          delta={
            nextPayout
              ? `Settles ${new Date(nextPayout.period_end).toLocaleDateString()}`
              : "No pending payout"
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Recent Orders */}
        <div className="rounded-2xl border border-border bg-background p-5 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">Recent customer orders</h3>
            <Link to="/farmer-portal/orders" className="font-subhead text-xs text-primary flex items-center gap-1 hover:underline">
              Fulfill orders <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          
          {oLoading ? (
            <div className="grid place-items-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : orders.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center">
              <ShoppingBag className="mx-auto h-8 w-8 text-muted-foreground/30" />
              <p className="mt-2 text-xs text-muted-foreground">No customer orders yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-border font-subhead uppercase tracking-wider text-muted-foreground">
                    <th className="py-2.5">Order</th>
                    <th>Customer</th>
                    <th>Produce Items</th>
                    <th className="text-right">Fulfillment</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 5).map((o: any) => {
                    const orderId = o.order_id || o.id?.slice(0, 8).toUpperCase();
                    // get items belonging to current farmer
                    const farmerItems = o.items.filter((i: any) => i.farmer_slug === farmerSlug);
                    return (
                      <tr key={o.id} className="border-b border-border hover:bg-secondary/15 transition-colors">
                        <td className="py-3 font-display font-medium text-foreground">{orderId}</td>
                        <td className="font-medium text-foreground">{o.customer_name}</td>
                        <td className="text-muted-foreground max-w-[200px] truncate">
                          {farmerItems.map((i: any) => `${i.name} (x${i.qty})`).join(", ")}
                        </td>
                        <td className="text-right">
                          <span className="font-subhead uppercase text-[9px] tracking-wider font-bold text-primary bg-primary/10 border border-primary/15 px-2.5 py-0.5 rounded-full">
                            {o.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: Alerts & Low Stock */}
        <div className="space-y-6">
          
          {/* Low Stock Card */}
          <div className="rounded-2xl border border-border bg-background p-5 space-y-4">
            <h3 className="font-display text-lg font-semibold">Low stock warnings</h3>
            {pLoading ? (
              <div className="grid place-items-center py-5">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              </div>
            ) : lowStock.length === 0 ? (
              <p className="text-xs text-muted-foreground leading-relaxed">
                All crop listings are currently well stocked! Nice job.
              </p>
            ) : (
              <ul className="space-y-2.5">
                {lowStock.slice(0, 4).map((p: any) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 text-xs">
                    <span className="font-medium text-foreground">{p.name}</span>
                    <span className="text-destructive font-semibold bg-destructive/10 px-2 py-0.5 rounded-md">
                      {p.stock} {p.unit} left
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <Link
              to="/farmer-portal/inventory"
              className="font-subhead inline-block text-xs text-primary hover:underline mt-2"
            >
              Update inventory quantities →
            </Link>
          </div>

          {/* Quick stats on products */}
          <div className="rounded-2xl border border-border bg-background p-5 text-xs space-y-3">
            <h4 className="font-display font-semibold text-sm text-foreground">Listings summary</h4>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground font-subhead">Published Products</span>
              <span className="font-bold text-foreground">{active}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground font-subhead">Total Products Drafted</span>
              <span className="font-bold text-foreground">{products.length}</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function FarmerPendingDashboard({ farmer }: { farmer: any }) {
  const farmerId = farmer.id;

  // Query documents status for this farmer
  const { data: docs = [], isLoading } = useQuery({
    enabled: !!farmerId,
    queryKey: ["farmer-dashboard-docs", farmerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("farmer_documents")
        .select("*")
        .eq("farmer_id", farmerId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const getDocStatus = (type: string) => {
    const doc = docs.find((d: any) => d.doc_type === type);
    if (!doc) return { label: "Not Uploaded", cls: "bg-secondary text-muted-foreground", icon: AlertCircle };
    if (doc.status === "verified") return { label: "Verified", cls: "bg-success/10 text-success border border-success/20", icon: CheckCircle2 };
    if (doc.status === "rejected") return { label: "Action Needed", cls: "bg-destructive/10 text-destructive border border-destructive/20", icon: XCircle };
    return { label: "Pending Review", cls: "bg-warning/10 text-warning border border-warning/20", icon: Clock };
  };

  const statusAlerts = {
    pending: {
      title: "KYC Documents Under Review",
      description: "We are currently reviewing your documents (Aadhaar card, PAN card, and Bank Details). Approval typically takes 24 hours. You will receive full access to list products and pricing once approved.",
      cls: "bg-warning/10 border-warning/30 text-warning",
      icon: <Clock className="h-5 w-5 text-warning animate-pulse" />,
    },
    draft: {
      title: "KYC Submission Incomplete",
      description: "You need to upload your Aadhaar, PAN, and Bank details for review before you can sell on the platform. Please complete the submission in the KYC Verification tab.",
      cls: "bg-secondary/50 border-border text-muted-foreground",
      icon: <AlertCircle className="h-5 w-5 text-muted-foreground" />,
    },
    rejected: {
      title: "KYC Review Action Needed",
      description: `Your application was rejected for the following reason: "${farmer.rejection_reason || "Invalid document details"}". Please navigate to the KYC verification tab to re-upload files.`,
      cls: "bg-destructive/10 border-destructive/25 text-destructive",
      icon: <XCircle className="h-5 w-5 text-destructive" />,
    },
    suspended: {
      title: "Account Suspended",
      description: "Your farmer portal access has been temporarily suspended by administration. Please reach out to customer support to resolve your status.",
      cls: "bg-destructive/10 border-destructive/25 text-destructive",
      icon: <XCircle className="h-5 w-5 text-destructive" />,
    },
    approved: {
      title: "Approved",
      description: "Approved",
      cls: "",
      icon: null,
    }
  };

  const alert = statusAlerts[farmer.status as keyof typeof statusAlerts] || statusAlerts.pending;

  return (
    <div className="space-y-8 animate-fade-up">
      <div>
        <h2 className="font-display text-3xl font-semibold">
          Hello, {farmer.full_name.split(" ")[0]}.
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">Your store registration profile status details.</p>
      </div>

      {/* Application Status Banner */}
      <div className={`rounded-2xl border p-5 flex items-start gap-4 ${alert.cls}`}>
        <div className="mt-0.5">{alert.icon}</div>
        <div className="space-y-1">
          <h4 className="font-display text-base font-semibold">{alert.title}</h4>
          <p className="text-sm leading-relaxed opacity-90">{alert.description}</p>
          {(farmer.status === "draft" || farmer.status === "rejected") && (
            <Link
              to="/farmer-portal/kyc"
              className="font-subhead mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary bg-primary/10 px-4.5 py-2 rounded-full border border-primary/15 hover:bg-primary/15 transition-all"
            >
              Go to KYC Verification <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Farm & Personal Details */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-background p-6 space-y-6">
          <div className="border-b border-border pb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold text-foreground">Registered Farm Details</h3>
            <span className="font-subhead rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground capitalize">
              {farmer.status} Profile
            </span>
          </div>

          <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2 text-sm">
            <div className="space-y-1.5">
              <span className="font-subhead text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-muted-foreground" /> Owner Full Name
              </span>
              <p className="font-medium text-foreground">{farmer.full_name}</p>
            </div>
            <div className="space-y-1.5">
              <span className="font-subhead text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Building className="h-3.5 w-3.5 text-muted-foreground" /> Farm Name
              </span>
              <p className="font-medium text-foreground">{farmer.farm_name}</p>
            </div>
            <div className="space-y-1.5">
              <span className="font-subhead text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" /> Location
              </span>
              <p className="font-medium text-foreground">
                {farmer.village}, {farmer.district || ""}, {farmer.state} - {farmer.pincode || ""}
              </p>
            </div>
            <div className="space-y-1.5">
              <span className="font-subhead text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" /> Experience & Area
              </span>
              <p className="font-medium text-foreground">
                {farmer.years_farming || 0} Years Farming · {farmer.farm_size_acres || 0} Acres
              </p>
            </div>
            <div className="space-y-1.5">
              <span className="font-subhead text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Sprout className="h-3.5 w-3.5 text-muted-foreground" /> Farming Method
              </span>
              <p className="font-medium text-foreground capitalize">{farmer.farming_method || "Natural / Organic"}</p>
            </div>
            <div className="space-y-1.5">
              <span className="font-subhead text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Sprout className="h-3.5 w-3.5 text-muted-foreground" /> Primary Crops
              </span>
              <p className="font-medium text-foreground capitalize">
                {farmer.crops?.join(", ") || "No crops specified"}
              </p>
            </div>
          </div>

          <div className="border-t border-border pt-6 space-y-4">
            <h4 className="font-display text-sm font-semibold text-foreground flex items-center gap-2">
              <Coins className="h-4.5 w-4.5 text-muted-foreground" /> Settlement Bank Details
            </h4>
            <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2 text-xs">
              <div className="space-y-1">
                <span className="text-muted-foreground">Account Holder Name</span>
                <p className="font-medium text-foreground">{farmer.bank_account_name || "—"}</p>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground">Bank Name</span>
                <p className="font-medium text-foreground">{farmer.bank_name || "—"}</p>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground">Account Number</span>
                <p className="font-medium text-foreground">
                  {farmer.bank_account_number
                    ? `••••••${farmer.bank_account_number.slice(-4)}`
                    : "—"}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground">IFSC Code</span>
                <p className="font-medium text-foreground">{farmer.bank_ifsc || "—"}</p>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <span className="text-muted-foreground">UPI ID</span>
                <p className="font-medium text-foreground">{farmer.upi_id || "—"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* KYC Document Checklist */}
        <div className="rounded-2xl border border-border bg-background p-6 space-y-6">
          <h3 className="font-display text-lg font-semibold text-foreground border-b border-border pb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" /> KYC Verification Checklist
          </h3>

          {isLoading ? (
            <div className="grid place-items-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : (
            <ul className="space-y-4">
              {[
                { key: "aadhaar", label: "Aadhaar Card (Required)" },
                { key: "pan", label: "PAN Card (Required)" },
                { key: "bank_passbook", label: "Bank Passbook/Cheque" },
                { key: "certification", label: "Organic Certification" },
              ].map((item) => {
                const stat = getDocStatus(item.key);
                const Icon = stat.icon;
                return (
                  <li key={item.key} className="flex items-center justify-between border-b border-border/40 pb-3 last:border-b-0 last:pb-0">
                    <div className="space-y-1">
                      <p className="font-display text-sm font-medium text-foreground">{item.label}</p>
                      {docs.find((d: any) => d.doc_type === item.key)?.label && (
                        <p className="text-[10px] text-muted-foreground truncate max-w-[150px]">
                          {docs.find((d: any) => d.doc_type === item.key)?.label}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`font-subhead inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold ${stat.cls}`}>
                        <Icon className="h-3 w-3" /> {stat.label}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
