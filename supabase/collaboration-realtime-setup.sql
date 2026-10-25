-- Run once in the Supabase SQL Editor after collaboration-chat-setup.sql.
-- Safe to run again: only enables INSERT/other row replication on this table
-- if it is not already part of the standard Supabase Realtime publication.
-- Existing message RLS policies still control which users receive rows.

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'collaboration_messages'
  ) then
    alter publication supabase_realtime add table public.collaboration_messages;
  end if;
end;
$$;
