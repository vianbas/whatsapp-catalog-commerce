-- Payment settlement RPC for Midtrans orders.
--
-- Why an RPC: the `orders` table only grants UPDATE to admins (orders_admin_write).
-- The Midtrans webhook runs as `anon` and the check-status poller runs as a
-- non-admin customer, so a direct .update() on orders affects 0 rows under RLS.
-- This SECURITY DEFINER function bypasses RLS to apply the payment result, and
-- is the single place that reconciles reserved stock:
--
--   * paid    → keep stock held (re-reserve if it was previously released)
--   * failed  → release reserved stock back to products
--
-- Stock is reserved at order creation by the decrement trigger; `stock_released`
-- tracks whether it has since been given back, making release/re-reserve idempotent.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS stock_released boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.settle_payment(
  p_order_id     uuid,
  p_status       text,
  p_payment_type text
)
RETURNS TABLE (
  id             uuid,
  customer_id    uuid,
  customer_phone text,
  customer_email text,
  customer_name  text,
  items          jsonb,
  total          integer,
  notified       boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  o    public.orders;
  item jsonb;
  pid  uuid;
  qty  integer;
BEGIN
  SELECT * INTO o FROM public.orders WHERE public.orders.id = p_order_id FOR UPDATE;

  -- Unknown order, or already paid (terminal) — do nothing, return no row so the
  -- caller never double-notifies on webhook/poller retries.
  IF NOT FOUND OR o.payment_status = 'paid' THEN
    RETURN;
  END IF;

  UPDATE public.orders
  SET payment_status = p_status,
      payment_type   = COALESCE(p_payment_type, payment_type)
  WHERE public.orders.id = p_order_id;

  -- failed/expired → give reserved stock back (once).
  IF p_status = 'failed' AND NOT o.stock_released THEN
    FOR item IN SELECT * FROM jsonb_array_elements(o.items)
    LOOP
      IF NOT (item ? 'product_id') OR (item->>'product_id') IS NULL THEN
        CONTINUE;
      END IF;
      pid := (item->>'product_id')::uuid;
      qty := (item->>'quantity')::integer;
      UPDATE public.products
      SET stock_quantity = stock_quantity + qty,
          stock_status   = CASE WHEN stock_status = 'sold_out'::public.stock_status
                                THEN 'available'::public.stock_status
                                ELSE stock_status END
      WHERE products.id = pid AND stock_quantity IS NOT NULL;
    END LOOP;
    UPDATE public.orders SET stock_released = true WHERE public.orders.id = p_order_id;

  -- paid after a prior release (retry) → re-reserve. Clamped, never blocks: the
  -- customer has already paid, so honour the order even if stock ran low meanwhile.
  ELSIF p_status = 'paid' AND o.stock_released THEN
    FOR item IN SELECT * FROM jsonb_array_elements(o.items)
    LOOP
      IF NOT (item ? 'product_id') OR (item->>'product_id') IS NULL THEN
        CONTINUE;
      END IF;
      pid := (item->>'product_id')::uuid;
      qty := (item->>'quantity')::integer;
      UPDATE public.products
      SET stock_quantity = greatest(0, stock_quantity - qty),
          stock_status   = CASE WHEN greatest(0, stock_quantity - qty) = 0
                                THEN 'sold_out'::public.stock_status
                                ELSE stock_status END
      WHERE products.id = pid AND stock_quantity IS NOT NULL;
    END LOOP;
    UPDATE public.orders SET stock_released = false WHERE public.orders.id = p_order_id;
  END IF;

  -- Notify exactly once, on the transition into paid.
  RETURN QUERY
  SELECT o.id, o.customer_id, o.customer_phone, o.customer_email,
         o.customer_name, o.items, o.total, (p_status = 'paid');
END;
$$;

GRANT EXECUTE ON FUNCTION public.settle_payment(uuid, text, text) TO anon, authenticated;
