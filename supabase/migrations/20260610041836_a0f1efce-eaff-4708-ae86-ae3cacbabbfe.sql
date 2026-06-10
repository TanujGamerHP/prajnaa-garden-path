
-- Addresses
CREATE TABLE public.addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label text NOT NULL DEFAULT 'Home',
  full_name text NOT NULL,
  phone text,
  line1 text NOT NULL,
  line2 text,
  city text NOT NULL,
  state text NOT NULL,
  postal_code text NOT NULL,
  country text NOT NULL DEFAULT 'IN',
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.addresses TO authenticated;
GRANT ALL ON public.addresses TO service_role;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "addresses_select_own" ON public.addresses FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "addresses_insert_own" ON public.addresses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "addresses_update_own" ON public.addresses FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "addresses_delete_own" ON public.addresses FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER addresses_set_updated BEFORE UPDATE ON public.addresses FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE INDEX addresses_user_idx ON public.addresses(user_id);

-- Payment methods (placeholder; no PAN/CVV stored)
CREATE TABLE public.payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname text,
  brand text NOT NULL,
  last4 text NOT NULL CHECK (char_length(last4) = 4),
  exp_month int NOT NULL CHECK (exp_month BETWEEN 1 AND 12),
  exp_year int NOT NULL CHECK (exp_year BETWEEN 2024 AND 2100),
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_methods TO authenticated;
GRANT ALL ON public.payment_methods TO service_role;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pm_select_own" ON public.payment_methods FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "pm_insert_own" ON public.payment_methods FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "pm_update_own" ON public.payment_methods FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "pm_delete_own" ON public.payment_methods FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER pm_set_updated BEFORE UPDATE ON public.payment_methods FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE INDEX pm_user_idx ON public.payment_methods(user_id);

-- Wishlist items
CREATE TABLE public.wishlist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_slug text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_slug)
);
GRANT SELECT, INSERT, DELETE ON public.wishlist_items TO authenticated;
GRANT ALL ON public.wishlist_items TO service_role;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wl_select_own" ON public.wishlist_items FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "wl_insert_own" ON public.wishlist_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "wl_delete_own" ON public.wishlist_items FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX wl_user_idx ON public.wishlist_items(user_id);

-- Recently viewed
CREATE TABLE public.recently_viewed (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_slug text NOT NULL,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_slug)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recently_viewed TO authenticated;
GRANT ALL ON public.recently_viewed TO service_role;
ALTER TABLE public.recently_viewed ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rv_select_own" ON public.recently_viewed FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "rv_insert_own" ON public.recently_viewed FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "rv_update_own" ON public.recently_viewed FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "rv_delete_own" ON public.recently_viewed FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX rv_user_idx ON public.recently_viewed(user_id, viewed_at DESC);

-- Product reviews
CREATE TABLE public.product_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_slug text NOT NULL,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title text,
  body text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_slug)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_reviews TO authenticated;
GRANT SELECT ON public.product_reviews TO anon;
GRANT ALL ON public.product_reviews TO service_role;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pr_public_read" ON public.product_reviews FOR SELECT USING (true);
CREATE POLICY "pr_insert_own" ON public.product_reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "pr_update_own" ON public.product_reviews FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "pr_delete_own" ON public.product_reviews FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER pr_set_updated BEFORE UPDATE ON public.product_reviews FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE INDEX pr_user_idx ON public.product_reviews(user_id);
CREATE INDEX pr_product_idx ON public.product_reviews(product_slug);

-- Notification preferences (one row per user)
CREATE TABLE public.notification_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  order_updates_email boolean NOT NULL DEFAULT true,
  order_updates_sms boolean NOT NULL DEFAULT true,
  promotions_email boolean NOT NULL DEFAULT true,
  promotions_sms boolean NOT NULL DEFAULT false,
  newsletter boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_preferences TO authenticated;
GRANT ALL ON public.notification_preferences TO service_role;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "np_select_own" ON public.notification_preferences FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "np_upsert_own" ON public.notification_preferences FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "np_update_own" ON public.notification_preferences FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER np_set_updated BEFORE UPDATE ON public.notification_preferences FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Ensure only one default per user (addresses & payment_methods)
CREATE OR REPLACE FUNCTION public.unset_other_defaults()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.is_default THEN
    EXECUTE format('UPDATE public.%I SET is_default = false WHERE user_id = $1 AND id <> $2', TG_TABLE_NAME)
      USING NEW.user_id, NEW.id;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER addresses_unset_default AFTER INSERT OR UPDATE OF is_default ON public.addresses
  FOR EACH ROW WHEN (NEW.is_default) EXECUTE FUNCTION public.unset_other_defaults();
CREATE TRIGGER pm_unset_default AFTER INSERT OR UPDATE OF is_default ON public.payment_methods
  FOR EACH ROW WHEN (NEW.is_default) EXECUTE FUNCTION public.unset_other_defaults();
