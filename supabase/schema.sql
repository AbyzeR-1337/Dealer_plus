-- Global Reseller — online backend for Supabase (Postgres).
-- Run this in Supabase → SQL Editor (safe to run again). Then put the project URL and the anon (public) key into
-- GitHub → Settings → Secrets and variables → Actions as SUPABASE_URL and SUPABASE_ANON_KEY.
--
-- Anti-abuse design:
--  * Tables are not readable/writable by clients at all (RLS on, no policies). Everything goes through
--    SECURITY DEFINER functions below.
--  * Money moves between players only through gr_transfer (v2 below): server ledger, limits from the
--    server-verified worth, hold, fees and taxes — so friends / alt accounts can't pump a balance.
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

revoke all on function public.gr_auth(uuid, text) from anon, authenticated, public;
grant execute on function public.gr_register(text, text, text) to anon;
grant execute on function public.gr_submit(uuid, text, numeric, int, int, text, jsonb) to anon;
grant execute on function public.gr_leaderboard(text, uuid, text) to anon;
grant execute on function public.gr_friend_request(uuid, text, text) to anon;
grant execute on function public.gr_friend_respond(uuid, text, uuid, boolean) to anon;
grant execute on function public.gr_friend_remove(uuid, text, uuid) to anon;
grant execute on function public.gr_friends(uuid, text) to anon;
grant execute on function public.gr_nudge(uuid, text, uuid, text) to anon;
grant execute on function public.gr_inbox(uuid, text) to anon;

-- =====================================================================================================
-- v2: one-call home screen (fast menu) + money transfers between friends through the bank.
--
-- Anti-dupe design for transfers ("you can't copy money by sending it and restoring a save"):
--  * Server ledger: every money movement of a player (send / receive / refund) is an event with a
--    per-player sequence number. The game remembers the last event it applied (inside the save). After a
--    rollback (old save, import) the server hands the missed events back and the game applies them again,
--    so money sent from a restored save is taken away again and nothing can be received twice.
--  * One active device per account: money operations need the device session from gr_link; linking on
--    another device makes the old one read-only for transfers.
--  * Limits from the server-verified net worth (which itself can only grow as fast as real play time):
--    send ≤ 50 % of it per 24 h, receive ≤ max(1000, own verified worth) per 24 h, 10 transfers a day,
--    1 minute between transfers, account ≥ 20 min old, level ≥ 3, friends for ≥ 10 min, not the same device.
--  * Money is held in transit (2–45 min, longer for big sums: "financial monitoring"); the sender can cancel
--    while it's on hold. Bank fee 1 % (2.5 % abroad) and the receiver's country income tax are withheld.
-- =====================================================================================================
alter table public.gr_players add column if not exists session text;
alter table public.gr_players add column if not exists seq int not null default 0;

create table if not exists public.gr_tx (
  id bigserial primary key,
  from_id uuid not null references public.gr_players(id) on delete cascade,
  to_id uuid not null references public.gr_players(id) on delete cascade,
  amount numeric not null,                -- taken from the sender
  fee numeric not null default 0,         -- bank fee
  tax numeric not null default 0,         -- tax withheld in the receiver's country
  net numeric not null,                   -- what the receiver gets
  note text,
  status text not null default 'hold',    -- hold → claimed | cancelled | returned
  created_at timestamptz not null default now(),
  available_at timestamptz not null default now(),
  done_at timestamptz
);
create index if not exists gr_tx_to on public.gr_tx (to_id, status);
create index if not exists gr_tx_from on public.gr_tx (from_id, created_at desc);

create table if not exists public.gr_ledger (
  player uuid not null references public.gr_players(id) on delete cascade,
  seq int not null,
  kind text not null,                     -- send | recv | refund
  delta numeric not null,                 -- change of the player's wallet
  tx bigint,
  other text,                             -- the other player's nick
  info jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  primary key (player, seq)
);
alter table public.gr_tx enable row level security;
alter table public.gr_ledger enable row level security;
revoke all on public.gr_tx, public.gr_ledger from anon, authenticated;

