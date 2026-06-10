-- Customer accounts
-- Apply AFTER schema.sql + rls.sql.
--
-- Adds a 'customer' role so storefront shoppers can register and sign in
-- without gaining any admin access. Also adds store_snap_ids() — a
-- SECURITY DEFINER RPC that lets non-admin authenticated users store their
-- Midtrans snap token + order ID (orders_admin_write RLS would otherwise
-- silently block the direct UPDATE in snap-token/retry-token routes).

-- 1. Extend the user_role enum ------------------------------------------------
-- ADD VALUE cannot run inside a transaction block; Supabase SQL editor runs
-- each statement atomically, so this is safe there.
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'customer';

-- 2. Update the signup trigger -------------------------------------------------
-- Previous behaviour: first user → admin, everyone else → staff.
-- New behaviour:      first user (no admin exists) → admin; everyone else → customer.
-- Staff must be promoted manually by an admin via /admin/users.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    CASE
      WHEN EXISTS (SELECT 1 FROM public.profiles WHERE role = 'admin')
        THEN 'customer'::public.user_role
      ELSE 'admin'::public.user_role
    END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Re-attach the trigger (CREATE OR REPLACE above doesn't re-create the trigger).
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. store_snap_ids() RPC ------------------------------------------------------
-- Stores snap_token and/or midtrans_order_id on an order, bypassing
-- orders_admin_write RLS. Called from the snap-token and retry-token API
-- routes after Midtrans returns a token.
--
-- Security: only updates the caller's own order (customer_id = auth.uid())
-- or a guest order (customer_id IS NULL — the API route just created it
-- and is the only party that knows the UUID).
-- COALESCE: passing NULL for either field preserves the existing DB value,
-- so retry-token can update just midtrans_order_id without clobbering snap_token.
CREATE OR REPLACE FUNCTION public.store_snap_ids(
  p_order_id          uuid,
  p_snap_token        text DEFAULT NULL,
  p_midtrans_order_id text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.orders
  SET
    snap_token        = COALESCE(p_snap_token,        snap_token),
    midtrans_order_id = COALESCE(p_midtrans_order_id, midtrans_order_id)
  WHERE id = p_order_id
    AND (customer_id = auth.uid() OR customer_id IS NULL);
END;
$$;

GRANT EXECUTE ON FUNCTION public.store_snap_ids(uuid, text, text) TO anon, authenticated;
