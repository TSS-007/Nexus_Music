-- Nexus Credits v1. Run in the Supabase SQL editor before testing.
-- Credits are promotional points, not money; they cannot be transferred or redeemed for cash.
create table if not exists public.credit_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance integer not null default 0 check (balance >= 0),
  updated_at timestamptz not null default now()
);
create table if not exists public.credit_staff (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin','grantor')),
  per_grant_limit integer not null default 0 check (per_grant_limit between 0 and 100000),
  monthly_limit integer not null default 0 check (monthly_limit between 0 and 1000000),
  created_at timestamptz not null default now()
);
create table if not exists public.credit_transactions (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount integer not null check (amount <> 0),
  kind text not null check (kind in ('grant','highlight')),
  actor_id uuid references auth.users(id) on delete set null,
  note text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists credit_transactions_actor_date on public.credit_transactions(actor_id,created_at);
create table if not exists public.track_highlights (
  id uuid primary key default gen_random_uuid(),
  track_id uuid not null references public.tracks(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  credits_spent integer not null default 10 check (credits_spent > 0),
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);
create index if not exists track_highlights_active on public.track_highlights(ends_at desc);

alter table public.credit_accounts enable row level security;
alter table public.credit_staff enable row level security;
alter table public.credit_transactions enable row level security;
alter table public.track_highlights enable row level security;

drop policy if exists "Read own credits" on public.credit_accounts;
create policy "Read own credits" on public.credit_accounts for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "Read own staff role" on public.credit_staff;
create policy "Read own staff role" on public.credit_staff for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "Read own credit history" on public.credit_transactions;
create policy "Read own credit history" on public.credit_transactions for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "Read public highlights" on public.track_highlights;
create policy "Read public highlights" on public.track_highlights for select to anon, authenticated using (true);

grant usage on schema public to anon,authenticated;
grant select on public.track_highlights to anon,authenticated;
grant select on public.credit_accounts,public.credit_staff,public.credit_transactions to authenticated;
-- No direct INSERT/UPDATE/DELETE grants. All mutations use audited RPCs.

create or replace function public.grant_nexus_credits(p_recipient uuid, p_amount integer, p_note text default '')
returns integer language plpgsql security definer set search_path = ''
as $$
declare v_actor uuid := auth.uid(); v_staff public.credit_staff%rowtype; v_used bigint; v_balance integer;
begin
  if v_actor is null then raise exception 'Sign in required'; end if;
  select * into v_staff from public.credit_staff where user_id = v_actor;
  if not found then raise exception 'You cannot grant credits'; end if;
  if p_amount is null or p_amount < 1 or p_amount > 100000 then raise exception 'Invalid credit amount'; end if;
  if length(coalesce(p_note,'')) > 300 then raise exception 'Note too long'; end if;
  if v_staff.role = 'grantor' then
    if p_amount > v_staff.per_grant_limit then raise exception 'Per-grant limit exceeded'; end if;
    select coalesce(sum(amount),0) into v_used from public.credit_transactions
      where actor_id=v_actor and kind='grant' and created_at >= date_trunc('month',now());
    if v_used + p_amount > v_staff.monthly_limit then raise exception 'Monthly grant allowance exceeded'; end if;
  end if;
  if not exists (select 1 from auth.users where id=p_recipient) then raise exception 'Recipient not found'; end if;
  insert into public.credit_accounts(user_id,balance) values (p_recipient,0) on conflict do nothing;
  update public.credit_accounts set balance=balance+p_amount,updated_at=now()
    where user_id=p_recipient returning balance into v_balance;
  insert into public.credit_transactions(user_id,amount,kind,actor_id,note)
    values(p_recipient,p_amount,'grant',v_actor,coalesce(p_note,''));
  return v_balance;
end $$;

create or replace function public.set_nexus_grantor(p_recipient uuid, p_enabled boolean, p_per_grant_limit integer default 10, p_monthly_limit integer default 100)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if not exists(select 1 from public.credit_staff where user_id=auth.uid() and role='admin') then
    raise exception 'Admin permission required';
  end if;
  if p_recipient=auth.uid() then raise exception 'Cannot modify your own role'; end if;
  if exists(select 1 from public.credit_staff where user_id=p_recipient and role='admin') then
    raise exception 'Cannot modify an admin';
  end if;
  if p_enabled then
    if p_per_grant_limit < 1 or p_per_grant_limit > 100000 or p_monthly_limit < p_per_grant_limit or p_monthly_limit > 1000000 then
      raise exception 'Invalid delegation limits';
    end if;
    insert into public.credit_staff(user_id,role,per_grant_limit,monthly_limit)
      values(p_recipient,'grantor',p_per_grant_limit,p_monthly_limit)
      on conflict(user_id) do update set role='grantor',per_grant_limit=excluded.per_grant_limit,monthly_limit=excluded.monthly_limit;
  else
    delete from public.credit_staff where user_id=p_recipient and role='grantor';
  end if;
end $$;

create or replace function public.promote_nexus_track(p_track uuid)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare v_user uuid := auth.uid(); v_highlight uuid; v_balance integer;
begin
  if v_user is null then raise exception 'Sign in required'; end if;
  if not exists(select 1 from public.tracks where id=p_track and owner_id=v_user) then
    raise exception 'You can only promote your own tracks';
  end if;
  if exists(select 1 from public.track_highlights where track_id=p_track and ends_at>now()) then
    raise exception 'This track is already highlighted';
  end if;
  insert into public.credit_accounts(user_id,balance) values(v_user,0) on conflict do nothing;
  update public.credit_accounts set balance=balance-10,updated_at=now()
    where user_id=v_user and balance>=10 returning balance into v_balance;
  if not found then raise exception 'You need 10 credits'; end if;
  insert into public.track_highlights(track_id,owner_id,ends_at)
    values(p_track,v_user,now()+interval '7 days') returning id into v_highlight;
  insert into public.credit_transactions(user_id,amount,kind,actor_id,note)
    values(v_user,-10,'highlight',v_user,'7-day track highlight');
  return v_highlight;
end $$;

revoke all on function public.grant_nexus_credits(uuid,integer,text) from public,anon;
revoke all on function public.set_nexus_grantor(uuid,boolean,integer,integer) from public,anon;
revoke all on function public.promote_nexus_track(uuid) from public,anon;
grant execute on function public.grant_nexus_credits(uuid,integer,text) to authenticated;
grant execute on function public.set_nexus_grantor(uuid,boolean,integer,integer) to authenticated;
grant execute on function public.promote_nexus_track(uuid) to authenticated;

-- BOOTSTRAP: After running this migration, replace the email with YOUR Supabase
-- account email and run the following statement once in the SQL editor:
-- insert into public.credit_staff(user_id,role)
-- select id,'admin' from auth.users where email='YOUR_ACCOUNT_EMAIL'
-- on conflict(user_id) do update set role='admin';
-- Never put admin credentials or the Supabase service role key in frontend code.
