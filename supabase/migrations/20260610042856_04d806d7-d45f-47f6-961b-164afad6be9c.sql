
-- ============ ROLES ============
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('customer','farmer','admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admins manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Auto-assign customer role on signup; extend existing handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name',''),
    NEW.email, NEW.phone, NEW.raw_user_meta_data->>'avatar_url'
  ) ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles(user_id, role) VALUES (NEW.id,'customer') ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;

-- ============ FARMER PROFILES ============
DO $$ BEGIN
  CREATE TYPE public.farmer_status AS ENUM ('draft','pending','approved','rejected','suspended');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE public.farmer_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Personal
  full_name text NOT NULL,
  phone text NOT NULL,
  email text,
  aadhaar_last4 text,
  pan_number text,
  -- Farm
  farm_name text NOT NULL,
  slug text UNIQUE,
  village text NOT NULL,
  district text,
  state text NOT NULL,
  pincode text,
  farm_size_acres numeric(8,2),
  years_farming int,
  farming_method text, -- organic / natural / regenerative / traditional
  crops text[] DEFAULT '{}',
  -- Story / public page
  headline text,
  story text,
  cover_image_url text,
  portrait_url text,
  -- Bank
  bank_account_name text,
  bank_account_number text,
  bank_ifsc text,
  bank_name text,
  upi_id text,
  -- Status
  status public.farmer_status NOT NULL DEFAULT 'draft',
  rejection_reason text,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.farmer_profiles TO authenticated;
GRANT SELECT ON public.farmer_profiles TO anon;
GRANT ALL ON public.farmer_profiles TO service_role;
ALTER TABLE public.farmer_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public reads approved farmers" ON public.farmer_profiles FOR SELECT TO anon, authenticated
  USING (status = 'approved');
CREATE POLICY "farmer reads own" ON public.farmer_profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "farmer inserts own" ON public.farmer_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "farmer updates own draft/pending" ON public.farmer_profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admins manage farmers" ON public.farmer_profiles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER farmer_profiles_updated_at BEFORE UPDATE ON public.farmer_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============ FARMER DOCUMENTS ============
CREATE TABLE public.farmer_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id uuid NOT NULL REFERENCES public.farmer_profiles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doc_type text NOT NULL, -- aadhaar | pan | bank_proof | farm_photo | certification
  file_url text NOT NULL,
  label text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.farmer_documents TO authenticated;
GRANT ALL ON public.farmer_documents TO service_role;
ALTER TABLE public.farmer_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "farmer manages own docs" ON public.farmer_documents FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admins read all docs" ON public.farmer_documents FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

-- ============ FARMER PRODUCTS ============
DO $$ BEGIN
  CREATE TYPE public.product_status AS ENUM ('draft','pending','published','rejected','archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE public.farmer_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id uuid NOT NULL REFERENCES public.farmer_profiles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  category text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  compare_at_price numeric(10,2),
  stock int NOT NULL DEFAULT 0 CHECK (stock >= 0),
  unit text NOT NULL DEFAULT 'kg',
  weight_grams int,
  images text[] DEFAULT '{}',
  status public.product_status NOT NULL DEFAULT 'draft',
  featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(farmer_id, slug)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.farmer_products TO authenticated;
GRANT SELECT ON public.farmer_products TO anon;
GRANT ALL ON public.farmer_products TO service_role;
ALTER TABLE public.farmer_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public reads published products" ON public.farmer_products FOR SELECT TO anon, authenticated
  USING (status = 'published');
CREATE POLICY "farmer reads own products" ON public.farmer_products FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "farmer manages own products" ON public.farmer_products FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admins manage all products" ON public.farmer_products FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER farmer_products_updated_at BEFORE UPDATE ON public.farmer_products
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============ FARMER PAYOUTS ============
DO $$ BEGIN
  CREATE TYPE public.payout_status AS ENUM ('scheduled','processing','paid','failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE public.farmer_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id uuid NOT NULL REFERENCES public.farmer_profiles(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  gross_amount numeric(12,2) NOT NULL DEFAULT 0,
  fees numeric(12,2) NOT NULL DEFAULT 0,
  net_amount numeric(12,2) NOT NULL DEFAULT 0,
  status public.payout_status NOT NULL DEFAULT 'scheduled',
  settled_at timestamptz,
  reference text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.farmer_payouts TO authenticated;
GRANT ALL ON public.farmer_payouts TO service_role;
ALTER TABLE public.farmer_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "farmer reads own payouts" ON public.farmer_payouts FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.farmer_profiles f WHERE f.id = farmer_id AND f.user_id = auth.uid()));
CREATE POLICY "admins manage payouts" ON public.farmer_payouts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER farmer_payouts_updated_at BEFORE UPDATE ON public.farmer_payouts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
