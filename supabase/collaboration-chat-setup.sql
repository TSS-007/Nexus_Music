-- Run after collaboration-setup.sql in Supabase SQL Editor.
begin;
create table if not exists public.collaboration_messages (
 id uuid primary key,
 request_id uuid not null references public.collaboration_requests(id) on delete cascade,
 sender_id uuid not null references auth.users(id) on delete cascade,
 body text not null default '' check(char_length(body)<=4000),
 file_path text unique,
 file_name text,
 file_size bigint,
 created_at timestamptz not null default now(),
 check (char_length(btrim(body))>0 or file_path is not null),
 check ((file_path is null and file_name is null and file_size is null) or
        (file_path is not null and file_name is not null and char_length(file_name) between 1 and 255 and file_size between 1 and 52428800))
);
create index if not exists collaboration_messages_history on public.collaboration_messages(request_id,created_at desc,id desc);
alter table public.collaboration_messages enable row level security;
revoke all on public.collaboration_messages from anon,authenticated;
grant select on public.collaboration_messages to authenticated;

create or replace function public.can_access_collaboration_chat(p_request text)
returns boolean language sql stable security definer set search_path=''
as $$
 select exists(select 1 from public.collaboration_requests r where r.id::text=p_request
 and r.status='accepted' and auth.uid() in (r.sender_id,r.recipient_id));
$$;
revoke all on function public.can_access_collaboration_chat(text) from public,anon;
grant execute on function public.can_access_collaboration_chat(text) to authenticated;
drop policy if exists "Chat participants read messages" on public.collaboration_messages;
create policy "Chat participants read messages" on public.collaboration_messages for select to authenticated
 using(public.can_access_collaboration_chat(request_id::text));

insert into storage.buckets(id,name,public,file_size_limit)
values('collaboration-files','collaboration-files',false,52428800)
on conflict(id) do update set public=false,file_size_limit=52428800;

drop policy if exists "Chat participants read files" on storage.objects;
create policy "Chat participants read files" on storage.objects for select to authenticated
 using(bucket_id='collaboration-files' and public.can_access_collaboration_chat(split_part(name,'/',1)));
drop policy if exists "Chat participants upload files" on storage.objects;
create policy "Chat participants upload files" on storage.objects for insert to authenticated
 with check(bucket_id='collaboration-files'
 and public.can_access_collaboration_chat(split_part(name,'/',1))
 and split_part(name,'/',2)=auth.uid()::text
 and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9a-f-]{36}$');
drop policy if exists "Remove own unpublished chat uploads" on storage.objects;
create policy "Remove own unpublished chat uploads" on storage.objects for delete to authenticated
 using(bucket_id='collaboration-files' and split_part(name,'/',2)=auth.uid()::text
 and public.can_access_collaboration_chat(split_part(name,'/',1))
 and not exists(select 1 from public.collaboration_messages m where m.file_path=name));

-- Only this function writes messages. Validate membership and the actual uploaded
-- object server-side; callers cannot forge sender IDs, dates, paths or sizes.
create or replace function public.send_collaboration_message(
 p_id uuid,p_request uuid,p_body text,p_file_name text default null)
returns uuid language plpgsql security definer set search_path=''
as $$
declare
 v_uid uuid:=auth.uid(); v_path text; v_size bigint; v_existing public.collaboration_messages;
begin
 if v_uid is null or not public.can_access_collaboration_chat(p_request::text) then
  raise exception 'Only participants in an accepted collaboration can send messages';
 end if;
 if p_id is null or p_body is null or char_length(p_body)>4000 then raise exception 'Invalid message'; end if;
 select * into v_existing from public.collaboration_messages where id=p_id;
 if found then
  if v_existing.sender_id=v_uid and v_existing.request_id=p_request
   and v_existing.body=btrim(p_body) and v_existing.file_name is not distinct from p_file_name then return p_id; end if;
  raise exception 'Message ID already used; refresh the conversation before retrying';
 end if;
 if p_file_name is not null then
  if char_length(p_file_name) not between 1 and 255 then raise exception 'Invalid filename'; end if;
  v_path:=p_request::text||'/'||v_uid::text||'/'||p_id::text;
  select (metadata->>'size')::bigint into v_size from storage.objects
   where bucket_id='collaboration-files' and name=v_path;
  if v_size is null or v_size not between 1 and 52428800 then raise exception 'Attachment missing or too large'; end if;
 end if;
 if char_length(btrim(p_body))=0 and v_path is null then raise exception 'Add a message or a file'; end if;
 insert into public.collaboration_messages(id,request_id,sender_id,body,file_path,file_name,file_size)
 values(p_id,p_request,v_uid,btrim(p_body),v_path,p_file_name,v_size);
 return p_id;
end $$;
revoke all on function public.send_collaboration_message(uuid,uuid,text,text) from public,anon;
grant execute on function public.send_collaboration_message(uuid,uuid,text,text) to authenticated;
commit;
