-- WhatsApp Catalog Commerce — Row Level Security
-- Apply AFTER schema.sql.
--
-- Policy model:
--   * Anonymous/public visitors may READ active categories, active products,
--     and the store settings — this powers the public storefront.
--   * Anonymous visitors may INSERT orders (WhatsApp checkout) but not read them.
--   * Only users whose profile has role = 'admin' may manage catalog data,
--     settings, and orders. This is enforced via the public.is_admin() helper
--     (defined in schema.sql), which is also mirrored by the admin layout.

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

-- NOTE: no self-update policy. Letting a user update their own profile row
-- would allow a staff member to set their own role to 'admin'. Role changes go
-- only through admins (policy below).
drop policy if exists "profiles_update_own" on public.profiles;

-- Admins can read every profile (for the user-management UI) and update roles.
drop policy if exists "profiles_admin_read" on public.profiles;
create policy "profiles_admin_read"
  on public.profiles for select
  using (public.is_admin());

drop policy if exists "profiles_admin_update" on public.profiles;
create policy "profiles_admin_update"
  on public.profiles for update
  using (public.is_admin())
  with check (public.is_admin());

-- categories -----------------------------------------------------------------
drop policy if exists "categories_public_read_active" on public.categories;
create policy "categories_public_read_active"
  on public.categories for select
  using (is_active = true);

drop policy if exists "categories_admin_all" on public.categories;
create policy "categories_admin_all"
  on public.categories for all
  using (public.is_admin())
  with check (public.is_admin());

-- products -------------------------------------------------------------------
drop policy if exists "products_public_read_active" on public.products;
create policy "products_public_read_active"
  on public.products for select
  using (is_active = true);

drop policy if exists "products_admin_all" on public.products;
create policy "products_admin_all"
  on public.products for all
  using (public.is_admin())
  with check (public.is_admin());

-- store_settings -------------------------------------------------------------
drop policy if exists "store_settings_public_read" on public.store_settings;
create policy "store_settings_public_read"
  on public.store_settings for select
  using (true);

drop policy if exists "store_settings_admin_all" on public.store_settings;
create policy "store_settings_admin_all"
  on public.store_settings for all
  using (public.is_admin())
  with check (public.is_admin());

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
  using (public.is_admin());

drop policy if exists "orders_admin_write" on public.orders;
create policy "orders_admin_write"
  on public.orders for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "orders_admin_delete" on public.orders;
create policy "orders_admin_delete"
  on public.orders for delete
  using (public.is_admin());
