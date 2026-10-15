-- Phase 2: Public music library and owner-managed track uploads.
create table if not exists public.tracks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  genre text not null default 'Other',
  kind text not null default 'song' check (kind in ('song','beat')),
  description text not null default '' check (char_length(description) <= 1000),
  audio_path text not null,
  created_at timestamptz not null default now()
);
create index if not exists tracks_created_at_idx on public.tracks (created_at desc);
create index if not exists tracks_owner_id_idx on public.tracks (owner_id);
alter table public.tracks enable row level security;
drop policy if exists "Tracks visible to everyone" on public.tracks;
create policy "Tracks visible to everyone" on public.tracks for select to anon, authenticated using (true);
drop policy if exists "Owners can publish tracks" on public.tracks;
create policy "Owners can publish tracks" on public.tracks for insert to authenticated with check ((select auth.uid()) = owner_id and audio_path like owner_id::text || '/%');
drop policy if exists "Owners can delete tracks" on public.tracks;
create policy "Owners can delete tracks" on public.tracks for delete to authenticated using ((select auth.uid()) = owner_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('tracks', 'tracks', true, 20971520, array['audio/mpeg','audio/mp4','audio/x-m4a','audio/wav','audio/wave','audio/x-wav','audio/ogg'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
drop policy if exists "Public can listen to tracks" on storage.objects;
create policy "Public can listen to tracks" on storage.objects for select to public using (bucket_id = 'tracks');
drop policy if exists "Owners can upload tracks" on storage.objects;
create policy "Owners can upload tracks" on storage.objects for insert to authenticated
with check (bucket_id = 'tracks' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists "Owners can remove tracks" on storage.objects;
create policy "Owners can remove tracks" on storage.objects for delete to authenticated
using (bucket_id = 'tracks' and (storage.foldername(name))[1] = (select auth.uid())::text);
