import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import crypto from "crypto";
import Razorpay from "razorpay";
import { applyRateLimit } from "./rate-limiter.server";

// Server RPC to generate a secure Razorpay Order ID
export const createRazorpayOrder = createServerFn({ method: "POST" })
  .inputValidator(
    z
      .object({
        amount: z
          .number()
          .min(1, "Amount must be greater than zero")
          .max(1000000, "Amount exceeds transaction limit"),
      })
      .strict()
  )
  .handler(async ({ data }) => {
    // Apply sensible rate limits: max 15 checkout attempts per minute per IP
    applyRateLimit(null, 15, 60000);

    const keyId = process.env.VITE_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      console.error("[Razorpay Server] Missing credentials in environment variables.");
      throw new Error(
        "Razorpay API Keys are not configured. Please add VITE_RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to your server environment/.env file."
      );
    }

    try {
      const razorpay = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });

      // Amount in paise (INR * 100)
      const options = {
        amount: Math.round(data.amount * 100),
        currency: "INR",
        receipt: `rcpt_${crypto.randomBytes(6).toString("hex")}`, // Secure random generation
      };

      const order = await razorpay.orders.create(options);
      
      return {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId, // Return keyId so frontend knows which key to initialize Checkout with
      };
    } catch (err: any) {
      console.error("[Razorpay Server] Error creating order:", err);
      throw new Error(err.message || "Failed to create Razorpay payment order.");
    }
  });

// Server RPC to verify the payment signature using HMAC SHA256
export const verifyRazorpayPayment = createServerFn({ method: "POST" })
  .inputValidator(
    z
      .object({
        razorpay_order_id: z.string().min(1).max(100),
        razorpay_payment_id: z.string().min(1).max(100),
        razorpay_signature: z.string().min(1).max(256),
      })
      .strict()
  )
  .handler(async ({ data }) => {
    // Apply sensible rate limits: max 30 verification checks per minute per IP
    applyRateLimit(null, 30, 60000);

    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keySecret) {
      console.error("[Razorpay Server] Missing VITE_RAZORPAY_KEY_SECRET for signature verification.");
      throw new Error("Razorpay secret key is not configured on the server.");
    }

    try {
      const payload = `${data.razorpay_order_id}|${data.razorpay_payment_id}`;
      const expectedSignature = crypto
        .createHmac("sha256", keySecret)
        .update(payload)
        .digest("hex");

      // Constant-time comparison to prevent timing attacks
      const success = crypto.timingSafeEqual(
        Buffer.from(expectedSignature, "utf-8"),
        Buffer.from(data.razorpay_signature, "utf-8")
      );

      if (!success) {
        console.warn("[Razorpay Server] Signature verification failed.");
      }

      return { success };
    } catch (err: any) {
      console.error("[Razorpay Server] Error verifying signature:", err);
      return { success: false, error: err.message };
    }
  });
