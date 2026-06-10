import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export type FarmerProfile = {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  email: string | null;
  farm_name: string;
  slug: string | null;
  village: string;
  district: string | null;
  state: string;
  pincode: string | null;
  farm_size_acres: number | null;
  years_farming: number | null;
  farming_method: string | null;
  crops: string[] | null;
  headline: string | null;
  story: string | null;
  cover_image_url: string | null;
  portrait_url: string | null;
  bank_account_name: string | null;
  bank_account_number: string | null;
  bank_ifsc: string | null;
  bank_name: string | null;
  upi_id: string | null;
  aadhaar_last4: string | null;
  pan_number: string | null;
  status: "draft" | "pending" | "approved" | "rejected" | "suspended";
  rejection_reason: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
};

export function farmerKey(userId: string | undefined) {
  return ["farmer-profile", userId] as const;
}

export function useFarmerProfile() {
  const { user, loading } = useAuth();
  const query = useQuery({
    queryKey: farmerKey(user?.id),
    enabled: !!user,
    queryFn: async (): Promise<FarmerProfile | null> => {
      const { data, error } = await supabase
        .from("farmer_profiles")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return (data as FarmerProfile | null) ?? null;
    },
  });
  return { ...query, authLoading: loading, user };
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 64);
}
