// Lightweight Sentry init. Only activates when VITE_SENTRY_DSN is set.
import * as Sentry from "@sentry/react";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

type StartupErrorEntry = {
  message: string;
  stack?: string;
  source: string;
  at: number;
};

const STARTUP_ERROR_KEY = "__prajnaa_startup_errors";
const MAX_ENTRIES = 25;

// Server function to log client errors to server console
export const logClientError = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      message: z.string(),
      stack: z.string().optional(),
      source: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    console.error(
      `\n[CLIENT EXCEPTION] Source: ${data.source}\nMessage: ${data.message}\nStack: ${data.stack || "No stack trace available"}\n`,
    );
    return { logged: true };
  });

function pushStartupError(entry: StartupErrorEntry) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.sessionStorage.getItem(STARTUP_ERROR_KEY);
    const list: StartupErrorEntry[] = raw ? JSON.parse(raw) : [];
    list.unshift(entry);
    window.sessionStorage.setItem(STARTUP_ERROR_KEY, JSON.stringify(list.slice(0, MAX_ENTRIES)));
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
    const msg = event.message || String(event.error ?? "Unknown error");
    const stk = event.error?.stack;
    const src = "window.onerror";

    pushStartupError({
      message: msg,
      stack: stk,
      source: src,
      at: Date.now(),
    });

    logClientError({ data: { message: msg, stack: stk || "", source: src } }).catch(() => {});
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    const msg = reason?.message ?? String(reason ?? "Unhandled rejection");
    const stk = reason?.stack;
    const src = "unhandledrejection";

    pushStartupError({
      message: msg,
      stack: stk,
      source: src,
      at: Date.now(),
    });

    logClientError({ data: { message: msg, stack: stk || "", source: src } }).catch(() => {});
  });
}

export function captureException(error: unknown, context?: Record<string, unknown>) {
  const msg = error instanceof Error ? error.message : String(error);
  const stk = error instanceof Error ? error.stack : undefined;
  const src = (context?.source as string) ?? "manual";

  pushStartupError({
    message: msg,
    stack: stk,
    source: src,
    at: Date.now(),
  });

  if (typeof window !== "undefined") {
    logClientError({ data: { message: msg, stack: stk || "", source: src } }).catch(() => {});
  }

  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.captureException(error, { extra: context });
  }
}

export { Sentry };
