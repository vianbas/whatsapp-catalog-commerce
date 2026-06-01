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

create trigger trg_store_settings_updated_at
  before update on public.store_settings
  for each row execute function public.set_updated_at();
