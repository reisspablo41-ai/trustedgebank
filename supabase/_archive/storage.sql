-- ================================================
-- STORAGE BUCKETS CONFIGURATION
-- ================================================

-- Create general storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('northbridge-storage', 'northbridge-storage', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
-- Allow authenticated users to upload files to their own folder
CREATE POLICY "Users can upload to their own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'northbridge-storage' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to view files in their own folder
CREATE POLICY "Users can view their own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'northbridge-storage' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public access to read files (since it's a public bucket)
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'northbridge-storage');

-- Allow users to update their own files
CREATE POLICY "Users can update their own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'northbridge-storage' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'northbridge-storage' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
