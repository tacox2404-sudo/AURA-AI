-- OurPlace database (owned by Social). Paste this whole file into
-- Supabase -> SQL Editor -> New query -> Run. Safe to run again.


-- Player profiles (username + avatar)
create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  username text unique not null,
  avatar jsonb,
  created_at timestamptz default now()
);

-- Houses. Rooms, streak, cities etc. live in the "data" json column.
create table if not exists houses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null default 'solo',
  vibe text not null default 'cozy',
  owner_id uuid not null references auth.users on delete cascade,
  invite_code text unique not null,
  guest_code text unique not null,
  data jsonb not null default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists house_members (
  house_id uuid references houses on delete cascade,
  user_id uuid references auth.users on delete cascade,
  role text not null check (role in ('owner', 'housemate', 'guest')),
  name text,
  joined_at timestamptz default now(),
  primary key (house_id, user_id)
);

create table if not exists messages (
  id bigint generated always as identity primary key,
  house_id uuid references houses on delete cascade,
  user_id uuid references auth.users on delete cascade,
  name text, text text not null, kind text default 'text',
  created_at timestamptz default now()
);
create index if not exists messages_house_idx on messages (house_id, id desc);

-- Shared activity state: games, gallery, wish lists, calendars...
create table if not exists house_state (
  house_id uuid references houses on delete cascade,
  key text not null,
  value jsonb,
  updated_at timestamptz default now(),
  primary key (house_id, key)
);

create table if not exists points (
  id bigint generated always as identity primary key,
  house_id uuid references houses on delete cascade,
  user_id uuid references auth.users on delete cascade,
  amount int not null, reason text,
  created_at timestamptz default now()
);
create index if not exists points_house_idx on points (house_id, id desc);

-- ---------- helpers ----------
create or replace function is_member(h uuid) returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from house_members where house_id = h and user_id = auth.uid());
$$;
create or replace function is_editor(h uuid) returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from house_members where house_id = h and user_id = auth.uid() and role in ('owner', 'housemate'));
$$;

create or replace function new_code() returns text language sql as $$
  select upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
$$;

-- Create a house and make the caller its owner
create or replace function create_house(p_name text, p_type text, p_vibe text, p_data jsonb, p_member_name text)
returns uuid language plpgsql security definer set search_path = public as $$
declare hid uuid;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  insert into houses (name, type, vibe, owner_id, invite_code, guest_code, data)
  values (p_name, p_type, p_vibe, auth.uid(), new_code(), new_code(), coalesce(p_data, '{}'))
  returning id into hid;
  insert into house_members (house_id, user_id, role, name) values (hid, auth.uid(), 'owner', p_member_name);
  return hid;
end; $$;

-- Join with a housemate code or a guest code
create or replace function join_house(p_code text, p_member_name text)
returns json language plpgsql security definer set search_path = public as $$
declare h houses; r text; existing text;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  select * into h from houses where invite_code = upper(p_code) or guest_code = upper(p_code);
  if h.id is null then raise exception 'No house found with that code'; end if;
  r := case when h.invite_code = upper(p_code) then 'housemate' else 'guest' end;
  select role into existing from house_members where house_id = h.id and user_id = auth.uid();
  if existing is null then
    insert into house_members (house_id, user_id, role, name) values (h.id, auth.uid(), r, p_member_name);
  elsif existing = 'guest' and r = 'housemate' then
    update house_members set role = 'housemate' where house_id = h.id and user_id = auth.uid();
  else r := existing;
  end if;
  return json_build_object('house_id', h.id, 'role', r);
end; $$;

-- ---------- row level security ----------
alter table profiles enable row level security;
alter table houses enable row level security;
alter table house_members enable row level security;
alter table messages enable row level security;
alter table house_state enable row level security;
alter table points enable row level security;

