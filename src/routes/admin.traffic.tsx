import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Loader2,
  Search,
  Laptop,
  Smartphone,
  Tablet,
  Globe,
  RefreshCw,
  User,
  UserCheck,
  MapPin,
  Server,
  Activity,
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  FilterX,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/dashboard/shell";
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

export const Route = createFileRoute("/admin/traffic")({
  component: AdminTraffic,
});

// Helper for mapping country name to flag emoji
function getCountryFlag(countryName: string): string {
  if (!countryName) return "🌐";
  const name = countryName.toLowerCase().trim();
  if (name.includes("india")) return "🇮🇳";
  if (name.includes("united states") || name.includes("us") || name === "usa") return "🇺🇸";
  if (name.includes("united kingdom") || name.includes("uk") || name === "gb") return "🇬🇧";
  if (name.includes("canada")) return "🇨🇦";
  if (name.includes("australia")) return "🇦🇺";
  if (name.includes("germany")) return "🇩🇪";
  if (name.includes("france")) return "🇫🇷";
  if (name.includes("japan")) return "🇯🇵";
  if (name.includes("china")) return "🇨🇳";
  if (name.includes("singapore")) return "🇸🇬";
  if (name.includes("united arab emirates") || name.includes("uae")) return "🇦🇪";
  if (name.includes("netherlands")) return "🇳🇱";
  if (name.includes("switzerland")) return "🇨🇭";
  if (name.includes("brazil")) return "🇧🇷";
  if (name.includes("south africa")) return "🇿🇦";
  if (name.includes("italy")) return "🇮🇹";
  if (name.includes("spain")) return "🇪🇸";
  if (name.includes("russia")) return "🇷🇺";
  return "🌐";
}

// Helper for human-readable relative time
function formatTime(isoString: string) {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return (
      date.toLocaleDateString("en-IN", { month: "short", day: "numeric" }) +
      " " +
      date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
    );
  } catch (e) {
    return "Unknown";
  }
}

// Palette matches other admin dashboards
const CHART_COLORS = ["#0F3D2E", "#B47A46", "#8FBC8F", "#D2B48C", "#4A6B5D"];

