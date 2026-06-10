import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Search } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/customers")({ component: AdminCustomers });

function AdminCustomers() {
  const [q, setQ] = useState("");
  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["admin-customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = customers.filter((c) => {
    if (!q.trim()) return true;
    const s = q.toLowerCase();
    return (
      (c.full_name ?? "").toLowerCase().includes(s) ||
      (c.email ?? "").toLowerCase().includes(s) ||
      (c.phone ?? "").toLowerCase().includes(s) ||
      (c.city ?? "").toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl font-semibold">Customers</h2>
          <p className="mt-1 text-sm text-muted-foreground">{customers.length} registered customers.</p>
        </div>
        <label className="relative w-72 max-w-full">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, email, phone, city"
            className="font-subhead h-10 w-full rounded-full border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </label>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-background">
        {isLoading ? (
          <div className="grid place-items-center py-20"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <p className="py-20 text-center text-sm text-muted-foreground">No customers match.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-secondary/40">
              <tr className="font-subhead text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                <th className="px-5 py-3 text-left">Name</th>
                <th className="text-left">Email</th>
                <th className="text-left">Phone</th>
                <th className="text-left">Location</th>
                <th className="px-5 text-right">Joined</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-t border-border">
                  <td className="px-5 py-4 font-medium">{c.full_name || "—"}</td>
                  <td className="text-muted-foreground">{c.email || "—"}</td>
                  <td className="text-muted-foreground">{c.phone || "—"}</td>
                  <td className="text-muted-foreground">{[c.city, c.state].filter(Boolean).join(", ") || "—"}</td>
                  <td className="px-5 text-right text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
