-- Group Icons Storage Bucket Configuration

-- Create group-icons bucket
INSERT INTO storage.buckets (id, name, public, avif_autodetection, allowed_mime_types)
VALUES ('group-icons', 'group-icons', true, false, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

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
        AND auth.uid() IS NOT NULL
    );

CREATE POLICY "Users can delete group icons they uploaded" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'group-icons' 
        AND auth.uid() IS NOT NULL
    );