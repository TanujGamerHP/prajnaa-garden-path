import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import crypto from "crypto";
import Razorpay from "razorpay";

// Server RPC to generate a secure Razorpay Order ID
export const createRazorpayOrder = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      amount: z.number().min(1, "Amount must be greater than zero"),
    })
  )
  .handler(async ({ data }) => {
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
        receipt: `rcpt_${Math.random().toString(36).substring(2, 15)}`,
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
    z.object({
      razorpay_order_id: z.string(),
      razorpay_payment_id: z.string(),
      razorpay_signature: z.string(),
    })
  )
  .handler(async ({ data }) => {
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

      const success = expectedSignature === data.razorpay_signature;

      if (!success) {
        console.warn("[Razorpay Server] Signature verification failed.");
      }

      return { success };
    } catch (err: any) {
      console.error("[Razorpay Server] Error verifying signature:", err);
      return { success: false, error: err.message };
    }
  });
