import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Admin Notification Server Function
export const sendAdminEmailNotification = createServerFn({
  method: "POST",
})
  .validator(
    z.object({
      subject: z.string(),
      body: z.string(),
    })
  )
  .handler(async ({ data }) => {
    // Log on the server terminal (simulating an email delivery payload)
    console.log(`\n📧 ========================================`);
    console.log(`[EMAIL NOTIFICATION SENT TO ADMIN]`);
    console.log(`Subject: ${data.subject}`);
    console.log(`Body:\n${data.body}`);
    console.log(`===========================================\n`);
    
    return { success: true, message: "Email logged successfully to server terminal" };
  });
