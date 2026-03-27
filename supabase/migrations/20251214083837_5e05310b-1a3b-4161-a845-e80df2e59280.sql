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