
-- 1) Remove public read of full farmer_profiles row
DROP POLICY IF EXISTS "public reads approved farmers" ON public.farmer_profiles;

-- 2) Public view that exposes ONLY non-sensitive fields for approved farmers
DROP VIEW IF EXISTS public.public_farmer_profiles;
CREATE VIEW public.public_farmer_profiles
WITH (security_invoker = false) AS
SELECT
  id, slug, full_name, farm_name, village, district, state, pincode,
  farm_size_acres, years_farming, farming_method, crops,
  headline, story, cover_image_url, portrait_url,
  status, approved_at, created_at, updated_at
FROM public.farmer_profiles
WHERE status = 'approved';

GRANT SELECT ON public.public_farmer_profiles TO anon, authenticated;

-- 3) Remove anonymous reads of product_reviews (was exposing user_id)
DROP POLICY IF EXISTS "pr_public_read" ON public.product_reviews;
CREATE POLICY "pr_authenticated_read" ON public.product_reviews
  FOR SELECT TO authenticated USING (true);

-- 4) Tighten EXECUTE on SECURITY DEFINER functions
-- Trigger-only functions: revoke from PUBLIC/anon/authenticated
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.unset_other_defaults() FROM PUBLIC, anon, authenticated;

-- Admin-only RPCs: revoke from anon (keep authenticated; functions self-check via has_role)
REVOKE ALL ON FUNCTION public.promote_user_to_admin(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.revoke_admin(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.list_admins() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.promote_user_to_admin(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_admins() TO authenticated;

-- Authenticated-only bootstrap
REVOKE ALL ON FUNCTION public.claim_first_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_first_admin() TO authenticated;

-- has_role used by RLS policy expressions: keep callable by anon+authenticated
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO anon, authenticated;
