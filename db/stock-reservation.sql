-- Replaces the original decrement_stock_on_order trigger with an atomic
-- check-and-decrement. If any item in the order has insufficient tracked stock
-- the whole INSERT is rolled back and an exception is raised to the caller.
--
-- NULL stock_quantity = unlimited stock — those items are skipped as before.

CREATE OR REPLACE FUNCTION public.decrement_stock_on_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item     jsonb;
  pid      uuid;
  qty      integer;
  pname    text;
  affected integer;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
  LOOP
    IF NOT (item ? 'product_id') OR (item->>'product_id') IS NULL THEN
      CONTINUE;
    END IF;

    pid   := (item->>'product_id')::uuid;
    qty   := (item->>'quantity')::integer;
    pname := COALESCE(item->>'name', 'product');

    UPDATE public.products
    SET
      stock_quantity = stock_quantity - qty,
      stock_status   = CASE
        WHEN stock_quantity - qty <= 0 THEN 'sold_out'::public.stock_status
        ELSE stock_status
      END
    WHERE id = pid
      AND stock_quantity IS NOT NULL
      AND stock_quantity >= qty;

    GET DIAGNOSTICS affected = ROW_COUNT;

    -- 0 rows: either product has unlimited stock (NULL) or stock is insufficient.
    -- Only raise if the product exists with tracked stock that fell short.
    IF affected = 0 THEN
      IF EXISTS (
        SELECT 1 FROM public.products WHERE id = pid AND stock_quantity IS NOT NULL
      ) THEN
        RAISE EXCEPTION 'Stok tidak cukup untuk produk: %', pname;
      END IF;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;
