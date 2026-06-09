-- Guest order lookup RPC.
-- Matches by phone (normalised) + order ID (full UUID or 8-char prefix).
-- SECURITY DEFINER lets the anon key call it without RLS.
CREATE OR REPLACE FUNCTION public.track_order(p_phone TEXT, p_order_id TEXT)
RETURNS TABLE (
  id            UUID,
  status        TEXT,
  created_at    TIMESTAMPTZ,
  items         JSONB,
  total         NUMERIC,
  courier       TEXT,
  tracking_number TEXT,
  payment_status TEXT,
  source        TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_phone TEXT;
  v_id    TEXT;
BEGIN
  v_phone := regexp_replace(p_phone, '[^0-9]', '', 'g');
  IF left(v_phone, 1) = '0' THEN
    v_phone := '62' || right(v_phone, length(v_phone) - 1);
  END IF;

  v_id := lower(trim(p_order_id));

  RETURN QUERY
  SELECT
    o.id, o.status::TEXT, o.created_at, o.items, o.total,
    o.courier, o.tracking_number, o.payment_status, o.source
  FROM public.orders o
  WHERE
    (o.id::TEXT = v_id OR left(o.id::TEXT, 8) = left(v_id, 8))
    AND regexp_replace(coalesce(o.customer_phone, ''), '[^0-9]', '', 'g') = v_phone
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.track_order(TEXT, TEXT) TO anon;
