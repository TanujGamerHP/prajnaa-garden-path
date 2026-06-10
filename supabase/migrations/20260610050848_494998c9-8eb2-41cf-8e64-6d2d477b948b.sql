
-- Replace the security_definer view with column-level privileges
DROP VIEW IF EXISTS public.public_farmer_profiles;

-- Restore RLS allowing approved farmer rows to be read publicly...
CREATE POLICY "public reads approved farmers"
  ON public.farmer_profiles
  FOR SELECT
  TO anon, authenticated
  USING (status = 'approved');

-- ...but restrict which columns anon / authenticated can actually select.
-- Sensitive columns: bank_account_number, bank_account_name, bank_ifsc, bank_name,
-- upi_id, pan_number, aadhaar_last4, phone, email, rejection_reason.
REVOKE SELECT ON public.farmer_profiles FROM anon, authenticated;

GRANT SELECT (
  id, user_id, slug, full_name, farm_name, village, district, state, pincode,
  farm_size_acres, years_farming, farming_method, crops,
  headline, story, cover_image_url, portrait_url,
  status, approved_at, created_at, updated_at
) ON public.farmer_profiles TO anon;

-- authenticated needs the same public columns + access to the owner's full row.
-- Column privileges apply to ALL rows that pass RLS; the "farmer reads own" policy
-- still works because authenticated keeps INSERT/UPDATE/DELETE table-level privileges,
-- and SELECT on sensitive columns is granted only to the row's owner via a SECURITY
-- DEFINER helper view restricted to that user.
GRANT SELECT (
  id, user_id, slug, full_name, farm_name, village, district, state, pincode,
  farm_size_acres, years_farming, farming_method, crops,
  headline, story, cover_image_url, portrait_url,
  status, approved_at, created_at, updated_at
) ON public.farmer_profiles TO authenticated;

-- Owners + admins need their full row including sensitive fields. Expose those via
-- a dedicated owner view that runs under the caller's RLS (security_invoker).
DROP VIEW IF EXISTS public.my_farmer_profile;
CREATE VIEW public.my_farmer_profile
WITH (security_invoker = true) AS
SELECT * FROM public.farmer_profiles
WHERE auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role);

GRANT SELECT ON public.my_farmer_profile TO authenticated;

-- Keep table-level write privileges intact for authenticated (column REVOKE above
-- only removed SELECT). Service role retains full access.
GRANT INSERT, UPDATE, DELETE ON public.farmer_profiles TO authenticated;
GRANT ALL ON public.farmer_profiles TO service_role;
