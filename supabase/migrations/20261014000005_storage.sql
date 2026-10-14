-- 0005 · Storage bucket for images uploaded from the admin panel.
-- Public read, admin-only write, 5 MB limit, images only.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images', 'product-images', true, 5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy product_images_read   on storage.objects for select using (bucket_id = 'product-images');
create policy product_images_insert on storage.objects for insert with check (bucket_id = 'product-images' and public.is_admin());
create policy product_images_update on storage.objects for update using (bucket_id = 'product-images' and public.is_admin());
create policy product_images_delete on storage.objects for delete using (bucket_id = 'product-images' and public.is_admin());