-- income tax of the receiver's country (same numbers as js/data/world.js)
create or replace function public.gr__tax_rate(p_region text) returns numeric
language sql immutable set search_path = public, extensions as $$
  select case upper(coalesce(p_region, '')) when 'RU' then 0.13 when 'UA' then 0.18 when 'BY' then 0.13 when 'KZ' then 0.10
    when 'PL' then 0.12 when 'DE' then 0.25 when 'FR' then 0.25 when 'IT' then 0.23 when 'GB' then 0.20 when 'US' then 0.22
    when 'JP' then 0.20 when 'CN' then 0.20 when 'AE' then 0 when 'TR' then 0.15 when 'GE' then 0.01 when 'TH' then 0.10 else 0.13 end;
$$;

-- append a ledger event for a player and return its sequence number
create or replace function public.gr__event(p_player uuid, p_kind text, p_delta numeric, p_tx bigint, p_other text, p_info jsonb)
returns int language plpgsql security definer set search_path = public, extensions as $$
declare v_seq int;
begin
  update gr_players set seq = seq + 1 where id = p_player returning seq into v_seq;
  insert into gr_ledger(player, seq, kind, delta, tx, other, info) values (p_player, v_seq, p_kind, p_delta, p_tx, p_other, coalesce(p_info, '{}'::jsonb));
  return v_seq;
end $$;

-- what this player may send / receive right now
create or replace function public.gr__limits(p_id uuid) returns json
language plpgsql stable security definer set search_path = public, extensions as $$
declare r gr_players; v_sent numeric; v_cnt int; v_last timestamptz; v_recv numeric; v_claimed numeric; v_cap numeric; v_rcap numeric;
  v_why text[] := '{}'; v_wait int := 0;
begin
  select * into r from gr_players where id = p_id;
  select coalesce(sum(amount), 0), count(*), max(created_at) into v_sent, v_cnt, v_last
    from gr_tx where from_id = p_id and created_at > now() - interval '24 hours' and status <> 'cancelled';
  select coalesce(sum(net), 0), coalesce(sum(net) filter (where status = 'claimed'), 0) into v_recv, v_claimed
    from gr_tx where to_id = p_id and created_at > now() - interval '24 hours' and status <> 'cancelled';
  v_cap := greatest(200, 0.5 * (greatest(r.worth, 0) + v_sent));
  v_rcap := greatest(1000, greatest(r.worth, 0) - v_claimed);
  if r.flagged then v_why := v_why || 'flagged'::text; end if;
  if r.created_at > now() - interval '20 minutes' then v_why := v_why || 'new_account'::text; v_wait := greatest(v_wait, extract(epoch from r.created_at + interval '20 minutes' - now())::int); end if;
  if r.level < 3 then v_why := v_why || 'low_level'::text; end if;
  if v_cnt >= 10 then v_why := v_why || 'daily_count'::text; end if;
  if v_last is not null and v_last > now() - interval '1 minute' then v_why := v_why || 'cooldown'::text; v_wait := greatest(v_wait, extract(epoch from v_last + interval '1 minute' - now())::int); end if;
  return json_build_object('send_left', round(greatest(0, v_cap - v_sent), 2), 'send_cap', round(v_cap, 2), 'sent', round(v_sent, 2), 'count', v_cnt, 'count_cap', 10,
    'recv_left', round(greatest(0, v_rcap - v_recv), 2), 'recv_cap', round(v_rcap, 2), 'why', to_json(v_why), 'wait', v_wait, 'verified', round(greatest(r.worth, 0), 2));
end $$;

