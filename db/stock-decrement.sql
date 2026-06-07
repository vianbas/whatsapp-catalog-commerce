-- Stock auto-decrement on order
-- Apply AFTER schema.sql.
--
-- When an order is inserted, this trigger decrements stock_quantity for every
-- order item that carries a product_id field in its JSONB row. Items without
-- product_id (legacy / direct-checkout records) are skipped.
--
-- Uses SECURITY DEFINER so the decrement runs as the trigger owner regardless
-- of the caller's RLS — anonymous storefront customers can insert orders but
-- not update products directly.

create or replace function public.decrement_stock_on_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  item jsonb;
  pid  uuid;
  qty  integer;
begin
  for item in select * from jsonb_array_elements(new.items)
  loop
    -- Skip items that don't carry a product_id (e.g. legacy records).
    if not (item ? 'product_id') or (item->>'product_id') is null then
      continue;
    end if;

    pid := (item->>'product_id')::uuid;
    qty := (item->>'quantity')::integer;

    -- Decrement, clamping at 0. Also mark sold_out when stock hits 0.
    update public.products
    set
      stock_quantity = greatest(0, stock_quantity - qty),
      stock_status   = case
        when greatest(0, stock_quantity - qty) = 0 then 'sold_out'::public.stock_status
        else stock_status
      end
    where id = pid
      and stock_quantity is not null;
  end loop;

  return new;
end;
$$;

drop trigger if exists trg_decrement_stock_on_order on public.orders;
create trigger trg_decrement_stock_on_order
  after insert on public.orders
  for each row execute function public.decrement_stock_on_order();
