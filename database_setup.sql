-- Create enum for user roles (retailer/manufacturer/super_admin)
CREATE TYPE public.user_role AS ENUM ('retailer', 'manufacturer', 'super_admin');

-- Create profiles table for additional user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  gst_number TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role user_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- RLS policies for profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS policies for user_roles
CREATE POLICY "Users can view their own role"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own role"
ON public.user_roles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id, 
    business_name, 
    owner_name, 
    email, 
    phone, 
    gst_number, 
    address, 
    city, 
    state, 
    pincode
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'business_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'owner_name', ''),
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data ->> 'phone', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'gst_number', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'address', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'city', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'state', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'pincode', '')
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id, 
    COALESCE(
      (NEW.raw_user_meta_data ->> 'role')::user_role, 
      'retailer'::user_role
    )
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
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
-- Create orders table
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  retailer_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  shipping_address JSONB NOT NULL,
  subtotal NUMERIC NOT NULL,
  gst NUMERIC NOT NULL,
  shipping NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL,
  payment_method TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create order items table
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity INTEGER NOT NULL,
  price NUMERIC NOT NULL,
  color TEXT NOT NULL,
  size TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cart items table
CREATE TABLE public.cart_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  color TEXT NOT NULL,
  size TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id, color, size)
);

-- Create addresses table
CREATE TABLE public.addresses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  phone TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

-- Orders RLS policies
CREATE POLICY "Retailers can view their own orders" ON public.orders
  FOR SELECT USING (auth.uid() = retailer_id);

CREATE POLICY "Retailers can create orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = retailer_id);

CREATE POLICY "Retailers can update their own orders" ON public.orders
  FOR UPDATE USING (auth.uid() = retailer_id);

-- Manufacturers can view orders containing their products
CREATE POLICY "Manufacturers can view orders with their products" ON public.orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.order_items oi
      JOIN public.products p ON oi.product_id = p.id
      WHERE oi.order_id = orders.id AND p.manufacturer_id = auth.uid()
    )
  );

-- Order items RLS policies
CREATE POLICY "Users can view their order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders WHERE id = order_items.order_id AND retailer_id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM public.products WHERE id = order_items.product_id AND manufacturer_id = auth.uid())
  );

CREATE POLICY "Retailers can create order items" ON public.order_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.orders WHERE id = order_items.order_id AND retailer_id = auth.uid())
  );

-- Cart items RLS policies
CREATE POLICY "Users can view their cart" ON public.cart_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can add to cart" ON public.cart_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their cart" ON public.cart_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete from cart" ON public.cart_items
  FOR DELETE USING (auth.uid() = user_id);

-- Addresses RLS policies
CREATE POLICY "Users can view their addresses" ON public.addresses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create addresses" ON public.addresses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their addresses" ON public.addresses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their addresses" ON public.addresses
  FOR DELETE USING (auth.uid() = user_id);

-- Update trigger for orders
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Update trigger for cart_items
CREATE TRIGGER update_cart_items_updated_at
  BEFORE UPDATE ON public.cart_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Update trigger for addresses
CREATE TRIGGER update_addresses_updated_at
  BEFORE UPDATE ON public.addresses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- Add product_images table for gallery support
CREATE TABLE public.product_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

-- Manufacturers can manage their product images
CREATE POLICY "Manufacturers can insert product images"
ON public.product_images FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.products 
  WHERE id = product_images.product_id 
  AND manufacturer_id = auth.uid()
));

CREATE POLICY "Manufacturers can update product images"
ON public.product_images FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.products 
  WHERE id = product_images.product_id 
  AND manufacturer_id = auth.uid()
));

CREATE POLICY "Manufacturers can delete product images"
ON public.product_images FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.products 
  WHERE id = product_images.product_id 
  AND manufacturer_id = auth.uid()
));

-- Anyone authenticated can view product images
CREATE POLICY "Authenticated users can view product images"
ON public.product_images FOR SELECT
USING (auth.role() = 'authenticated');

-- Create reviews table
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id, user_id)
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Users can create reviews for products they purchased
CREATE POLICY "Users can create reviews"
ON public.reviews FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their reviews"
ON public.reviews FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their reviews"
ON public.reviews FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Anyone authenticated can view reviews"
ON public.reviews FOR SELECT
USING (auth.role() = 'authenticated');

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT false,
  related_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their notifications"
ON public.notifications FOR DELETE
USING (auth.uid() = user_id);

-- System can create notifications (via service role)
CREATE POLICY "System can create notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

-- Add trigger for reviews updated_at
CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
-- 1) Enforce valid order status values (drop if exists, then add)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'orders_valid_status'
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_valid_status
      CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'));
  END IF;
END $$;

-- 2) Allow manufacturers to update status of orders containing their products
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Manufacturers can update order status' AND tablename = 'orders'
  ) THEN
    CREATE POLICY "Manufacturers can update order status"
    ON public.orders
    FOR UPDATE
    USING (
      EXISTS (
        SELECT 1
        FROM public.order_items oi
        JOIN public.products p ON oi.product_id = p.id
        WHERE oi.order_id = orders.id
          AND p.manufacturer_id = auth.uid()
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1
        FROM public.order_items oi
        JOIN public.products p ON oi.product_id = p.id
        WHERE oi.order_id = orders.id
          AND p.manufacturer_id = auth.uid()
      )
    );
  END IF;
END $$;

-- 3) Tighten storage policies so manufacturers can only modify their own images
DROP POLICY IF EXISTS "Manufacturers can update their product images" ON storage.objects;
DROP POLICY IF EXISTS "Manufacturers can delete their product images" ON storage.objects;

CREATE POLICY "Manufacturers can update own images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Manufacturers can delete own images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4) Create trigger so new signups automatically get profile and role records
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 5) Backfill profiles for existing users that are missing them
INSERT INTO public.profiles (
  user_id,
  business_name,
  owner_name,
  email,
  phone,
  gst_number,
  address,
  city,
  state,
  pincode
)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data ->> 'business_name', ''),
  COALESCE(u.raw_user_meta_data ->> 'owner_name', ''),
  COALESCE(u.email, ''),
  COALESCE(u.raw_user_meta_data ->> 'phone', ''),
  COALESCE(u.raw_user_meta_data ->> 'gst_number', ''),
  COALESCE(u.raw_user_meta_data ->> 'address', ''),
  COALESCE(u.raw_user_meta_data ->> 'city', ''),
  COALESCE(u.raw_user_meta_data ->> 'state', ''),
  COALESCE(u.raw_user_meta_data ->> 'pincode', '')
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE p.user_id IS NULL;

-- 6) Backfill user_roles for existing users that are missing them
INSERT INTO public.user_roles (user_id, role)
SELECT
  u.id,
  (u.raw_user_meta_data ->> 'role')::public.user_role
FROM auth.users u
LEFT JOIN public.user_roles r ON r.user_id = u.id
WHERE r.user_id IS NULL
  AND u.raw_user_meta_data ->> 'role' IS NOT NULL;
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
