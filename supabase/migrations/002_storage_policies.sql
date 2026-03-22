-- Storage RLS policies for the videos bucket
-- Bucket creation is handled by the preview-deploy workflow via Management API
-- and manually in production via the Supabase dashboard.
-- Allows authenticated users to upload, and read/delete only their own files.
-- Storage paths are scoped: videos/{user_id}/{file}

CREATE POLICY "Authenticated users can upload videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'videos');

CREATE POLICY "Users can read own videos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'videos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own videos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'videos' AND (storage.foldername(name))[1] = auth.uid()::text);
