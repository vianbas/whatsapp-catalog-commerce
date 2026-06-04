-- WhatsApp Catalog Commerce — database schema
-- Target: Supabase PostgreSQL.
-- Apply in order: schema.sql → rls.sql → seed.sql
--
-- Run this in the Supabase SQL editor or via `supabase db` / psql.

-- Extensions ----------------------------------------------------------------
create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- Enums ----------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'stock_status') then
    create type public.stock_status as enum ('available', 'sold_out', 'preorder');
  end if;
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('admin', 'staff');
  end if;
end$$;

-- updated_at trigger helper --------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- profiles -------------------------------------------------------------------
-- One row per authenticated admin/staff user. Mirrors auth.users(id).
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  role        public.user_role not null default 'admin',
  created_at  timestamptz not null default now()
);

-- categories -----------------------------------------------------------------
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  description text,
  is_active   boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists trg_categories_updated_at on public.categories;
create trigger trg_categories_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

-- products -------------------------------------------------------------------
create table if not exists public.products (
  id               uuid primary key default gen_random_uuid(),
  category_id      uuid references public.categories (id) on delete set null,
  name             text not null,
  slug             text not null unique,
  description      text,
  price            integer not null default 0 check (price >= 0),       -- whole rupiah
  compare_at_price integer check (compare_at_price >= 0),
  images           text[] not null default '{}',
  stock_status     public.stock_status not null default 'available',
  is_featured      boolean not null default false,
  is_active        boolean not null default true,
  sort_order       integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists idx_products_category_id on public.products (category_id);
create index if not exists idx_products_is_active   on public.products (is_active);
create index if not exists idx_products_is_featured on public.products (is_featured);

drop trigger if exists trg_products_updated_at on public.products;
create trigger trg_products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- store_settings -------------------------------------------------------------
-- Singleton row of storefront configuration. The `singleton` boolean + unique
-- index guarantees at most one row.
create table if not exists public.store_settings (
  id                        uuid primary key default gen_random_uuid(),
  singleton                 boolean not null default true,
  store_name                text not null default 'My Store',
  store_description         text,
  whatsapp_number           text not null default '6281234567890',
  currency                  text not null default 'IDR',
  checkout_message_template text,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  constraint store_settings_singleton check (singleton)
);

create unique index if not exists uq_store_settings_singleton
  on public.store_settings (singleton);

drop trigger if exists trg_store_settings_updated_at on public.store_settings;
create trigger trg_store_settings_updated_at
  before update on public.store_settings
  for each row execute function public.set_updated_at();

-- orders ---------------------------------------------------------------------
-- Lightweight record of a WhatsApp checkout (an inquiry, not a paid order).
-- Created anonymously by the storefront; managed by admins.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'order_status') then
    create type public.order_status as enum ('new', 'contacted', 'completed', 'cancelled');
  end if;
end$$;

create table if not exists public.orders (
  id         uuid primary key default gen_random_uuid(),
  items      jsonb not null default '[]',   -- [{ name, price, quantity }]
  total      integer not null default 0 check (total >= 0),  -- whole rupiah
  source     text,                          -- e.g. 'cart' | 'checkout' | 'product'
  status     public.order_status not null default 'new',
  created_at timestamptz not null default now()
);

create index if not exists idx_orders_status     on public.orders (status);
create index if not exists idx_orders_created_at  on public.orders (created_at desc);

-- Role-based access ----------------------------------------------------------
-- is_admin(): used by RLS to gate management to admins. SECURITY DEFINER so it
-- can read profiles regardless of the caller's own RLS, avoiding recursion.
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

grant execute on function public.is_admin() to authenticated;

-- Auto-create a profile when an auth user is created. The first ever user
-- becomes 'admin'; subsequent users default to 'staff' (promote manually).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role)
  values (
    new.id,
    case
      when exists (select 1 from public.profiles where role = 'admin')
        then 'staff'::public.user_role
      else 'admin'::public.user_role
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Bootstrap: give every pre-existing auth user an admin profile so tightening
-- RLS below never locks out an account that already had full access. Safe to
-- re-run; only fills gaps.
insert into public.profiles (id, role)
select u.id, 'admin'::public.user_role
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id)
on conflict (id) do nothing;

-- list_users(): admin-only directory joining profiles with auth.users for email.
-- SECURITY DEFINER so it can read auth.users; the `where is_admin()` guard means
-- non-admins simply get zero rows.
create or replace function public.list_users()
returns table (
  id         uuid,
  email      text,
  full_name  text,
  role       public.user_role,
  created_at timestamptz
)
language sql
security definer
stable
set search_path = public
as $$
  select p.id, u.email::text, p.full_name, p.role, p.created_at
  from public.profiles p
  join auth.users u on u.id = p.id
  where public.is_admin()
  order by p.created_at asc;
$$;

grant execute on function public.list_users() to authenticated;
