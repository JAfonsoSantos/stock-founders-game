-- Create RLS policies for startup-logos bucket
-- Allow authenticated users to view all startup logos (public bucket)
CREATE POLICY "Public startup logos are viewable by everyone" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'startup-logos');

-- Allow authenticated users to upload startup logos
CREATE POLICY "Authenticated users can upload startup logos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'startup-logos' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to update their own startup logos
CREATE POLICY "Authenticated users can update startup logos" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'startup-logos' 
  AND auth.role() = 'authenticated'
)
WITH CHECK (
  bucket_id = 'startup-logos' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete startup logos
CREATE POLICY "Authenticated users can delete startup logos" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'startup-logos' 
  AND auth.role() = 'authenticated'
);