
CREATE POLICY "farmer manages own kyc files" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id='kyc-docs' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id='kyc-docs' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "admins read all kyc files" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id='kyc-docs' AND has_role(auth.uid(),'admin'));