-- device session: money operations only work on the device that linked last
create or replace function public.gr_link(p_id uuid, p_secret text, p_device text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare v_tok text;
begin
  if not gr_auth(p_id, p_secret) then raise exception 'auth'; end if;
  v_tok := encode(gen_random_bytes(18), 'hex');
  update gr_players set session = v_tok, device = coalesce(left(p_device, 64), device) where id = p_id;
  return json_build_object('session', v_tok, 'seq', (select seq from gr_players where id = p_id));
end $$;

create or replace function public.gr__board(p_scope text, p_id uuid, p_region text) returns json
language sql stable security definer set search_path = public, extensions as $$
  select coalesce(json_agg(json_build_object('nick', b.nick, 'worth', b.worth, 'level', b.level, 'region', b.region, 'me', b.is_me)), '[]'::json)
  from gr_leaderboard(p_scope, p_id, p_region) b;
$$;

-- everything the Leaderboard and the bank's "to a friend" screen need, in one request.
-- Also delivers transfers whose hold is over and returns the ledger events the game hasn't applied yet.
create or replace function public.gr_home(p_id uuid, p_secret text, p_session text, p_seq int, p_region text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare r gr_players; t record; v_active boolean; v_money json := null; v_social json := null;
begin
  if p_id is not null then
    if not gr_auth(p_id, p_secret) then raise exception 'auth'; end if;
    select * into r from gr_players where id = p_id for update;
    v_active := r.session is not null and r.session = p_session;
    if v_active then
      -- deliver transfers that finished their hold
      for t in select x.*, p.nick as from_nick from gr_tx x join gr_players p on p.id = x.from_id
               where x.to_id = p_id and x.status = 'hold' and x.available_at <= now() order by x.id for update of x loop
        update gr_tx set status = 'claimed', done_at = now() where id = t.id;
        update gr_players set worth = worth + t.net where id = p_id;
        perform gr__event(p_id, 'recv', t.net, t.id, t.from_nick, json_build_object('amount', t.amount, 'fee', t.fee, 'tax', t.tax, 'note', t.note)::jsonb);
      end loop;
      -- nobody picked it up for 7 days: back to the sender (minus the fee)
      for t in select x.*, p.nick as to_nick from gr_tx x join gr_players p on p.id = x.to_id
               where x.from_id = p_id and x.status = 'hold' and x.available_at < now() - interval '7 days' order by x.id for update of x loop
        update gr_tx set status = 'returned', done_at = now() where id = t.id;
        update gr_players set worth = worth + (t.amount - t.fee) where id = p_id;
        perform gr__event(p_id, 'refund', t.amount - t.fee, t.id, t.to_nick, json_build_object('reason', 'unclaimed')::jsonb);
      end loop;
    end if;
    select * into r from gr_players where id = p_id;
    v_money := json_build_object(
      'active', v_active, 'seq', r.seq,
      'events', coalesce((select json_agg(json_build_object('seq', l.seq, 'kind', l.kind, 'delta', l.delta, 'tx', l.tx, 'other', l.other, 'info', l.info, 'at', l.created_at) order by l.seq)
        from gr_ledger l where l.player = p_id and l.seq > coalesce(p_seq, 0) and l.seq > r.seq - 200), '[]'::json),
      'limits', gr__limits(p_id),
      'in', coalesce((select json_agg(json_build_object('id', x.id, 'nick', p.nick, 'net', x.net, 'at', x.available_at, 'note', x.note) order by x.id)
        from gr_tx x join gr_players p on p.id = x.from_id where x.to_id = p_id and x.status = 'hold'), '[]'::json),
      'out', coalesce((select json_agg(json_build_object('id', x.id, 'nick', p.nick, 'amount', x.amount, 'net', x.net, 'at', x.available_at, 'can_cancel', x.available_at > now()) order by x.id)
        from gr_tx x join gr_players p on p.id = x.to_id where x.from_id = p_id and x.status = 'hold'), '[]'::json),
      'history', coalesce((select json_agg(h order by h.seq desc) from (select l.seq, l.kind, l.delta, l.other, l.info, l.created_at as at from gr_ledger l where l.player = p_id order by l.seq desc limit 20) h), '[]'::json));
    v_social := json_build_object(
      'friends', coalesce((select json_agg(json_build_object('id', p.id, 'nick', p.nick, 'worth', round(p.worth), 'level', p.level, 'region', p.region, 'stats', p.stats,
          'since', f.created_at) order by p.worth desc)
        from gr_players p join (select b as o, created_at from gr_friends where a = p_id and status = 'accepted' union all select a as o, created_at from gr_friends where b = p_id and status = 'accepted') f on f.o = p.id), '[]'::json),
      'incoming', coalesce((select json_agg(json_build_object('id', p.id, 'nick', p.nick, 'level', p.level))
        from gr_friends f join gr_players p on p.id = f.a where f.b = p_id and f.status = 'pending'), '[]'::json),
      'outgoing', coalesce((select json_agg(json_build_object('id', p.id, 'nick', p.nick))
        from gr_friends f join gr_players p on p.id = f.b where f.a = p_id and f.status = 'pending'), '[]'::json),
      'inbox', coalesce((select json_agg(json_build_object('nick', p.nick, 'emoji', n.emoji, 'at', n.created_at) order by n.created_at desc)
        from (select * from gr_nudges where to_id = p_id order by created_at desc limit 20) n join gr_players p on p.id = n.from_id), '[]'::json),
      'me', json_build_object('worth', round(r.worth), 'level', r.level, 'code', r.code, 'nick', r.nick));
  end if;
  return json_build_object(
    'boards', json_build_object('global', gr__board('global', p_id, p_region), 'region', gr__board('region', p_id, p_region),
      'friends', case when p_id is null then '[]'::json else gr__board('friends', p_id, p_region) end),
    'social', v_social, 'money', v_money, 'now', now());
end $$;

-- send money to a friend
create or replace function public.gr_transfer(p_id uuid, p_secret text, p_session text, p_seq int, p_to uuid, p_amount numeric, p_note text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare r gr_players; t gr_players; v_lim json; v_tlim json; v_fee numeric; v_tax numeric; v_net numeric; v_hold interval; v_tx bigint; v_seq int; v_since timestamptz;
begin
  if not gr_auth(p_id, p_secret) then raise exception 'auth'; end if;
  select * into r from gr_players where id = p_id for update;
  if r.session is null or r.session <> coalesce(p_session, '') then raise exception 'session_moved'; end if;
  if coalesce(p_seq, -1) <> r.seq then raise exception 'resync'; end if;
  p_amount := round(coalesce(p_amount, 0), 2);
  if p_amount < 1 then raise exception 'bad_amount'; end if;
  select * into t from gr_players where id = p_to;
  if t.id is null then raise exception 'not_found'; end if;
  if t.id = p_id then raise exception 'self'; end if;
  select created_at into v_since from gr_friends where status = 'accepted' and ((a = p_id and b = p_to) or (a = p_to and b = p_id)) limit 1;
  if v_since is null then raise exception 'not_friends'; end if;
  if v_since > now() - interval '10 minutes' then raise exception 'friends_too_new'; end if;
  if t.device is not null and t.device = r.device then raise exception 'same_device'; end if;
  if t.flagged then raise exception 'receiver_blocked'; end if;
  v_lim := gr__limits(p_id);
  if json_array_length(v_lim->'why') > 0 then raise exception 'limit_%', v_lim->'why'->>0; end if;
  if p_amount > (v_lim->>'send_left')::numeric then raise exception 'limit_send'; end if;
  v_fee := round(greatest(0.1, p_amount * case when upper(r.region) = upper(t.region) then 0.01 else 0.025 end), 2);
  v_tax := round((p_amount - v_fee) * gr__tax_rate(t.region), 2);
  v_net := p_amount - v_fee - v_tax;
  v_tlim := gr__limits(p_to);
  if v_net > (v_tlim->>'recv_left')::numeric then raise exception 'limit_receive'; end if;
  v_hold := interval '2 minutes' + least(43, floor(p_amount / 2000)) * interval '1 minute';
  if p_amount > 0.25 * greatest((v_tlim->>'verified')::numeric, 1000) then v_hold := greatest(v_hold, interval '20 minutes'); end if;
  insert into gr_tx(from_id, to_id, amount, fee, tax, net, note, available_at)
  values (p_id, p_to, p_amount, v_fee, v_tax, v_net, left(nullif(trim(coalesce(p_note, '')), ''), 60), now() + v_hold) returning id into v_tx;
  update gr_players set worth = greatest(0, worth - p_amount) where id = p_id;
  v_seq := gr__event(p_id, 'send', -p_amount, v_tx, t.nick, json_build_object('fee', v_fee, 'tax', v_tax, 'net', v_net, 'note', p_note)::jsonb);
  return json_build_object('ok', true, 'tx', v_tx, 'fee', v_fee, 'tax', v_tax, 'net', v_net, 'at', now() + v_hold, 'hold_min', ceil(extract(epoch from v_hold) / 60),
    'events', (select json_agg(json_build_object('seq', l.seq, 'kind', l.kind, 'delta', l.delta, 'tx', l.tx, 'other', l.other, 'info', l.info, 'at', l.created_at) order by l.seq)
      from gr_ledger l where l.player = p_id and l.seq > p_seq));
end $$;

-- cancel a transfer that is still on hold (the bank keeps its fee)
create or replace function public.gr_tx_cancel(p_id uuid, p_secret text, p_session text, p_tx bigint)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare r gr_players; t record; v_seq int;
begin
  if not gr_auth(p_id, p_secret) then raise exception 'auth'; end if;
  select * into r from gr_players where id = p_id for update;
  if r.session is null or r.session <> coalesce(p_session, '') then raise exception 'session_moved'; end if;
  select x.*, p.nick as to_nick into t from gr_tx x join gr_players p on p.id = x.to_id where x.id = p_tx and x.from_id = p_id for update of x;
  if t.id is null then raise exception 'not_found'; end if;
  if t.status <> 'hold' or t.available_at <= now() then raise exception 'too_late'; end if;
  update gr_tx set status = 'cancelled', done_at = now() where id = p_tx;
  update gr_players set worth = worth + (t.amount - t.fee) where id = p_id;
  v_seq := gr__event(p_id, 'refund', t.amount - t.fee, t.id, t.to_nick, json_build_object('reason', 'cancelled', 'fee', t.fee)::jsonb);
  return json_build_object('ok', true, 'seq', v_seq, 'refund', t.amount - t.fee);
end $$;

-- submit v2: ignored while the game hasn't applied all ledger events yet (so a pending transfer
-- can't make the server forget money that was really sent or received)
create or replace function public.gr_submit2(p_id uuid, p_secret text, p_seq int, p_worth numeric, p_level int, p_playtime int, p_region text, p_stats jsonb)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare v_seq int;
begin
  if not gr_auth(p_id, p_secret) then raise exception 'auth'; end if;
  select seq into v_seq from gr_players where id = p_id;
  if coalesce(p_seq, 0) < v_seq then return json_build_object('ok', false, 'reason', 'resync', 'seq', v_seq); end if;
  return gr_submit(p_id, p_secret, p_worth, p_level, p_playtime, p_region, p_stats);
end $$;

revoke all on function public.gr__event(uuid, text, numeric, bigint, text, jsonb) from anon, authenticated, public;
revoke all on function public.gr__limits(uuid) from anon, authenticated, public;
revoke all on function public.gr__board(text, uuid, text) from anon, authenticated, public;
grant execute on function public.gr_link(uuid, text, text) to anon;
grant execute on function public.gr_home(uuid, text, text, int, text) to anon;
grant execute on function public.gr_transfer(uuid, text, text, int, uuid, numeric, text) to anon;
grant execute on function public.gr_tx_cancel(uuid, text, text, bigint) to anon;
grant execute on function public.gr_submit2(uuid, text, int, numeric, int, int, text, jsonb) to anon;
