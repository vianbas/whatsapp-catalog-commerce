-- WhatsApp Catalog Commerce — Row Level Security
-- Apply AFTER schema.sql.
--
-- Policy model (kept intentionally simple for the foundation):
--   * Anonymous/public visitors may READ active categories, active products,
--     and the store settings — this powers the public storefront.
--   * Any authenticated user is treated as an admin and may manage catalog
--     data and settings.
--
-- HARDENING NOTE: "authenticated == admin" is a deliberate simplification.
-- The `profiles.role` column already exists. To enforce true role checks
-- later, replace `auth.role() = 'authenticated'` below with a check such as:
--     exists (select 1 from public.profiles p
--             where p.id = auth.uid() and p.role = 'admin')
-- No schema change is required to do so.

-- Enable RLS -----------------------------------------------------------------
alter table public.profiles       enable row level security;
alter table public.categories     enable row level security;
alter table public.products       enable row level security;
alter table public.store_settings enable row level security;
alter table public.orders         enable row level security;

-- profiles -------------------------------------------------------------------
-- A user can read and update only their own profile row.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- categories -----------------------------------------------------------------
drop policy if exists "categories_public_read_active" on public.categories;
create policy "categories_public_read_active"
  on public.categories for select
  using (is_active = true);

drop policy if exists "categories_admin_all" on public.categories;
create policy "categories_admin_all"
  on public.categories for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- products -------------------------------------------------------------------
drop policy if exists "products_public_read_active" on public.products;
create policy "products_public_read_active"
  on public.products for select
  using (is_active = true);

drop policy if exists "products_admin_all" on public.products;
create policy "products_admin_all"
  on public.products for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- store_settings -------------------------------------------------------------
drop policy if exists "store_settings_public_read" on public.store_settings;
create policy "store_settings_public_read"
  on public.store_settings for select
  using (true);

drop policy if exists "store_settings_admin_all" on public.store_settings;
create policy "store_settings_admin_all"
  on public.store_settings for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- orders ---------------------------------------------------------------------
-- Storefront shoppers are anonymous, so they may INSERT an order but never read
-- one back (insert is done without a returning select). Admins manage all.
drop policy if exists "orders_public_insert" on public.orders;
create policy "orders_public_insert"
  on public.orders for insert
  with check (true);

drop policy if exists "orders_admin_read" on public.orders;
create policy "orders_admin_read"
  on public.orders for select
  using (auth.role() = 'authenticated');

drop policy if exists "orders_admin_write" on public.orders;
create policy "orders_admin_write"
  on public.orders for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "orders_admin_delete" on public.orders;
create policy "orders_admin_delete"
  on public.orders for delete
  using (auth.role() = 'authenticated');
