export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          city: string
          country: string
          created_at: string
          full_name: string
          id: string
          is_default: boolean
          label: string
          line1: string
          line2: string | null
          phone: string | null
          postal_code: string
          state: string
          updated_at: string
          user_id: string
        }
        Insert: {
          city: string
          country?: string
          created_at?: string
          full_name: string
          id?: string
          is_default?: boolean
          label?: string
          line1: string
          line2?: string | null
          phone?: string | null
          postal_code: string
          state: string
          updated_at?: string
          user_id: string
        }
        Update: {
          city?: string
          country?: string
          created_at?: string
          full_name?: string
          id?: string
          is_default?: boolean
          label?: string
          line1?: string
          line2?: string | null
          phone?: string | null
          postal_code?: string
          state?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      farmer_documents: {
        Row: {
          created_at: string
          doc_type: string
          farmer_id: string
          file_url: string
          id: string
          label: string | null
          notes: string | null
          status: Database["public"]["Enums"]["doc_status"]
          updated_at: string
          user_id: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          doc_type: string
          farmer_id: string
          file_url: string
          id?: string
          label?: string | null
          notes?: string | null
          status?: Database["public"]["Enums"]["doc_status"]
          updated_at?: string
          user_id: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          doc_type?: string
          farmer_id?: string
          file_url?: string
          id?: string
          label?: string | null
          notes?: string | null
          status?: Database["public"]["Enums"]["doc_status"]
          updated_at?: string
          user_id?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "farmer_documents_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "farmer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      farmer_payouts: {
        Row: {
          created_at: string
          farmer_id: string
          fees: number
          gross_amount: number
          id: string
          net_amount: number
          period_end: string
          period_start: string
          reference: string | null
          settled_at: string | null
          status: Database["public"]["Enums"]["payout_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          farmer_id: string
          fees?: number
          gross_amount?: number
          id?: string
          net_amount?: number
          period_end: string
          period_start: string
          reference?: string | null
          settled_at?: string | null
          status?: Database["public"]["Enums"]["payout_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          farmer_id?: string
          fees?: number
          gross_amount?: number
          id?: string
          net_amount?: number
          period_end?: string
          period_start?: string
          reference?: string | null
          settled_at?: string | null
          status?: Database["public"]["Enums"]["payout_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "farmer_payouts_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "farmer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      farmer_products: {
        Row: {
          category: string
          compare_at_price: number | null
          created_at: string
          description: string | null
          farmer_id: string
          featured: boolean
          id: string
          images: string[] | null
          name: string
          price: number
          slug: string
          status: Database["public"]["Enums"]["product_status"]
          stock: number
          unit: string
          updated_at: string
          user_id: string
          weight_grams: number | null
        }
        Insert: {
          category: string
          compare_at_price?: number | null
          created_at?: string
          description?: string | null
          farmer_id: string
          featured?: boolean
          id?: string
          images?: string[] | null
          name: string
          price: number
          slug: string
          status?: Database["public"]["Enums"]["product_status"]
          stock?: number
          unit?: string
          updated_at?: string
          user_id: string
          weight_grams?: number | null
        }
        Update: {
          category?: string
          compare_at_price?: number | null
          created_at?: string
          description?: string | null
          farmer_id?: string
          featured?: boolean
          id?: string
          images?: string[] | null
          name?: string
          price?: number
          slug?: string
          status?: Database["public"]["Enums"]["product_status"]
          stock?: number
          unit?: string
          updated_at?: string
          user_id?: string
          weight_grams?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "farmer_products_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "farmer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      farmer_profiles: {
        Row: {
          aadhaar_last4: string | null
          approved_at: string | null
          bank_account_name: string | null
          bank_account_number: string | null
          bank_ifsc: string | null
          bank_name: string | null
          cover_image_url: string | null
          created_at: string
          crops: string[] | null
          district: string | null
          email: string | null
          farm_name: string
          farm_size_acres: number | null
          farming_method: string | null
          full_name: string
          headline: string | null
          id: string
          pan_number: string | null
          phone: string
          pincode: string | null
          portrait_url: string | null
          rejection_reason: string | null
          slug: string | null
          state: string
          status: Database["public"]["Enums"]["farmer_status"]
          story: string | null
          updated_at: string
          upi_id: string | null
          user_id: string
          village: string
          years_farming: number | null
        }
        Insert: {
          aadhaar_last4?: string | null
          approved_at?: string | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_ifsc?: string | null
          bank_name?: string | null
          cover_image_url?: string | null
          created_at?: string
          crops?: string[] | null
          district?: string | null
          email?: string | null
          farm_name: string
          farm_size_acres?: number | null
          farming_method?: string | null
          full_name: string
          headline?: string | null
          id?: string
          pan_number?: string | null
          phone: string
          pincode?: string | null
          portrait_url?: string | null
          rejection_reason?: string | null
          slug?: string | null
          state: string
          status?: Database["public"]["Enums"]["farmer_status"]
          story?: string | null
          updated_at?: string
          upi_id?: string | null
          user_id: string
          village: string
          years_farming?: number | null
        }
        Update: {
          aadhaar_last4?: string | null
          approved_at?: string | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_ifsc?: string | null
          bank_name?: string | null
          cover_image_url?: string | null
          created_at?: string
          crops?: string[] | null
          district?: string | null
          email?: string | null
          farm_name?: string
          farm_size_acres?: number | null
          farming_method?: string | null
          full_name?: string
          headline?: string | null
          id?: string
          pan_number?: string | null
          phone?: string
          pincode?: string | null
          portrait_url?: string | null
          rejection_reason?: string | null
          slug?: string | null
          state?: string
          status?: Database["public"]["Enums"]["farmer_status"]
          story?: string | null
          updated_at?: string
          upi_id?: string | null
          user_id?: string
          village?: string
          years_farming?: number | null
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          newsletter: boolean
          order_updates_email: boolean
          order_updates_sms: boolean
          promotions_email: boolean
          promotions_sms: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          newsletter?: boolean
          order_updates_email?: boolean
          order_updates_sms?: boolean
          promotions_email?: boolean
          promotions_sms?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          newsletter?: boolean
          order_updates_email?: boolean
          order_updates_sms?: boolean
          promotions_email?: boolean
          promotions_sms?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          brand: string
          created_at: string
          exp_month: number
          exp_year: number
          id: string
          is_default: boolean
          last4: string
          nickname: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          brand: string
          created_at?: string
          exp_month: number
          exp_year: number
          id?: string
          is_default?: boolean
          last4: string
          nickname?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          brand?: string
          created_at?: string
          exp_month?: number
          exp_year?: number
          id?: string
          is_default?: boolean
          last4?: string
          nickname?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      product_reviews: {
        Row: {
          body: string | null
          created_at: string
          id: string
          product_slug: string
          rating: number
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          product_slug: string
          rating: number
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          product_slug?: string
          rating?: number
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          avatar_url: string | null
          city: string | null
          country: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          postal_code: string | null
          state: string | null
          updated_at: string
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          updated_at?: string
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      recently_viewed: {
        Row: {
          id: string
          product_slug: string
          user_id: string
          viewed_at: string
        }
        Insert: {
          id?: string
          product_slug: string
          user_id: string
          viewed_at?: string
        }
        Update: {
          id?: string
          product_slug?: string
          user_id?: string
          viewed_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wishlist_items: {
        Row: {
          created_at: string
          id: string
          product_slug: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_slug: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_slug?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "customer" | "farmer" | "admin"
      doc_status: "pending" | "verified" | "rejected"
      farmer_status: "draft" | "pending" | "approved" | "rejected" | "suspended"
      payout_status: "scheduled" | "processing" | "paid" | "failed"
      product_status:
        | "draft"
        | "pending"
        | "published"
        | "rejected"
        | "archived"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["customer", "farmer", "admin"],
      doc_status: ["pending", "verified", "rejected"],
      farmer_status: ["draft", "pending", "approved", "rejected", "suspended"],
      payout_status: ["scheduled", "processing", "paid", "failed"],
      product_status: ["draft", "pending", "published", "rejected", "archived"],
    },
  },
} as const
