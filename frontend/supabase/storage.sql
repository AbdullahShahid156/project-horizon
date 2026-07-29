-- ============================================================
-- Supabase Storage Buckets
-- Run this in the Supabase SQL Editor after creating the project
-- ============================================================

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('projects', 'projects', false, 52428800, ARRAY['application/json', 'text/html', 'text/markdown', 'application/zip']),
  ('generated-assets', 'generated-assets', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']),
  ('images', 'images', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']),
  ('documents', 'documents', false, 10485760, ARRAY['application/pdf', 'text/plain', 'text/csv', 'application/json'])
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Storage RLS Policies
-- ============================================================

-- Avatars: public read, authenticated write
CREATE POLICY "Avatar public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Avatar upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Avatar update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Avatar delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Projects: authenticated read/write within org
CREATE POLICY "Projects read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'projects'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Projects insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'projects'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Projects update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'projects'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Projects delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'projects'
    AND auth.role() = 'authenticated'
  );

-- Generated Assets: authenticated read/write
CREATE POLICY "Generated assets read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'generated-assets'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Generated assets insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'generated-assets'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Generated assets delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'generated-assets'
    AND auth.role() = 'authenticated'
  );

-- Images: authenticated read/write
CREATE POLICY "Images read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'images'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Images insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'images'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Images update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'images'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Images delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'images'
    AND auth.role() = 'authenticated'
  );

-- Documents: authenticated read/write
CREATE POLICY "Documents read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Documents insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Documents delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'documents'
    AND auth.role() = 'authenticated'
  );
