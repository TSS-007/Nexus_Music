-- Creator collaboration requests. Run after existing profiles setup.
create table if not exists public.collaboration_requests (
 id uuid primary key default gen_random_uuid(),
 sender_id uuid not null references auth.users(id) on delete cascade,
 recipient_id uuid not null references auth.users(id) on delete cascade,
 message text not null check (char_length(message) between 10 and 1000),
 status text not null default 'pending' check(status in ('pending','accepted','declined')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check(sender_id<>recipient_id)
);
create unique index if not exists one_pending_collaboration_per_pair
 on public.collaboration_requests(sender_id,recipient_id) where status='pending';
create index if not exists collaboration_recipient_index on public.collaboration_requests(recipient_id,created_at desc);
alter table public.collaboration_requests enable row level security;
drop policy if exists "Participants view requests" on public.collaboration_requests;
create policy "Participants view requests" on public.collaboration_requests for select to authenticated
 using(sender_id=(select auth.uid()) or recipient_id=(select auth.uid()));
drop policy if exists "Send collaboration request" on public.collaboration_requests;
create policy "Send collaboration request" on public.collaboration_requests for insert to authenticated
 with check(sender_id=(select auth.uid()) and status='pending');
grant select,insert on public.collaboration_requests to authenticated;
-- Status updates are performed only through a validated server function.
create or replace function public.respond_to_collaboration(p_request uuid,p_accept boolean)
returns void language plpgsql security definer set search_path=''
as $$
begin
 update public.collaboration_requests set status=case when p_accept then 'accepted' else 'declined' end,updated_at=now()
 where id=p_request and recipient_id=auth.uid() and status='pending';
 if not found then raise exception 'Request not found or already answered'; end if;
end $$;
revoke all on function public.respond_to_collaboration(uuid,boolean) from public,anon;
grant execute on function public.respond_to_collaboration(uuid,boolean) to authenticated;
