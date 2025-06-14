-- Supabase Storage Buckets Configuration

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, avif_autodetection, allowed_mime_types)
VALUES 
    ('avatars', 'avatars', true, false, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
    ('stamps', 'stamps', true, false, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
    ('group-icons', 'group-icons', true, false, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars bucket
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'avatars' 
        AND auth.uid()::TEXT = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can update their own avatar" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'avatars' 
        AND auth.uid()::TEXT = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own avatar" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'avatars' 
        AND auth.uid()::TEXT = (storage.foldername(name))[1]
    );

-- Storage policies for stamps bucket
CREATE POLICY "Stamp images are publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'stamps');

CREATE POLICY "Authenticated users can upload stamps" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'stamps' 
        AND auth.uid() IS NOT NULL
    );

CREATE POLICY "Users can update their own stamps" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'stamps' 
        AND auth.uid()::TEXT = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own stamps" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'stamps' 
        AND auth.uid()::TEXT = (storage.foldername(name))[1]
    );

-- Storage policies for group-icons bucket
CREATE POLICY "Group icon images are publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'group-icons');

CREATE POLICY "Authenticated users can upload group icons" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'group-icons' 
        AND auth.uid() IS NOT NULL
    );

CREATE POLICY "Users can update group icons they uploaded" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'group-icons' 
        AND auth.uid()::TEXT = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete group icons they uploaded" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'group-icons' 
        AND auth.uid()::TEXT = (storage.foldername(name))[1]
    );