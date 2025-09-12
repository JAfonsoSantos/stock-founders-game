-- Create storage buckets for logos and headers if they don't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('headers', 'headers', true)
ON CONFLICT (id) DO NOTHING;

-- Create policies for logo uploads (anyone can upload/read)
CREATE POLICY "Allow public read access on logos bucket" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'logos');

CREATE POLICY "Allow uploads to logos bucket" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'logos');

CREATE POLICY "Allow updates to logos bucket" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'logos');

-- Create policies for header uploads (anyone can upload/read)
CREATE POLICY "Allow public read access on headers bucket" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'headers');

CREATE POLICY "Allow uploads to headers bucket" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'headers');

CREATE POLICY "Allow updates to headers bucket" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'headers');