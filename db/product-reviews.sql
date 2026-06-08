create table if not exists public.product_reviews (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products(id) on delete cascade,
  reviewer_name text not null,
  rating      smallint not null check (rating between 1 and 5),
  body        text,
  is_approved boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists idx_product_reviews_product_id on public.product_reviews (product_id);

alter table public.product_reviews enable row level security;

-- Anyone can read approved reviews
create policy "public read approved reviews"
  on public.product_reviews for select
  using (is_approved = true);

-- Anyone can submit a review (anon + authenticated)
create policy "public insert reviews"
  on public.product_reviews for insert
  with check (true);

-- Admins (authenticated via profiles) can manage all reviews
create policy "admin manage reviews"
  on public.product_reviews for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'staff')
    )
  );
