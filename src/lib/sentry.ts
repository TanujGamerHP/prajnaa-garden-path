// Lightweight Sentry init. Only activates when VITE_SENTRY_DSN is set.
import * as Sentry from "@sentry/react";

type StartupErrorEntry = {
  message: string;
  stack?: string;
  source: string;
  at: number;
};

const STARTUP_ERROR_KEY = "__prajnaa_startup_errors";
const MAX_ENTRIES = 25;

function pushStartupError(entry: StartupErrorEntry) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.sessionStorage.getItem(STARTUP_ERROR_KEY);
    const list: StartupErrorEntry[] = raw ? JSON.parse(raw) : [];
    list.unshift(entry);
    window.sessionStorage.setItem(
      STARTUP_ERROR_KEY,
      JSON.stringify(list.slice(0, MAX_ENTRIES)),
    );
  } catch {
    /* ignore */
  }
}

export function getStartupErrors(): StartupErrorEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(STARTUP_ERROR_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function clearStartupErrors() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(STARTUP_ERROR_KEY);
}

let initialized = false;

export function initSentry() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;

  if (dsn) {
    Sentry.init({
      dsn,
      environment: import.meta.env.MODE,
      tracesSampleRate: 0.1,
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 1.0,
    });
  }

  window.addEventListener("error", (event) => {
    pushStartupError({
      message: event.message || String(event.error ?? "Unknown error"),
      stack: event.error?.stack,
      source: "window.onerror",
      at: Date.now(),
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    pushStartupError({
      message: reason?.message ?? String(reason ?? "Unhandled rejection"),
      stack: reason?.stack,
      source: "unhandledrejection",
      at: Date.now(),
    });
  });
}

export function captureException(error: unknown, context?: Record<string, unknown>) {
  pushStartupError({
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    source: (context?.source as string) ?? "manual",
    at: Date.now(),
  });
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.captureException(error, { extra: context });
  }
}

export { Sentry };
