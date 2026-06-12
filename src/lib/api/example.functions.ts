import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerConfig } from "../config.server";
import { applyRateLimit } from "./rate-limiter.server";

// Helper to escape basic HTML elements and prevent script injection
function sanitizeString(val: string): string {
  return val
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

// Example createServerFn. Server-side handler invoked from the client:
export const getGreeting = createServerFn({ method: "POST" })
  .inputValidator(
    z
      .object({
        name: z
          .string()
          .min(1, "Name cannot be empty")
          .max(100, "Name is too long")
          .transform(sanitizeString),
      })
      .strict()
  )
  .handler(async ({ data }) => {
    // Apply sensible rate limits: max 60 greetings per minute per IP/user
    applyRateLimit(null, 60, 60000);

    const config = getServerConfig();
    return {
      greeting: `Hello, ${data.name}!`,
      mode: config.nodeEnv ?? "unknown",
    };
  });
