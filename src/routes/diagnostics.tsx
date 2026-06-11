import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getStartupErrors, clearStartupErrors } from "@/lib/sentry";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/diagnostics")({
  head: () => ({
    meta: [{ title: "Diagnostics — Prajnaa Farm" }, { name: "robots", content: "noindex" }],
  }),
  component: DiagnosticsPage,
});

type HealthItem = { label: string; status: "ok" | "warn" | "fail"; detail?: string };

function DiagnosticsPage() {
  const [errors, setErrors] = useState(() => getStartupErrors());
  const [health, setHealth] = useState<HealthItem[]>([]);
  const [authPkg, setAuthPkg] = useState<string>("unknown");

  useEffect(() => {
    const items: HealthItem[] = [];

    // Build / runtime
    items.push({
      label: "Build mode",
      status: "ok",
      detail: import.meta.env.MODE,
    });
    items.push({
      label: "Sentry DSN",
      status: import.meta.env.VITE_SENTRY_DSN ? "ok" : "warn",
      detail: import.meta.env.VITE_SENTRY_DSN ? "configured" : "not set (VITE_SENTRY_DSN)",
    });
    items.push({
      label: "Supabase URL",
      status: import.meta.env.VITE_SUPABASE_URL ? "ok" : "fail",
      detail: import.meta.env.VITE_SUPABASE_URL ? "configured" : "missing",
    });

    setHealth(items);

    // Auth ping
    supabase.auth.getSession().then(({ error }: any) => {
      setHealth((prev) => [
        ...prev,
        {
          label: "Auth session check",
          status: error ? "fail" : "ok",
          detail: error?.message ?? "reachable",
        },
      ]);
    });

    // Package version (best effort from import.meta.env injected build info)
    fetch("/package-meta.json")
      .then((r) => (r.ok ? r.json() : null))
      .then((meta) => {
        if (meta?.authPkg) setAuthPkg(meta.authPkg);
      })
      .catch(() => {});
  }, []);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-display text-3xl font-semibold">Diagnostics</h1>
      <p className="mt-2 text-sm text-muted-foreground">Internal health overview. Not indexed.</p>

      <section className="mt-8 rounded-2xl border border-border bg-card p-5">
        <h2 className="font-display text-lg font-semibold">Build & services</h2>
        <ul className="mt-4 space-y-2 text-sm">
          {health.map((h) => (
            <li key={h.label} className="flex items-center justify-between gap-4">
              <span className="font-medium">{h.label}</span>
              <span className="flex items-center gap-2 text-muted-foreground">
                <Dot status={h.status} />
                <span>{h.detail}</span>
              </span>
            </li>
          ))}
          <li className="flex items-center justify-between gap-4">
            <span className="font-medium">@lovable.dev/cloud-auth-js</span>
            <span className="text-muted-foreground">{authPkg}</span>
          </li>
        </ul>
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Recent startup errors</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              clearStartupErrors();
              setErrors([]);
            }}
          >
            Clear
          </Button>
        </div>
        {errors.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No errors captured in this session.</p>
        ) : (
          <ul className="mt-4 space-y-3 text-sm">
            {errors.map((e, i) => (
              <li key={i} className="rounded-lg border border-border/60 p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{e.message}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(e.at).toLocaleTimeString()}
                  </span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{e.source}</div>
                {e.stack && (
                  <pre className="mt-2 overflow-x-auto rounded bg-muted/40 p-2 text-[11px] leading-snug">
                    {e.stack}
                  </pre>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-card p-5">
        <h2 className="font-display text-lg font-semibold">Stuck after install?</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          504s from <code>/node_modules/.vite/deps/*</code> mean the optimized-deps cache went
          stale. Run:
        </p>
        <pre className="mt-2 overflow-x-auto rounded bg-muted/40 p-3 text-xs">
          {`bun run fresh   # clears .vite cache and reinstalls`}
        </pre>
      </section>
    </main>
  );
}

function Dot({ status }: { status: "ok" | "warn" | "fail" }) {
  const color =
    status === "ok" ? "bg-emerald-500" : status === "warn" ? "bg-amber-500" : "bg-rose-500";
  return <span className={`inline-block h-2 w-2 rounded-full ${color}`} aria-hidden />;
}