drop policy if exists "profiles read" on profiles;
create policy "profiles read" on profiles for select using (auth.role() = 'authenticated');
drop policy if exists "profiles write own" on profiles;
create policy "profiles write own" on profiles for all using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "houses read members" on houses;
create policy "houses read members" on houses for select using (is_member(id));
drop policy if exists "houses update editors" on houses;
create policy "houses update editors" on houses for update using (is_editor(id));
-- guests may update only via activities that write house_state, not the house itself.
-- (Streak/cities updates from guests will fail quietly; that's fine for the draft.)

drop policy if exists "members read" on house_members;
create policy "members read" on house_members for select using (is_member(house_id));

drop policy if exists "messages read" on messages;
create policy "messages read" on messages for select using (is_member(house_id));
drop policy if exists "messages write" on messages;
create policy "messages write" on messages for insert with check (is_member(house_id) and user_id = auth.uid());

drop policy if exists "state read" on house_state;
create policy "state read" on house_state for select using (is_member(house_id));
drop policy if exists "state write" on house_state;
create policy "state write" on house_state for insert with check (is_member(house_id));
drop policy if exists "state update" on house_state;
create policy "state update" on house_state for update using (is_member(house_id));

drop policy if exists "points read" on points;
create policy "points read" on points for select using (is_member(house_id));
drop policy if exists "points write" on points;
create policy "points write" on points for insert with check (is_member(house_id) and user_id = auth.uid());

-- ---------- API access ----------
-- New Supabase projects don't let the API touch new tables by default, so give signed-in
-- players access. Row level security above still decides which rows each player can see.
-- (Not-signed-in visitors get no table access on purpose.)
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
grant execute on all functions in schema public to authenticated;

-- ---------- keep-alive ----------
-- A harmless function the weekly keep-alive workflow calls so the free project never pauses.
create or replace function ping() returns int language sql stable as $$ select 1 $$;
grant execute on function ping() to anon, authenticated;

-- ---------- member roles ----------
-- Change a member's role. Housemates may promote guests; only the owner may demote a housemate.
-- The owner's role never changes.
create or replace function set_member_role(p_house uuid, p_user uuid, p_role text)
returns void language plpgsql security definer set search_path = public as $$
declare me text; target text;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  if p_role not in ('housemate', 'guest') then raise exception 'Role must be housemate or guest'; end if;
  select role into me from house_members where house_id = p_house and user_id = auth.uid();
  select role into target from house_members where house_id = p_house and user_id = p_user;
  if me is null or me = 'guest' then raise exception 'Only housemates can change roles'; end if;
  if target is null then raise exception 'That person is not in this house'; end if;
  if target = 'owner' then raise exception 'The owner''s role cannot be changed'; end if;
  if target = 'housemate' and p_role = 'guest' and me <> 'owner' then raise exception 'Only the owner can make a housemate a guest'; end if;
  update house_members set role = p_role where house_id = p_house and user_id = p_user;
end; $$;

-- Remove someone from the house. Housemates may remove guests; only the owner may remove housemates.
create or replace function remove_member(p_house uuid, p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
declare me text; target text;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  if p_user = auth.uid() then raise exception 'Use "Leave house" to leave yourself'; end if;
  select role into me from house_members where house_id = p_house and user_id = auth.uid();
  select role into target from house_members where house_id = p_house and user_id = p_user;
  if me is null or me = 'guest' then raise exception 'Only housemates can remove people'; end if;
  if target is null then raise exception 'That person is not in this house'; end if;
  if target = 'owner' then raise exception 'The owner cannot be removed'; end if;
  if target = 'housemate' and me <> 'owner' then raise exception 'Only the owner can remove a housemate'; end if;
  delete from house_members where house_id = p_house and user_id = p_user;
end; $$;

-- Leave a house. The last owner cannot leave (the house would have nobody in charge).
create or replace function leave_house(p_house uuid)
returns void language plpgsql security definer set search_path = public as $$
declare me text; other_owners int;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  select role into me from house_members where house_id = p_house and user_id = auth.uid();
  if me is null then raise exception 'You are not in this house'; end if;
  if me = 'owner' then
    select count(*) into other_owners from house_members where house_id = p_house and role = 'owner' and user_id <> auth.uid();
    if other_owners = 0 then raise exception 'The owner cannot leave their own house'; end if;
  end if;
  delete from house_members where house_id = p_house and user_id = auth.uid();
end; $$;

grant execute on function set_member_role(uuid, uuid, text), remove_member(uuid, uuid), leave_house(uuid) to authenticated;

-- ---------- friends ----------
-- A friendship is one row: requester asked, addressee answers. 'pending' until accepted.
-- People change it only through the functions below (so nobody can fake a friendship).
create table if not exists friends (
  requester uuid not null references auth.users on delete cascade,
  addressee uuid not null references auth.users on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz default now(),
  primary key (requester, addressee),
  check (requester <> addressee)
);
create index if not exists friends_addressee_idx on friends (addressee);
alter table friends enable row level security;
drop policy if exists "friends read own" on friends;
create policy "friends read own" on friends for select using (requester = auth.uid() or addressee = auth.uid());
grant select on friends to authenticated;

-- Ask someone to be friends by username. If they already asked you, you become friends.
-- Returns 'sent' or 'accepted'.
create or replace function send_friend_request(p_username text)
returns text language plpgsql security definer set search_path = public as $$
declare other uuid;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  select id into other from profiles where lower(username) = lower(trim(p_username));
  if other is null then raise exception 'No player with that username'; end if;
  if other = auth.uid() then raise exception 'That is you!'; end if;
  if exists (select 1 from friends where status = 'accepted' and ((requester = auth.uid() and addressee = other) or (requester = other and addressee = auth.uid()))) then
    raise exception 'You are already friends';
  end if;
  if exists (select 1 from friends where requester = auth.uid() and addressee = other) then
    raise exception 'Request already sent';
  end if;
  if exists (select 1 from friends where requester = other and addressee = auth.uid()) then
    update friends set status = 'accepted' where requester = other and addressee = auth.uid();
    return 'accepted';
  end if;
  insert into friends (requester, addressee) values (auth.uid(), other);
  return 'sent';
end; $$;

-- Answer a request someone sent you: accept, or decline (which deletes it).
create or replace function respond_friend_request(p_user uuid, p_accept boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  if not exists (select 1 from friends where requester = p_user and addressee = auth.uid() and status = 'pending') then
    raise exception 'No request from that person';
  end if;
  if p_accept then update friends set status = 'accepted' where requester = p_user and addressee = auth.uid();
  else delete from friends where requester = p_user and addressee = auth.uid();
  end if;
end; $$;

-- Remove a friend, or cancel a request you sent.
create or replace function remove_friend(p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  delete from friends where (requester = auth.uid() and addressee = p_user) or (requester = p_user and addressee = auth.uid());
end; $$;

-- My friends and requests, with the other person's name and avatar.
-- status: 'friend', 'incoming' (they asked me) or 'outgoing' (I asked them).
create or replace function list_friends()
returns table (user_id uuid, username text, avatar jsonb, status text)
language sql security definer stable set search_path = public as $$
  select o.id, o.username, o.avatar,
    case when f.status = 'accepted' then 'friend' when f.requester = auth.uid() then 'outgoing' else 'incoming' end
  from friends f
  join profiles o on o.id = case when f.requester = auth.uid() then f.addressee else f.requester end
  where f.requester = auth.uid() or f.addressee = auth.uid();
$$;

grant execute on function send_friend_request(text), respond_friend_request(uuid, boolean), remove_friend(uuid), list_friends() to authenticated;

-- ---------- visiting friends' houses ----------
-- A house owner can switch on "Friends can visit" (stored as data.friendsCanVisit = true, off by default).
-- Then accepted friends of the OWNER can see the house in their Friends page and join it as a guest
-- (guests can look around, chat and play, but not build; the owner can remove them any time).

-- Houses my friends have opened for visits (and that I'm not already in).
create or replace function list_friend_houses()
returns table (house_id uuid, name text, type text, vibe text, owner_id uuid, owner_name text)
language sql security definer stable set search_path = public as $$
  select h.id, h.name, h.type, h.vibe, h.owner_id, p.username
  from houses h
  join profiles p on p.id = h.owner_id
  where h.data->>'friendsCanVisit' = 'true'
    and exists (select 1 from friends f where f.status = 'accepted'
                and ((f.requester = auth.uid() and f.addressee = h.owner_id) or (f.requester = h.owner_id and f.addressee = auth.uid())))
    and not exists (select 1 from house_members m where m.house_id = h.id and m.user_id = auth.uid());
$$;

-- Join a friend's open house as a guest. Returns { house_id, role }.
create or replace function visit_house(p_house uuid)
returns json language plpgsql security definer set search_path = public as $$
declare h houses; uname text;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  select * into h from houses where id = p_house;
  if h.id is null or coalesce(h.data->>'friendsCanVisit', '') <> 'true' then raise exception 'This house is not open for visits'; end if;
  if not exists (select 1 from friends f where f.status = 'accepted'
                 and ((f.requester = auth.uid() and f.addressee = h.owner_id) or (f.requester = h.owner_id and f.addressee = auth.uid()))) then
    raise exception 'Only friends of the owner can visit';
  end if;
  select username into uname from profiles where id = auth.uid();
  insert into house_members (house_id, user_id, role, name) values (h.id, auth.uid(), 'guest', coalesce(uname, 'visitor'))
    on conflict (house_id, user_id) do nothing; -- already a member: keep their role
  return json_build_object('house_id', h.id, 'role', (select role from house_members where house_id = h.id and user_id = auth.uid()));
end; $$;

grant execute on function list_friend_houses(), visit_house(uuid) to authenticated;
