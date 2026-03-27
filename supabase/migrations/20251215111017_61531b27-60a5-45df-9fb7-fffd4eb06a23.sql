-- 1) Update default min_order_quantity to 15
ALTER TABLE public.products ALTER COLUMN min_order_quantity SET DEFAULT 15;

-- 2) Add brand_logo column to a new retailer_brands table for storing brand configurations
CREATE TABLE IF NOT EXISTS public.retailer_brands (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  brand_name text NOT NULL,
  brand_logo_url text,
  label_placement text,
  category text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.retailer_brands ENABLE ROW LEVEL SECURITY;

-- RLS Policies for retailer_brands
CREATE POLICY "Users can view their own brands"
ON public.retailer_brands FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own brands"
ON public.retailer_brands FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own brands"
ON public.retailer_brands FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own brands"
ON public.retailer_brands FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_retailer_brands_updated_at
  BEFORE UPDATE ON public.retailer_brands
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Create brand-logos storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('brand-logos', 'brand-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for brand-logos bucket
CREATE POLICY "Brand logos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'brand-logos');

CREATE POLICY "Users can upload their brand logos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'brand-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their brand logos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'brand-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their brand logos"
ON storage.objects FOR DELETE
USING (bucket_id = 'brand-logos' AND auth.uid()::text = (storage.foldername(name))[1]);