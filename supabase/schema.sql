-- Global Reseller — online backend for Supabase (Postgres).
-- Run this in Supabase → SQL Editor (safe to run again). Then put the project URL and the anon (public) key into
-- GitHub → Settings → Secrets and variables → Actions as SUPABASE_URL and SUPABASE_ANON_KEY.
--
-- Anti-abuse design:
--  * Tables are not readable/writable by clients at all (RLS on, no policies). Everything goes through
--    SECURITY DEFINER functions below.
--  * There is NO function that moves money or items between players, so friends / alt accounts can't
--    be used to pump someone's balance.
--  * Submitted net worth is clamped by a growth cap based on real elapsed time and total playtime;
--    absurd submissions are flagged and hidden from the leaderboards.
--  * Account creation is rate-limited per IP.

-- pgcrypto (digest, gen_random_bytes): on Supabase it lives in the "extensions" schema
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.gr_players (
  id uuid primary key default gen_random_uuid(),
  secret_hash text not null,
  nick text not null unique,
  code text not null unique,
  region text not null default 'RU',
  device text,
  ip text,
  worth numeric not null default 0,
  claimed numeric not null default 0,
  level int not null default 1,
  playtime int not null default 0,
  stats jsonb not null default '{}'::jsonb,
  flagged boolean not null default false,
  created_at timestamptz not null default now(),
  last_submit timestamptz not null default now()
);
create index if not exists gr_players_worth on public.gr_players (worth desc);

