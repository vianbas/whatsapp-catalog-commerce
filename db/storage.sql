-- WhatsApp Catalog Commerce — Storage setup
-- Apply AFTER schema.sql (needs public.is_admin()). Idempotent — safe to re-run.
--
-- Creates the bucket the product image uploader writes to and locks writes to
-- admins while keeping images publicly readable for the storefront.

-- product-images bucket (public read of objects via their public URL).
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = excluded.public;

-- storage.objects already has RLS enabled by Supabase; we just add policies
-- scoped to this bucket. Public read; only admins (profiles.role = 'admin')
-- may upload/replace/remove images.
drop policy if exists "product_images_public_read" on storage.objects;
create policy "product_images_public_read"
  on storage.objects for select
  using (bucket_id = 'product-images');

drop policy if exists "product_images_admin_insert" on storage.objects;
create policy "product_images_admin_insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "product_images_admin_update" on storage.objects;
create policy "product_images_admin_update"
  on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "product_images_admin_delete" on storage.objects;
create policy "product_images_admin_delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and public.is_admin());
