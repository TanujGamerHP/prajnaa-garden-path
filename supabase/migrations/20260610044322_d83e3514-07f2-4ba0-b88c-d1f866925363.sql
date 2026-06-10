
-- KYC document verification status
DO $$ BEGIN
  CREATE TYPE doc_status AS ENUM ('pending','verified','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.farmer_documents
  ADD COLUMN IF NOT EXISTS status doc_status NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS verified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DROP TRIGGER IF EXISTS farmer_documents_updated_at ON public.farmer_documents;
CREATE TRIGGER farmer_documents_updated_at BEFORE UPDATE ON public.farmer_documents
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Admin can manage docs (verify/reject)
DROP POLICY IF EXISTS "admins manage all docs" ON public.farmer_documents;
CREATE POLICY "admins manage all docs" ON public.farmer_documents
  FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'))
  WITH CHECK (has_role(auth.uid(),'admin'));

-- Public read of approved farmer profiles already exists; also allow public read of approved farmers via slug
-- (verify existing policy covers slug-only lookups by anon)
GRANT SELECT ON public.farmer_profiles TO anon;
GRANT SELECT ON public.farmer_products TO anon;
