-- Private storage bucket for resume PDFs (max 5 MB, PDF only).
-- Files are stored as "<user id>/<random id>.pdf"; the policies below only allow
-- a user to read, upload or delete files inside their own folder.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('resumes', 'resumes', false, 5242880, array['application/pdf'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can read own resume files" on storage.objects;
drop policy if exists "Users can upload own resume files" on storage.objects;
drop policy if exists "Users can delete own resume files" on storage.objects;

create policy "Users can read own resume files" on storage.objects
  for select to authenticated
  using (bucket_id = 'resumes' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users can upload own resume files" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'resumes' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users can delete own resume files" on storage.objects
  for delete to authenticated
  using (bucket_id = 'resumes' and (storage.foldername(name))[1] = (select auth.uid())::text);

notify pgrst, 'reload schema';
