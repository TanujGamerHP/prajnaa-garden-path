export const FARMER_POLICIES = {
  commission: "Prajnaa Farm operates on a transparent model where we charge a flat **10% marketplace fee** on successful sales to cover logistics coordination, payment gateways, and platform upkeep. Farmers retain 90% of the customer retail price.",
  payouts: "Payouts are processed weekly. Earnings for any delivered order are settled into the farmer's registered bank account or UPI ID within **7–10 days** following delivery confirmation, allowing for the customer return/replacement window.",
  returns: "To protect consumers, we allow returns or replacements within 48 hours for damaged or bad-quality produce. The marketplace absorbs logistic costs, but recurrent quality issues may lead to product suspensions."
};

export const KYC_POLICIES = {
  requirements: [
    "Identity Verification: Aadhaar Card or Voter ID Card (scanned clear copy showing name, DOB, and address).",
    "Tax Verification: PAN Card (clear copy showing name and PAN number).",
    "Land Ownership / Authorization: Land registry document (Jamabandi/Khasra), lease deed, or self-declaration of farming authority verified by village head."
  ],
  rejectionReasons: [
    "Illegible or blurry uploads where text cannot be read.",
    "Name discrepancy between bank account, Aadhaar, and farmer profile.",
    "Expired documents or incomplete PAN verification."
  ]
};

export const PRODUCT_GUIDELINES = {
  naming: "Product titles should be descriptive: **[Processing Type] [Product Name] (e.g. Raw Forest Honey or Sun-Dried Ginger Powder)**. Avoid generic names like 'Honey' or 'Ginger'.",
  pricing: "Farmers set their own pricing. We suggest checking competitor rates on the shop page. Ensure pricing reflects package weight (e.g., pricing per 250g, 500g, or 1kg).",
  authenticity: "Only naturally grown, chemical-free, or certified organic products can be listed. Any crop treated with chemical pesticides, synthetic fertilizers, or artificial ripening agents is strictly prohibited."
};

export const IMAGE_GUIDELINES = {
  resolution: "Minimum 1000x1000 pixels (aspect ratio 1:1) in JPG or PNG format.",
  background: "Clean, well-lit background. Natural farm backgrounds or simple solid light-colored surfaces are highly recommended to showcase premium quality.",
  qualityChecks: [
    "Blur: The product name and labels must be sharp and legible.",
    "Lighting: Avoid dark shadows or strong yellow tint. Natural daylight works best.",
    "Angles: At least one front-facing shot of the package and one shot showing the raw texture of the produce (e.g. powder, seeds, or fresh leaves)."
  ]
};

export const SALES_BEST_PRACTICES = {
  seo: "Include primary key phrases in the description (e.g. 'pure organic turmeric', 'natural honey from himalayas'). Mention the health benefits (immunity, digestion) and farming methods.",
  demandTrends: [
    "Monsoon & Winter: High demand for immunity products (Ginger, Turmeric, Honey, Shilajit, Spices).",
    "Summer: High demand for refreshing grains, organic pulses, cold-pressed oils, and fresh summer fruits.",
    "Festive Seasons: Gift boxes, dry fruits, saffron, and premium sweeteners."
  ]
};
