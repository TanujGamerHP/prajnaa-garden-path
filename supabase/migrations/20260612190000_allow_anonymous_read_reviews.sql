-- Allow anonymous read access to product_reviews
DROP POLICY IF EXISTS "pr_authenticated_read" ON public.product_reviews;
DROP POLICY IF EXISTS "pr_public_read" ON public.product_reviews;

CREATE POLICY "pr_public_read" ON public.product_reviews
  FOR SELECT USING (true);
