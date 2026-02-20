drop policy "Authenticated users can upload post media" on storage.objects;

create policy "Authenticated users can upload post media"
  on storage.objects for insert with check (
    bucket_id = 'post-media'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