function AdminTraffic() {
  const [searchTerm, setSearchTerm] = useState("");
  const [deviceFilter, setDeviceFilter] = useState("all");
  const [userTypeFilter, setUserTypeFilter] = useState("all");
  const [browserFilter, setBrowserFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const {
    data = { logs: [], profiles: [] },
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["admin-traffic"],
    queryFn: async () => {
      const [logsRes, profilesRes] = await Promise.all([
        supabase
          .from("traffic_logs")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(1000),
        supabase.from("profiles").select("id,full_name,email"),
      ]);

      if (logsRes.error) throw logsRes.error;
      if (profilesRes.error) throw profilesRes.error;

      return {
        logs: logsRes.data ?? [],
        profiles: profilesRes.data ?? [],
      };
    },
    refetchInterval: 12000, // Autorefresh every 12 seconds
  });

  // Profile Map for fast lookup
  const profileMap = useMemo(() => {
    const map = new Map<string, { full_name: string; email: string }>();
    data.profiles.forEach((p: any) => {
      map.set(p.id, { full_name: p.full_name || "Anonymous User", email: p.email || "" });
    });
    return map;
  }, [data.profiles]);

  // Combined filters
  const filteredLogs = useMemo(() => {
    return data.logs.filter((log: any) => {
      // 1. Text Search
      if (searchTerm.trim()) {
        const s = searchTerm.toLowerCase();
        const ip = (log.ip ?? "").toLowerCase();
        const city = (log.city ?? "").toLowerCase();
        const region = (log.region ?? "").toLowerCase();
        const country = (log.country ?? "").toLowerCase();
        const path = (log.path ?? "").toLowerCase();
        const isp = (log.isp ?? "").toLowerCase();
        const userName = log.user_id ? (profileMap.get(log.user_id)?.full_name ?? "").toLowerCase() : "";
        const userEmail = log.user_id ? (profileMap.get(log.user_id)?.email ?? "").toLowerCase() : "";

        const matchesSearch =
          ip.includes(s) ||
          city.includes(s) ||
          region.includes(s) ||
          country.includes(s) ||
          path.includes(s) ||
          isp.includes(s) ||
          userName.includes(s) ||
          userEmail.includes(s);

        if (!matchesSearch) return false;
      }

      // 2. Device Filter
      if (deviceFilter !== "all" && log.device_type !== deviceFilter) {
        return false;
      }

      // 3. User Type Filter
      if (userTypeFilter !== "all") {
        if (userTypeFilter === "registered" && !log.user_id) return false;
        if (userTypeFilter === "guest" && log.user_id) return false;
      }

      // 4. Browser Filter
      if (browserFilter !== "all" && log.browser !== browserFilter) {
        return false;
      }

      return true;
    });
  }, [data.logs, searchTerm, deviceFilter, userTypeFilter, browserFilter, profileMap]);

  // Reset page on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, deviceFilter, userTypeFilter, browserFilter]);

  // Pagination calculations
  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLogs, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / itemsPerPage));

  // Stat computations
  const stats = useMemo(() => {
    const logs = data.logs;
    const totalViews = logs.length;
    
    // Unique IP addresses
    const uniqueIps = new Set(logs.map((l: any) => l.ip)).size;

    // Active sessions (views in the last 15 minutes)
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
    const activeVisitors = logs.filter((l: any) => {
      try {
        return new Date(l.created_at) >= fifteenMinsAgo;
      } catch {
        return false;
      }
    }).length;

    // Top visited path
    const pathCounts = new Map<string, number>();
    logs.forEach((l: any) => {
      if (l.path) {
        pathCounts.set(l.path, (pathCounts.get(l.path) ?? 0) + 1);
      }
    });
    let topPath = "N/A";
    let topPathCount = 0;
    pathCounts.forEach((count, path) => {
      if (count > topPathCount) {
        topPathCount = count;
        topPath = path;
      }
    });

    return {
      totalViews,
      uniqueIps,
      activeVisitors,
      topPath: `${topPath} (${topPathCount} hits)`,
    };
  }, [data.logs]);

  // Chart data calculations
  const chartData = useMemo(() => {
    const logs = data.logs;
    
    // 1. Hourly Traffic over the last 24 hours
    // Create map for last 7 days daily counts
    const dailyViews = new Map<string, number>();
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const key = d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
      dailyViews.set(key, 0);
    }

    logs.forEach((l: any) => {
      try {
        const date = new Date(l.created_at);
        const key = date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
        if (dailyViews.has(key)) {
          dailyViews.set(key, (dailyViews.get(key) ?? 0) + 1);
        }
      } catch (e) {
        // ignore invalid dates
      }
    });

    const trend = [...dailyViews.entries()].map(([date, views]) => ({
      date,
      "Page Views": views,
    }));

    // 2. Device Breakdown
    const devices = new Map<string, number>();
    logs.forEach((l: any) => {
      const dev = l.device_type || "Unknown";
      devices.set(dev, (devices.get(dev) ?? 0) + 1);
    });
    const deviceBreakdown = [...devices.entries()].map(([name, value]) => ({
      name,
      value,
    })).sort((a, b) => b.value - a.value);

    // 3. Browser Breakdown
    const browsers = new Map<string, number>();
    logs.forEach((l: any) => {
      const brow = l.browser || "Unknown";
      browsers.set(brow, (browsers.get(brow) ?? 0) + 1);
    });
    const browserBreakdown = [...browsers.entries()].map(([name, value]) => ({
      name,
      value,
    })).sort((a, b) => b.value - a.value);

    return {
      trend,
      deviceBreakdown,
      browserBreakdown,
    };
  }, [data.logs]);

  const resetFilters = () => {
    setSearchTerm("");
    setDeviceFilter("all");
    setUserTypeFilter("all");
    setBrowserFilter("all");
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-semibold text-foreground flex items-center gap-2.5">
            Live Traffic
            <span className="relative flex h-3.5 w-3.5 items-center justify-center">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
            </span>
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitor anonymous and registered visitor behaviors and geographical locations in real time.
          </p>
        </div>
        
        <button
          onClick={() => refetch()}
          disabled={isLoading || isRefetching}
          className="font-subhead inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground hover:bg-secondary disabled:opacity-50 transition"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${(isLoading || isRefetching) ? "animate-spin" : ""}`} />
          {(isLoading || isRefetching) ? "Refreshing..." : "Refresh Logs"}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Page Views"
          value={String(stats.totalViews)}
          delta="Last 1000 entries logged"
        />
        <StatCard
          label="Unique Visitors (IPs)"
          value={String(stats.uniqueIps)}
          delta="Distinct network endpoints"
        />
        <StatCard
          label="Active Visitors"
          value={String(stats.activeVisitors)}
          delta="Hits in the last 15 minutes"
        />
        <StatCard
          label="Top Visited Route"
          value={stats.topPath.split(" ")[0]}
          delta={stats.topPath.split(" ").slice(1).join(" ") || "Most popular landing page"}
        />
      </div>

      {/* Dashboard Charts */}
      {isLoading ? (
        <div className="grid h-64 place-items-center rounded-2xl border border-border bg-background">
          <div className="text-center space-y-2">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Loading geolocated traffic overview...</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Traffic Volume Area Chart */}
          <div className="lg:col-span-2 rounded-2xl border border-border bg-background p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-display text-base font-semibold text-foreground">Traffic Trend</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Page views volume over the last 7 days.</p>
            </div>
            <div className="h-56 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData.trend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0F3D2E" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#0F3D2E" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E9EFE9" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} style={{ fontSize: 10, fill: "#888" }} />
                  <YAxis tickLine={false} axisLine={false} style={{ fontSize: 10, fill: "#888" }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #E9EFE9",
                      fontFamily: "inherit",
                      fontSize: 11,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="Page Views"
                    stroke="#0F3D2E"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorViews)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Device Breakdown Donut Chart */}
          <div className="rounded-2xl border border-border bg-background p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-display text-base font-semibold text-foreground">Device & Browser</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Device type distribution of incoming traffic.</p>
            </div>
            
            {chartData.deviceBreakdown.length === 0 ? (
              <p className="text-xs text-muted-foreground py-12 text-center">No device logs available.</p>
            ) : (
              <div className="h-44 w-full flex items-center justify-center relative mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData.deviceBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {chartData.deviceBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} views`, "Device"]} />
                    <Legend
                      verticalAlign="bottom"
                      height={24}
                      iconSize={10}
                      style={{ fontSize: 10 }}
                      formatter={(value, entry: any) => {
                        const count = entry.payload?.value || 0;
                        return `${value} (${count})`;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            
            <div className="mt-3 border-t border-border pt-3">
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>Primary Browser:</span>
                <span className="font-semibold text-foreground">
                  {chartData.browserBreakdown[0]?.name || "N/A"} ({chartData.browserBreakdown[0]?.value || 0})
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Table Area */}
      <div className="space-y-4">
        {/* Filters Panel */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-secondary/20 p-4 rounded-2xl border border-border">
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search IP, City, Region, ISP, Path..."
                className="font-subhead h-9 w-full rounded-full border border-border bg-background pl-9 pr-3 text-xs outline-none focus:border-primary transition"
              />
            </div>

            {/* Device Filter */}
            <select
              value={deviceFilter}
              onChange={(e) => setDeviceFilter(e.target.value)}
              className="font-subhead h-9 rounded-full border border-border bg-background px-3 py-1 text-xs outline-none focus:border-primary cursor-pointer"
            >
              <option value="all">All Devices</option>
              <option value="Desktop">Desktop Only</option>
              <option value="Mobile">Mobile Only</option>
              <option value="Tablet">Tablet Only</option>
            </select>

            {/* User Type Filter */}
            <select
              value={userTypeFilter}
              onChange={(e) => setUserTypeFilter(e.target.value)}
              className="font-subhead h-9 rounded-full border border-border bg-background px-3 py-1 text-xs outline-none focus:border-primary cursor-pointer"
            >
              <option value="all">All Visitor Types</option>
              <option value="guest">Anonymous Guests</option>
              <option value="registered">Registered Members</option>
            </select>

            {/* Browser Filter */}
            <select
              value={browserFilter}
              onChange={(e) => setBrowserFilter(e.target.value)}
              className="font-subhead h-9 rounded-full border border-border bg-background px-3 py-1 text-xs outline-none focus:border-primary cursor-pointer"
            >
              <option value="all">All Browsers</option>
              <option value="Chrome">Chrome</option>
              <option value="Safari">Safari</option>
              <option value="Firefox">Firefox</option>
              <option value="Edge">Edge</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {(searchTerm || deviceFilter !== "all" || userTypeFilter !== "all" || browserFilter !== "all") && (
            <button
              onClick={resetFilters}
              className="font-subhead inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium py-1 px-3 rounded-full hover:bg-secondary/40 transition"
            >
              <FilterX className="h-3.5 w-3.5" />
              Reset Filters
            </button>
          )}
        </div>

        {/* Traffic Logs Table */}
        <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
          {isLoading ? (
            <div className="grid place-items-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-20 text-center space-y-2">
              <p className="text-sm text-muted-foreground">No traffic logs found matching the selected filters.</p>
              <button
                onClick={resetFilters}
                className="text-xs text-primary font-semibold underline hover:text-primary/80"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[900px]">
                <thead className="bg-secondary/40 border-b border-border">
                  <tr className="font-subhead text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                    <th className="px-5 py-3.5 text-left font-semibold">Time</th>
                    <th className="text-left font-semibold">Visitor / Type</th>
                    <th className="text-left font-semibold">IP Address</th>
                    <th className="text-left font-semibold">Location</th>
                    <th className="text-left font-semibold">Visited Route</th>
                    <th className="text-left font-semibold">Device & Browser</th>
                    <th className="px-5 text-left font-semibold">ISP / Network</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedLogs.map((log: any) => {
                    const isRegistered = !!log.user_id;
                    const profile = isRegistered ? profileMap.get(log.user_id) : null;
                    const flag = getCountryFlag(log.country);

                    return (
                      <tr
                        key={log.id}
                        className="hover:bg-secondary/15 transition-colors duration-150"
                      >
                        {/* Time */}
                        <td className="px-5 py-4 whitespace-nowrap font-medium text-foreground">
                          {formatTime(log.created_at)}
                        </td>

                        {/* Visitor / Type */}
                        <td className="py-4 whitespace-nowrap">
                          {isRegistered ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                                <UserCheck className="h-3 w-3" />
                                Registered
                              </span>
                              <p className="font-medium text-foreground max-w-[150px] truncate" title={profile?.full_name}>
                                {profile?.full_name}
                              </p>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                              <User className="h-3 w-3" />
                              Guest
                            </span>
                          )}
                        </td>

                        {/* IP Address */}
                        <td className="py-4 whitespace-nowrap font-mono text-muted-foreground select-all">
                          {log.ip || "—"}
                        </td>

                        {/* Location */}
                        <td className="py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="text-base" title={log.country}>
                              {flag}
                            </span>
                            <div className="text-left">
                              <p className="font-medium text-foreground">
                                {log.city || "Unknown City"}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {[log.region, log.country].filter(Boolean).join(", ") || "—"}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Visited Route */}
                        <td className="py-4 whitespace-nowrap">
                          <span className="inline-block rounded-md bg-secondary/50 px-2 py-1 font-mono text-[10px] text-foreground border border-border">
                            {log.path || "/"}
                          </span>
                        </td>

                        {/* Device & Browser */}
                        <td className="py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {log.device_type === "Mobile" ? (
                              <Smartphone className="h-3.5 w-3.5 text-muted-foreground" />
                            ) : log.device_type === "Tablet" ? (
                              <Tablet className="h-3.5 w-3.5 text-muted-foreground" />
                            ) : (
                              <Laptop className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                            <div>
                              <p className="font-medium text-foreground">
                                {log.device_type || "Desktop"}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {log.browser || "Unknown"} Browser
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* ISP / Network */}
                        <td className="px-5 py-4 whitespace-nowrap text-muted-foreground max-w-[180px] truncate" title={log.isp}>
                          <div className="flex items-center gap-1.5">
                            <Server className="h-3 w-3 flex-shrink-0 text-muted-foreground/60" />
                            <span>{log.isp || "Unknown ISP"}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {filteredLogs.length > 0 && (
          <div className="flex items-center justify-between border-t border-border pt-4">
            <p className="text-xs text-muted-foreground">
              Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
              <span className="font-medium">
                {Math.min(currentPage * itemsPerPage, filteredLogs.length)}
              </span>{" "}
              of <span className="font-medium">{filteredLogs.length}</span> matching entries
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background hover:bg-secondary disabled:opacity-40 transition"
                aria-label="Previous Page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background hover:bg-secondary disabled:opacity-40 transition"
                aria-label="Next Page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
