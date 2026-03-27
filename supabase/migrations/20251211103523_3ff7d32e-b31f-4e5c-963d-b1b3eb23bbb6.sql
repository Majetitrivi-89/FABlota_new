-- Create products table for manufacturers to add items
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  manufacturer_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  min_order_quantity INTEGER NOT NULL DEFAULT 50,
  sizes TEXT[] NOT NULL DEFAULT '{}',
  colors TEXT[] NOT NULL DEFAULT '{}',
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Manufacturers can manage their own products
CREATE POLICY "Manufacturers can insert their own products"
ON public.products
FOR INSERT
WITH CHECK (
  auth.uid() = manufacturer_id AND
  public.get_user_role(auth.uid()) = 'manufacturer'
);

CREATE POLICY "Manufacturers can update their own products"
ON public.products
FOR UPDATE
USING (auth.uid() = manufacturer_id)
WITH CHECK (auth.uid() = manufacturer_id);

CREATE POLICY "Manufacturers can delete their own products"
ON public.products
FOR DELETE
USING (auth.uid() = manufacturer_id);

-- Retailers can view all active products (manufacturer identity hidden)
CREATE POLICY "Retailers can view active products"
ON public.products
FOR SELECT
USING (
  is_active = true AND
  public.get_user_role(auth.uid()) IN ('retailer', 'manufacturer')
);

-- Create trigger for updated_at
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);

-- Storage policies for product images
CREATE POLICY "Manufacturers can upload product images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'product-images' AND
  auth.uid() IS NOT NULL AND
  public.get_user_role(auth.uid()) = 'manufacturer'
);

CREATE POLICY "Anyone can view product images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Manufacturers can update their product images"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'product-images' AND auth.uid() IS NOT NULL)
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Manufacturers can delete their product images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'product-images' AND auth.uid() IS NOT NULL);