-- =====================================================================
-- EBY GTM CRM — storage bucket for call recordings (Supabase only)
--
-- Run this in the Supabase SQL editor (it uses Supabase's `storage` schema,
-- which only exists on a real Supabase project, not in local test Postgres).
-- Creates a PRIVATE bucket; only signed-in teammates can read/write its files.
-- =====================================================================

insert into storage.buckets (id, name, public)
values ('recordings', 'recordings', false)
on conflict (id) do nothing;

-- Any authenticated teammate can manage files in the recordings bucket.
create policy "recordings read"  on storage.objects for select to authenticated using (bucket_id = 'recordings');
create policy "recordings write" on storage.objects for insert to authenticated with check (bucket_id = 'recordings');
create policy "recordings update" on storage.objects for update to authenticated using (bucket_id = 'recordings');
create policy "recordings delete" on storage.objects for delete to authenticated using (bucket_id = 'recordings');
