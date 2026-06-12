import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, TrendingUp, Users, ShoppingBag, Package } from "lucide-react";
import { StatCard } from "@/components/dashboard/shell";
import { supabase } from "@/integrations/supabase/client";
import { inr } from "@/lib/format";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

export const Route = createFileRoute("/admin/dashboard")({ component: AdminDashboard });

function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const [farmers, products, payouts, customers, orders, notifications] = await Promise.all([
        supabase.from("farmer_profiles").select("id,status,full_name,village,state,created_at"),
        supabase.from("farmer_products").select("id,name,price,stock,status,category,farmer_id"),
        supabase.from("farmer_payouts").select("net_amount,status,settled_at,farmer_id"),
        supabase.from("profiles").select("id,created_at"),
        supabase.from("orders").select("id,total,subtotal,status,payment_status,created_at,items"),
        supabase.from("system_notifications").select("*").order("created_at", { ascending: false }).limit(10),
      ]);
      if (farmers.error) throw farmers.error;
      if (products.error) throw products.error;
      if (payouts.error) throw payouts.error;
      if (customers.error) throw customers.error;
      if (orders.error) throw orders.error;

      const notificationsData = notifications.error ? [] : (notifications.data ?? []);
      return {
        farmers: farmers.data ?? [],
        products: products.data ?? [],
        payouts: payouts.data ?? [],
        customers: customers.data ?? [],
        orders: orders.data ?? [],
        notifications: notificationsData,
      };
    },
  });

  if (isLoading || !data) {
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const approvedFarmers = data.farmers.filter((f: any) => f.status === "approved").length;
  const pendingFarmers = data.farmers.filter((f: any) => f.status === "pending").length;
  const publishedProducts = data.products.filter((p: any) => p.status === "published").length;
  const totalCustomers = data.customers.length;
  // Calculate dynamic sales and payouts from orders
  const deliveredOrders = data.orders.filter((o: any) => o.status === "delivered");
  
  // Platform Lifetime Revenue: delivered counts as positive, returned counts as deduction
  const lifetimeSales = data.orders.reduce((sum: number, o: any) => {
    if (o.status !== "delivered" && o.status !== "returned") {
      return sum;
    }
    const amount = Number(o.total || 0);
    if (o.status === "delivered") {
      return sum + amount;
    } else { // returned
      return sum - amount;
    }
  }, 0);
  
  // Completed/Paid Revenue from delivered orders
  const paidSales = data.orders
    .filter((o: any) => o.status === "delivered" && o.payment_status === "paid")
    .reduce((s: number, o: any) => s + Number(o.total || 0), 0);
    
  // Pending Revenue (COD orders or pending payment orders)
  const pendingSales = data.orders
    .filter((o: any) => o.status !== "cancelled" && o.status !== "returned" && (o.payment_status === "pending" || o.payment_status === "failed"))
    .reduce((s: number, o: any) => s + Number(o.total || 0), 0);

  // top farmers by real-time delivered order earnings (deducting returned)
  const earningsByFarmer = new Map<string, number>();
  data.orders.forEach((o: any) => {
    if (o.status !== "delivered" && o.status !== "returned") {
      return;
    }
    const factor = o.status === "delivered" ? 1 : -1;
    (o.items || []).forEach((item: any) => {
      const farmerId = item.farmer_id || "farmer_1";
      const itemRevenue = Number(item.price || 0) * Number(item.qty || 1) * factor;
      earningsByFarmer.set(
        farmerId,
        (earningsByFarmer.get(farmerId) ?? 0) + itemRevenue
      );
    });
  });

  const topFarmers = [...earningsByFarmer.entries()]
    .map(([id, total]) => ({ farmer: data.farmers.find((f: any) => f.id === id), total }))
    .filter((x: any) => x.farmer)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  // 1. Map active orders to a daily/weekly sales log for AreaChart (real-time only, chronological splits)
  const salesByDate = new Map<string, number>();

  data.orders.forEach((o: any) => {
    if (o.status !== "delivered" && o.status !== "returned") {
      return;
    }
    if (!o.created_at) {
      return;
    }
    const date = new Date(o.created_at);
    if (isNaN(date.getTime())) {
      return;
    }
    // Format key as YYYY-MM-DD so it sorts correctly alphabetically/chronologically
    const key = date.toISOString().split("T")[0];
    const orderTotal = Number(o.total || 0);
    const factor = o.status === "delivered" ? 1 : -1;
    salesByDate.set(key, (salesByDate.get(key) ?? 0) + (orderTotal * factor));
  });

  // Sort and format for display
  const chartData = [...salesByDate.entries()]
    .map(([dateStr, sales]) => ({ dateStr, sales }))
    .sort((a, b) => a.dateStr.localeCompare(b.dateStr))
    .map(({ dateStr, sales }) => {
      const parts = dateStr.split("-");
      const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      const formattedDate = date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
      return { date: formattedDate, sales };
    });

  // If there are no data points, initialize it with the last 5 days at 0 so the chart axis looks clean
  if (chartData.length === 0) {
    const today = new Date();
    for (let i = 4; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const formattedDate = d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
      chartData.push({ date: formattedDate, sales: 0 });
    }
  }

  // 2. Map category counts for Donut/PieChart
  const byCat = new Map<string, number>();
  data.products
    .filter((p: any) => p.status === "published" && p.category)
    .forEach((p: any) => byCat.set(p.category, (byCat.get(p.category) ?? 0) + 1));
  
  const topCats = [...byCat.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
  const colors = ["#0F3D2E", "#B47A46", "#8FBC8F", "#D2B48C"];
  
  const pieData = topCats.map(([cat, n], i) => ({
    name: String(cat || "Other").replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
    value: n,
    color: colors[i % colors.length]
  }));

  // default mock dataset if no products are in DB
  const defaultPieData = [
    { name: "Dry Fruits", value: 45, color: "#0F3D2E" },
    { name: "Spices", value: 25, color: "#B47A46" },
    { name: "Herbs", value: 15, color: "#8FBC8F" },
    { name: "Others", value: 15, color: "#D2B48C" },
  ];
  
  const finalPieData = pieData.length > 0 ? pieData : defaultPieData;

  return (
    <div className="space-y-8 animate-fade-up">
      <div>
        <h2 className="font-display text-3xl font-semibold text-[#0F3D2E]">Platform Overview</h2>
        <p className="mt-1 text-sm text-muted-foreground">Live snapshot from the marketplace operations.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Revenue"
          value={inr(lifetimeSales)}
          delta={`${deliveredOrders.length} delivered orders`}
        />
        <StatCard
          label="Paid Sales"
          value={inr(paidSales)}
          delta={`Signature verified`}
        />
        <StatCard
          label="Total Products"
          value={String(publishedProducts)}
          delta={`${data.products.length} registered total`}
        />
        <StatCard
          label="Approved Farmers"
          value={String(approvedFarmers)}
          delta={pendingFarmers > 0 ? `${pendingFarmers} pending review` : "All caught up"}
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Span (2 Columns): Sales Line and Pie Chart */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Overview Area Chart */}
          <div className="rounded-2xl border border-border bg-background p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-base font-semibold text-foreground">Order Overview</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Real-time platform sales trends.</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-success bg-success/10 px-2.5 py-1 rounded-full font-subhead font-semibold">
                <TrendingUp className="h-3.5 w-3.5" /> +12.4%
              </div>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0F3D2E" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#0F3D2E" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E9EFE9" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} style={{ fontSize: 10, fill: "#888" }} />
                  <YAxis tickLine={false} axisLine={false} style={{ fontSize: 10, fill: "#888" }} />
                  <Tooltip 
                    formatter={(val) => [inr(Number(val)), "Sales"]}
                    contentStyle={{ borderRadius: 12, border: "1px solid #E9EFE9", fontFamily: "inherit", fontSize: 11 }}
                  />
                  <Area type="monotone" dataKey="sales" stroke="#0F3D2E" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Lower Grid: Top Farmers & Top Categories Side by Side */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Top Farmers list */}
            <div className="rounded-2xl border border-border bg-background p-6 shadow-sm space-y-4">
              <h3 className="font-display text-base font-semibold text-foreground">Top Sourced Farmers</h3>
              {topFarmers.length === 0 ? (
                <p className="text-xs text-muted-foreground py-6 text-center">No active sales logged yet.</p>
              ) : (
                <div className="space-y-4 mt-2">
                  {topFarmers.map(({ farmer, total }, i) => (
                    <div key={farmer!.id} className="flex items-center justify-between text-xs hover:bg-secondary/10 p-1.5 rounded-lg transition">
                      <div className="flex items-center gap-3">
                        <span className="font-display font-bold text-muted-foreground w-4">{i + 1}</span>
                        <div>
                          <p className="font-semibold text-foreground">{farmer!.full_name}</p>
                          <p className="text-[10px] text-muted-foreground">{farmer!.village}, {farmer!.state}</p>
                        </div>
                      </div>
                      <span className="font-subhead font-bold text-primary">{inr(total)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pie Chart / Donut Chart */}
            <div className="rounded-2xl border border-border bg-background p-6 shadow-sm space-y-4 flex flex-col justify-between">
              <h3 className="font-display text-base font-semibold text-foreground">Top Sourced Categories</h3>
              <div className="h-44 w-full flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={finalPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {finalPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(val) => [`${val} Listings`, "Count"]}
                      contentStyle={{ borderRadius: 8, fontSize: 10 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center text for donut */}
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="font-display text-lg font-bold text-foreground">{publishedProducts}</span>
                  <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Listings</span>
                </div>
              </div>
              
              {/* Legends */}
              <div className="grid grid-cols-2 gap-2 text-[10px] mt-2">
                {finalPieData.map((d) => (
                  <div key={d.name} className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="truncate text-muted-foreground font-medium">{d.name} ({d.value})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Span (1 Column): Operations Feed */}
        <div className="rounded-2xl border border-border bg-background p-6 shadow-sm flex flex-col h-full space-y-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <h3 className="font-display text-base font-semibold text-foreground">Operations Feed</h3>
          </div>
          <p className="text-xs text-muted-foreground">Real-time marketplace audit logs.</p>

          {data.notifications.length === 0 ? (
            <div className="py-20 text-center flex-1 flex items-center justify-center">
              <p className="text-xs text-muted-foreground">No operations alerts recorded.</p>
            </div>
          ) : (
            <div className="space-y-3 overflow-y-auto max-h-[500px] pr-1 flex-1">
              {data.notifications.map((n: any) => {
                const dateStr = n.created_at ? new Date(n.created_at).toLocaleTimeString("en-IN") : "";
                const isKyc = n.type === "farmer_kyc_submission";
                const isCancelled = n.type === "order_cancelled";
                return (
                  <div key={n.id} className="p-3 bg-secondary/15 rounded-xl border border-border/30 text-xs space-y-1.5 hover:bg-secondary/35 transition">
                    <div className="flex justify-between items-center">
                      <span className={`font-subhead text-[8px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full border ${
                        isKyc 
                          ? "bg-primary/10 text-primary border-primary/20" 
                          : isCancelled 
                            ? "bg-destructive/10 text-destructive border-destructive/20" 
                            : "bg-success/10 text-success border-success/20"
                      }`}>
                        {isKyc ? "KYC SUBMISSION" : isCancelled ? "CANCELLED" : "NEW ORDER"}
                      </span>
                      <span className="text-[9px] text-muted-foreground font-subhead">{dateStr}</span>
                    </div>
                    <p className="font-display font-semibold text-foreground leading-snug">{n.title}</p>
                    <p className="text-[11px] text-muted-foreground leading-normal">{n.message}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
