-- Esamaï — Storage images produits
-- Exécute ce fichier dans Supabase → SQL Editor
-- (après schema.sql)
--
-- Bucket PUBLIC : les images s'ouvrent via l'URL publique.
-- On NE met PAS de policy SELECT pour anon/public :
-- ça permettrait de lister tous les fichiers du bucket.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- Retire l'ancienne policy trop large (listing public)
drop policy if exists "Public read product images" on storage.objects;

drop policy if exists "Auth upload product images" on storage.objects;
create policy "Auth upload product images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'product-images');

drop policy if exists "Auth update product images" on storage.objects;
create policy "Auth update product images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'product-images')
  with check (bucket_id = 'product-images');

drop policy if exists "Auth delete product images" on storage.objects;
create policy "Auth delete product images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'product-images');
