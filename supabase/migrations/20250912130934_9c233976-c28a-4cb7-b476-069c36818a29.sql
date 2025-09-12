-- Create storage buckets for branding uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('headers', 'headers', true);

-- Create RLS policies for logo uploads
CREATE POLICY "Logo images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'logos');

CREATE POLICY "Authenticated users can upload logos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'logos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update logos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'logos' AND auth.uid() IS NOT NULL);

-- Create RLS policies for header uploads  
CREATE POLICY "Header images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'headers');

CREATE POLICY "Authenticated users can upload headers" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'headers' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update headers" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'headers' AND auth.uid() IS NOT NULL);