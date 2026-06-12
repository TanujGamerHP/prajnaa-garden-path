import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { applyRateLimit } from "./rate-limiter.server";

// Helper to escape basic HTML elements and prevent script injection in logs/notifications
function sanitizeString(val: string): string {
  return val
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

// Admin Notification Server Function
export const sendAdminEmailNotification = createServerFn({
  method: "POST",
})
  .validator(
    z
      .object({
        subject: z
          .string()
          .min(1, "Subject cannot be empty")
          .max(200, "Subject is too long")
          .transform(sanitizeString),
        body: z
          .string()
          .min(1, "Body cannot be empty")
          .max(5000, "Body is too long")
          .transform(sanitizeString),
      })
      .strict()
  )
  .handler(async ({ data }) => {
    // Apply sensible rate limits: max 10 notifications per minute per IP/user
    applyRateLimit(null, 10, 60000);

    // Log on the server terminal (simulating an email delivery payload)
    console.log(`\n📧 ========================================`);
    console.log(`[EMAIL NOTIFICATION SENT TO ADMIN]`);
    console.log(`Subject: ${data.subject}`);
    console.log(`Body:\n${data.body}`);
    console.log(`===========================================\n`);
    
    return { success: true, message: "Email logged successfully to server terminal" };
  });
