-- Add logo_url and hero_image_url columns to games table
ALTER TABLE public.games 
ADD COLUMN logo_url TEXT,
ADD COLUMN hero_image_url TEXT;