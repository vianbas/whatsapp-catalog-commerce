-- Discount / promo codes
-- Apply AFTER schema.sql + rls.sql.

-- Table -----------------------------------------------------------------------
create table if not exists public.discount_codes (
  id         uuid primary key default gen_random_uuid(),
  code       text not null,
  type       text not null check (type in ('percent', 'flat')),
  value      integer not null check (value > 0),
  -- percent: 1-100 (%), flat: whole rupiah amount
  max_uses   integer,          -- null = unlimited
  uses       integer not null default 0 check (uses >= 0),
  expires_at timestamptz,      -- null = never expires
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint discount_codes_code_unique unique (lower(code))
);

drop trigger if exists trg_discount_codes_updated_at on public.discount_codes;
create trigger trg_discount_codes_updated_at
  before update on public.discount_codes
  for each row execute function public.set_updated_at();

-- RLS -------------------------------------------------------------------------
alter table public.discount_codes enable row level security;

drop policy if exists "discount_codes_admin_all" on public.discount_codes;
create policy "discount_codes_admin_all"
  on public.discount_codes for all
  using (public.is_admin())
  with check (public.is_admin());

-- Validation RPC --------------------------------------------------------------
-- Callable by anon (no direct table access). Returns discount info for a valid
-- code, or NULL if the code is unknown / expired / exhausted / inactive.
-- Also atomically increments `uses` on a successful lookup.
create or replace function public.apply_discount_code(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  rec public.discount_codes;
begin
  select * into rec
  from public.discount_codes
  where lower(code) = lower(p_code)
    and is_active = true
    and (expires_at is null or expires_at > now())
    and (max_uses is null or uses < max_uses)
  for update;

  if not found then
    return null;
  end if;

  update public.discount_codes
  set uses = uses + 1
  where id = rec.id;

  return jsonb_build_object(
    'id',    rec.id,
    'code',  rec.code,
    'type',  rec.type,
    'value', rec.value
  );
end;
$$;

grant execute on function public.apply_discount_code(text) to anon, authenticated;
