
-- First-admin claim (only if no admin currently exists)
CREATE OR REPLACE FUNCTION public.claim_first_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  has_any_admin boolean;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE role='admin') INTO has_any_admin;
  IF has_any_admin THEN RETURN false; END IF;
  INSERT INTO public.user_roles(user_id, role) VALUES (uid, 'admin') ON CONFLICT DO NOTHING;
  RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.claim_first_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_first_admin() TO authenticated;

-- Promote a user to admin by their email (caller must already be admin)
CREATE OR REPLACE FUNCTION public.promote_user_to_admin(target_email text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_id uuid;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  SELECT id INTO target_id FROM auth.users WHERE lower(email) = lower(target_email) LIMIT 1;
  IF target_id IS NULL THEN RAISE EXCEPTION 'no user with email %', target_email; END IF;
  INSERT INTO public.user_roles(user_id, role) VALUES (target_id,'admin') ON CONFLICT DO NOTHING;
  RETURN target_id;
END $$;
REVOKE ALL ON FUNCTION public.promote_user_to_admin(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.promote_user_to_admin(text) TO authenticated;

-- Revoke admin from a user (caller must be admin, cannot revoke self if last admin)
CREATE OR REPLACE FUNCTION public.revoke_admin(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  remaining int;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT count(*) INTO remaining FROM public.user_roles WHERE role='admin' AND user_id <> target_user_id;
  IF remaining < 1 THEN RAISE EXCEPTION 'cannot remove the last admin'; END IF;
  DELETE FROM public.user_roles WHERE user_id = target_user_id AND role='admin';
  RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.revoke_admin(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.revoke_admin(uuid) TO authenticated;

-- Admin lookup of profiles + user_roles for management UI
CREATE POLICY "admins read all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (has_role(auth.uid(),'admin'));

CREATE POLICY "admins read all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (has_role(auth.uid(),'admin'));

-- Admin can list emails (needed to display admins by email): expose a safe view
CREATE OR REPLACE FUNCTION public.list_admins()
RETURNS TABLE(user_id uuid, email text, created_at timestamptz)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ur.user_id, u.email::text, ur.created_at
  FROM public.user_roles ur
  JOIN auth.users u ON u.id = ur.user_id
  WHERE ur.role='admin'
  AND public.has_role(auth.uid(),'admin')
  ORDER BY ur.created_at;
$$;
REVOKE ALL ON FUNCTION public.list_admins() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_admins() TO authenticated;
