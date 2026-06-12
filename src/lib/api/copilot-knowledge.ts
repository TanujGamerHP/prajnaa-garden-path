export interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

export const PLATFORM_INFO = {
  name: "Prajnaa Farm",
  slogan: "From Soil to Soul, Naturally",
  description: "A premium farm-to-consumer marketplace connecting health-conscious consumers with verified local farmers in India. Every product is authentic, chemical-free, and traceable directly to the farmer who cultivated it.",
  features: [
    "100% Traceable: Know the exact farmer and their farm location for every batch.",
    "Soil & Water Testing: Farmers are verified using physical soil/water audits.",
    "Fair Trade: Farmers set their own pricing, earning up to 75% of the consumer price directly.",
    "Certified Quality: Products carry FSSAI and India Organic certifications where applicable."
  ]
};

export const FAQ_DATA: FAQItem[] = [
  // Orders & shipping
  {
    category: "shipping",
    question: "How long does delivery take?",
    answer: "Most orders are shipped within 24–48 hours. Delivery timelines: Metro cities (2–4 business days), Tier-2 cities (3–6 business days), Remote pin codes (5–9 business days)."
  },
  {
    category: "shipping",
    question: "Do you deliver to my city?",
    answer: "We ship to over 20,000 pin codes across India through trusted logistics partners. You can verify serviceability on any product page or during checkout."
  },
  {
    category: "shipping",
    question: "Can I track my order?",
    answer: "Yes, you'll receive a tracking link via email and SMS as soon as your order ships. You can also track your order directly on the platform at /track-order or from your account dashboard."
  },
  {
    category: "shipping",
    question: "Is cash on delivery (COD) available?",
    answer: "COD is available on orders under ₹3,000 for serviceable pin codes. There is an additional handling fee of ₹40 for COD. Prepaid orders get free shipping for totals above ₹999."
  },
  // Products & quality
  {
    category: "quality",
    question: "Are your products certified organic?",
    answer: "We source naturally grown, chemical-free produce. FSSAI and India Organic certifications are listed on the specific product pages where applicable."
  },
  {
    category: "quality",
    question: "How do you verify farmers?",
    answer: "Every farmer undergoes a 4-step verification: physical site audits, government document checks (KYC & land records), soil/water report analysis, and lab-tested product samples before going live."
  },
  {
    category: "quality",
    question: "Do products have an expiry date?",
    answer: "Yes, each product package lists the batch code, harvest date, and best-before date printed directly at the source."
  },
  {
    category: "quality",
    question: "Why are some items seasonal or out of stock?",
    answer: "Prajnaa Farm only sells fresh, seasonal harvests directly from farms. When a seasonal crop runs out, we do not fake inventory; it remains out of stock until the next natural harvest."
  },
  // Payments & refunds
  {
    category: "payments",
    question: "Which payment methods do you accept?",
    answer: "We accept UPI, major credit/debit cards, Net Banking, and digital wallets, all processed securely via Razorpay."
  },
  {
    category: "payments",
    question: "What if my order arrives damaged or missing?",
    answer: "We offer a 100% refund or replacement guarantee. Just send an email with photos of the damaged package to care@prajnaa.in within 48 hours of delivery."
  },
  {
    category: "payments",
    question: "When will I get my refund?",
    answer: "Once approved, refunds are processed and credited back to your original payment method within 5–7 business days."
  },
  // Account & dashboard
  {
    category: "account",
    question: "Do I need an account to order?",
    answer: "No, guest checkout is supported. However, creating an account lets you track order history, save addresses, earn loyalty points, and write product reviews."
  },
  {
    category: "account",
    question: "How do I earn and use loyalty points?",
    answer: "Customers earn 1% cashback as loyalty points on every purchase. Points can be redeemed at checkout on future orders. (1 point = ₹1)."
  },
  {
    category: "account",
    question: "How do I delete my account?",
    answer: "Please write to privacy@prajnaa.in, and we will delete your account and all associated personal data within 7 working days."
  }
];

export const FARMER_ONBOARDING_STEPS = [
  {
    step: 1,
    title: "Farmer Registration",
    description: "Fill out the basic seller registration form at /become-a-seller with your farm name, location, and phone number."
  },
  {
    step: 2,
    title: "KYC Process",
    description: "Upload copies of identity proof (Aadhaar, PAN, or Voter ID) and land ownership document or farming license."
  },
  {
    step: 3,
    title: "Bank Verification",
    description: "Submit bank details (Account number, IFSC code, and branch name) or UPI ID to receive direct customer payments."
  },
  {
    step: 4,
    title: "Product Upload",
    description: "List your available crops, weight packages, stock count, pricing, and upload high-quality farm/produce photos."
  },
  {
    step: 5,
    title: "Admin Approval",
    description: "Prajnaa admin reviews details and schedules a soil test. Once verified, your shop goes live on the marketplace."
  }
];

export const POLICIES_DATA = {
  shipping: "Free shipping is unlocked automatically on all prepaid orders of ₹999 and above. Orders below ₹999 carry a flat ₹49 delivery charge. A ₹40 fee applies to cash on delivery (COD) orders.",
  returns: "A 100% refund or replacement is provided for damaged, stale, or tampered produce if reported to care@prajnaa.in with package photographs within 48 hours of delivery.",
  cancellations: "You can cancel any order directly from your account page before it has been shipped. Once shipped, cancellations cannot be completed, but returns can be requested upon delivery.",
  privacy: "We collect personal info only for order processing. We do not sell your personal data. For account deletion requests, email privacy@prajnaa.in."
};
