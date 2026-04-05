-- Storage buckets for logos and job photos

insert into storage.buckets (id, name, public)
values ('business-logos', 'business-logos', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('job-photos', 'job-photos', false)
on conflict (id) do nothing;

-- Drop any pre-existing policies (idempotent)
drop policy if exists "logos_public_read" on storage.objects;
drop policy if exists "logos_owner_write" on storage.objects;
drop policy if exists "logos_owner_update" on storage.objects;
drop policy if exists "logos_owner_delete" on storage.objects;
drop policy if exists "job_photos_owner_read" on storage.objects;
drop policy if exists "job_photos_owner_write" on storage.objects;
drop policy if exists "job_photos_owner_update" on storage.objects;
drop policy if exists "job_photos_owner_delete" on storage.objects;

-- business-logos: public read, owner write (path = {business_id}/...)
create policy "logos_public_read" on storage.objects
  for select using (bucket_id = 'business-logos');

create policy "logos_owner_write" on storage.objects
  for insert with check (
    bucket_id = 'business-logos'
    and (storage.foldername(name))[1]::uuid = public.current_business_id()
  );

create policy "logos_owner_update" on storage.objects
  for update using (
    bucket_id = 'business-logos'
    and (storage.foldername(name))[1]::uuid = public.current_business_id()
  );

create policy "logos_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'business-logos'
    and (storage.foldername(name))[1]::uuid = public.current_business_id()
  );

-- job-photos: private, owner-only (path = {business_id}/{job_id}/...)
create policy "job_photos_owner_read" on storage.objects
  for select using (
    bucket_id = 'job-photos'
    and (storage.foldername(name))[1]::uuid = public.current_business_id()
  );

create policy "job_photos_owner_write" on storage.objects
  for insert with check (
    bucket_id = 'job-photos'
    and (storage.foldername(name))[1]::uuid = public.current_business_id()
  );

create policy "job_photos_owner_update" on storage.objects
  for update using (
    bucket_id = 'job-photos'
    and (storage.foldername(name))[1]::uuid = public.current_business_id()
  );

create policy "job_photos_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'job-photos'
    and (storage.foldername(name))[1]::uuid = public.current_business_id()
  );
