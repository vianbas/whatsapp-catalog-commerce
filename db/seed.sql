-- WhatsApp Catalog Commerce — seed data (development/demo)
-- Apply AFTER schema.sql and rls.sql.
--
-- Idempotent: re-running upserts the same rows by slug / singleton.

-- Store settings (singleton) -------------------------------------------------
insert into public.store_settings (singleton, store_name, store_description, whatsapp_number, currency)
values (
  true,
  'Toko Contoh',
  'Demo catalog powered by WhatsApp Catalog Commerce.',
  '6281234567890',
  'IDR'
)
on conflict (singleton) do update
  set store_name        = excluded.store_name,
      store_description = excluded.store_description,
      whatsapp_number   = excluded.whatsapp_number;

-- Categories -----------------------------------------------------------------
insert into public.categories (name, slug, description, sort_order) values
  ('Apparel',     'apparel',     'Clothing and wearables.', 1),
  ('Accessories', 'accessories', 'Bags, hats, and add-ons.', 2),
  ('Home',        'home',        'Home and living goods.',   3)
on conflict (slug) do update
  set name        = excluded.name,
      description = excluded.description,
      sort_order  = excluded.sort_order;

-- Products -------------------------------------------------------------------
insert into public.products
  (category_id, name, slug, description, price, compare_at_price, images, stock_status, is_featured, sort_order)
values
  (
    (select id from public.categories where slug = 'apparel'),
    'Classic Cotton Tee', 'classic-cotton-tee',
    'Soft 100% cotton t-shirt, unisex fit.',
    150000, 200000, '{}', 'available', true, 1
  ),
  (
    (select id from public.categories where slug = 'accessories'),
    'Canvas Tote Bag', 'canvas-tote-bag',
    'Durable everyday tote with reinforced handles.',
    95000, null, '{}', 'available', true, 2
  ),
  (
    (select id from public.categories where slug = 'home'),
    'Ceramic Mug', 'ceramic-mug',
    'Matte-finish 350ml ceramic mug.',
    75000, null, '{}', 'preorder', false, 3
  )
on conflict (slug) do update
  set description      = excluded.description,
      price            = excluded.price,
      compare_at_price = excluded.compare_at_price,
      stock_status     = excluded.stock_status,
      is_featured      = excluded.is_featured,
      sort_order       = excluded.sort_order;