create table if not exists public.gr_friends (
  a uuid not null references public.gr_players(id) on delete cascade,
  b uuid not null references public.gr_players(id) on delete cascade,
  status text not null default 'pending', -- a asked b; 'accepted' when b agreed
  created_at timestamptz not null default now(),
  primary key (a, b)
);
create table if not exists public.gr_nudges (
  id bigserial primary key,
  from_id uuid references public.gr_players(id) on delete cascade,
  to_id uuid references public.gr_players(id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now()
);

alter table public.gr_players enable row level security;
alter table public.gr_friends enable row level security;
alter table public.gr_nudges enable row level security;
revoke all on public.gr_players, public.gr_friends, public.gr_nudges from anon, authenticated;

create or replace function public.gr_auth(p_id uuid, p_secret text) returns boolean
language sql stable security definer set search_path = public, extensions as $$
  select exists(select 1 from gr_players where id = p_id and secret_hash = encode(digest(coalesce(p_secret, ''), 'sha256'), 'hex'));
$$;

create or replace function public.gr_register(p_nick text, p_region text, p_device text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare v_id uuid; v_secret text; v_code text; v_ip text; v_cnt int;
begin
  p_nick := regexp_replace(trim(coalesce(p_nick, '')), '\s+', ' ', 'g');
  if length(p_nick) < 3 or length(p_nick) > 20 then raise exception 'bad_nick'; end if;
  v_ip := split_part(coalesce(current_setting('request.headers', true)::json->>'x-forwarded-for', ''), ',', 1);
  select count(*) into v_cnt from gr_players where ip = v_ip and v_ip <> '' and created_at > now() - interval '1 day';
  if v_cnt >= 3 then raise exception 'too_many_accounts'; end if;
  v_secret := encode(gen_random_bytes(24), 'hex');
  v_code := upper(substr(encode(gen_random_bytes(5), 'hex'), 1, 8));
  insert into gr_players(nick, region, device, ip, secret_hash, code)
  values (p_nick, left(coalesce(p_region, 'RU'), 4), left(p_device, 64), v_ip, encode(digest(v_secret, 'sha256'), 'hex'), v_code)
  returning id into v_id;
  return json_build_object('id', v_id, 'secret', v_secret, 'code', v_code);
end $$;

create or replace function public.gr_submit(p_id uuid, p_secret text, p_worth numeric, p_level int, p_playtime int, p_region text, p_stats jsonb)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare r gr_players; v_elapsed numeric; v_dt int; v_hours numeric; v_cap numeric; v_accept numeric; v_flag boolean := false;
begin
  if not gr_auth(p_id, p_secret) then raise exception 'auth'; end if;
  select * into r from gr_players where id = p_id for update;
  v_elapsed := extract(epoch from now() - r.last_submit);
  -- the very first submit right after registration is allowed; after that at most one per 15 s
  if v_elapsed < 15 and r.playtime > 0 then return json_build_object('ok', false, 'reason', 'rate', 'accepted', r.worth); end if;
  -- playtime cannot grow faster than real time
  v_dt := greatest(0, least(coalesce(p_playtime, 0) - r.playtime, v_elapsed::int + 30));
  v_hours := (r.playtime + v_dt) / 3600.0;
  -- growth cap per submit and an absolute ceiling based on total play time
  v_cap := greatest(r.worth, 0) * power(1.7, v_dt / 3600.0) + 25000 * (v_dt / 3600.0) + 800;
  v_cap := least(v_cap, 2500 * power(v_hours + 1, 3.2));
  v_accept := greatest(0, least(coalesce(p_worth, 0), v_cap));
  if p_worth > v_cap * 4 and p_worth > 50000 then v_flag := true; end if;
  update gr_players set worth = v_accept, claimed = p_worth, level = least(greatest(p_level, 1), 300),
    playtime = r.playtime + v_dt, region = left(coalesce(p_region, region), 4), stats = coalesce(p_stats, '{}'::jsonb),
    last_submit = now(), flagged = flagged or v_flag
  where id = p_id;
  return json_build_object('ok', true, 'accepted', v_accept, 'cap', v_cap, 'flagged', v_flag);
end $$;

create or replace function public.gr_leaderboard(p_scope text, p_id uuid default null, p_region text default null)
returns table(nick text, worth numeric, level int, region text, is_me boolean)
language sql stable security definer set search_path = public, extensions as $$
  select p.nick, round(p.worth), p.level, p.region, (p.id = p_id)
  from gr_players p
  where not p.flagged and (
    p_scope = 'global'
    or (p_scope = 'region' and p.region = p_region)
    or (p_scope = 'friends' and (p.id = p_id or p.id in (
        select b from gr_friends where a = p_id and status = 'accepted'
        union select a from gr_friends where b = p_id and status = 'accepted')))
  )
  order by p.worth desc
  limit 100;
$$;

create or replace function public.gr_friend_request(p_id uuid, p_secret text, p_code text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare v_to uuid; v_cnt int;
begin
  if not gr_auth(p_id, p_secret) then raise exception 'auth'; end if;
  select id into v_to from gr_players where code = upper(trim(p_code));
  if v_to is null then raise exception 'not_found'; end if;
  if v_to = p_id then raise exception 'self'; end if;
  select count(*) into v_cnt from gr_friends where a = p_id and created_at > now() - interval '1 day';
  if v_cnt >= 30 then raise exception 'too_many_requests'; end if;
  if exists(select 1 from gr_friends where a = v_to and b = p_id) then
    update gr_friends set status = 'accepted' where a = v_to and b = p_id;
    return json_build_object('ok', true, 'status', 'accepted');
  end if;
  insert into gr_friends(a, b) values (p_id, v_to) on conflict do nothing;
  return json_build_object('ok', true, 'status', 'pending');
end $$;

create or replace function public.gr_friend_respond(p_id uuid, p_secret text, p_from uuid, p_accept boolean)
returns json language plpgsql security definer set search_path = public, extensions as $$
begin
  if not gr_auth(p_id, p_secret) then raise exception 'auth'; end if;
  if p_accept then update gr_friends set status = 'accepted' where a = p_from and b = p_id;
  else delete from gr_friends where a = p_from and b = p_id; end if;
  return json_build_object('ok', true);
end $$;

create or replace function public.gr_friend_remove(p_id uuid, p_secret text, p_other uuid)
returns json language plpgsql security definer set search_path = public, extensions as $$
begin
  if not gr_auth(p_id, p_secret) then raise exception 'auth'; end if;
  delete from gr_friends where (a = p_id and b = p_other) or (a = p_other and b = p_id);
  return json_build_object('ok', true);
end $$;

create or replace function public.gr_friends(p_id uuid, p_secret text)
returns json language plpgsql security definer set search_path = public, extensions as $$
begin
  if not gr_auth(p_id, p_secret) then raise exception 'auth'; end if;
  return json_build_object(
    'friends', coalesce((select json_agg(json_build_object('id', p.id, 'nick', p.nick, 'worth', round(p.worth), 'level', p.level, 'region', p.region, 'stats', p.stats) order by p.worth desc)
      from gr_players p where p.id in (select b from gr_friends where a = p_id and status = 'accepted' union select a from gr_friends where b = p_id and status = 'accepted')), '[]'::json),
    'incoming', coalesce((select json_agg(json_build_object('id', p.id, 'nick', p.nick, 'level', p.level))
      from gr_friends f join gr_players p on p.id = f.a where f.b = p_id and f.status = 'pending'), '[]'::json),
    'outgoing', coalesce((select json_agg(json_build_object('id', p.id, 'nick', p.nick))
      from gr_friends f join gr_players p on p.id = f.b where f.a = p_id and f.status = 'pending'), '[]'::json)
  );
end $$;

create or replace function public.gr_nudge(p_id uuid, p_secret text, p_to uuid, p_emoji text)
returns json language plpgsql security definer set search_path = public, extensions as $$
begin
  if not gr_auth(p_id, p_secret) then raise exception 'auth'; end if;
  if p_emoji not in ('👋', '🔥', '💸', '👑', '😎', '🤝') then raise exception 'bad_emoji'; end if;
  if not exists(select 1 from gr_friends where status = 'accepted' and ((a = p_id and b = p_to) or (a = p_to and b = p_id))) then raise exception 'not_friends'; end if;
  if exists(select 1 from gr_nudges where from_id = p_id and to_id = p_to and created_at > now() - interval '1 minute') then raise exception 'slow_down'; end if;
  insert into gr_nudges(from_id, to_id, emoji) values (p_id, p_to, p_emoji);
  return json_build_object('ok', true);
end $$;

create or replace function public.gr_inbox(p_id uuid, p_secret text)
returns json language plpgsql security definer set search_path = public, extensions as $$
begin
  if not gr_auth(p_id, p_secret) then raise exception 'auth'; end if;
  return coalesce((select json_agg(json_build_object('nick', p.nick, 'emoji', n.emoji, 'at', n.created_at) order by n.created_at desc)
    from (select * from gr_nudges where to_id = p_id order by created_at desc limit 20) n join gr_players p on p.id = n.from_id), '[]'::json);
end $$;

revoke all on function public.gr_auth(uuid, text) from anon, authenticated;
grant execute on function public.gr_register(text, text, text) to anon;
grant execute on function public.gr_submit(uuid, text, numeric, int, int, text, jsonb) to anon;
grant execute on function public.gr_leaderboard(text, uuid, text) to anon;
grant execute on function public.gr_friend_request(uuid, text, text) to anon;
grant execute on function public.gr_friend_respond(uuid, text, uuid, boolean) to anon;
grant execute on function public.gr_friend_remove(uuid, text, uuid) to anon;
grant execute on function public.gr_friends(uuid, text) to anon;
grant execute on function public.gr_nudge(uuid, text, uuid, text) to anon;
grant execute on function public.gr_inbox(uuid, text) to anon;
