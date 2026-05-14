-- Arquitetura sugerida para o app:
-- 1. tournaments -> dados gerais do campeonato
-- 2. tournament_players -> inscritos do torneio
-- 3. matches -> confrontos, placares e penaltis

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.tournaments (
  id text primary key,
  slug text not null unique,
  name text not null,
  status text not null default 'setup' check (status in ('setup', 'active', 'completed')),
  champion_player_id text null,
  live_match_id text null,
  max_players integer not null default 14 check (max_players >= 2),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.tournament_players (
  id text primary key,
  tournament_id text not null references public.tournaments(id) on delete cascade,
  name text not null,
  team text not null default '',
  avatar text not null default '',
  overall integer not null default 80 check (overall between 1 and 99),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.matches (
  id text primary key,
  tournament_id text not null references public.tournaments(id) on delete cascade,
  player1_id text null references public.tournament_players(id) on delete set null,
  player2_id text null references public.tournament_players(id) on delete set null,
  winner_id text null references public.tournament_players(id) on delete set null,
  score1 integer null check (score1 is null or score1 >= 0),
  score2 integer null check (score2 is null or score2 >= 0),
  went_to_penalties boolean not null default false,
  penalty_score1 integer null check (penalty_score1 is null or penalty_score1 >= 0),
  penalty_score2 integer null check (penalty_score2 is null or penalty_score2 >= 0),
  round integer not null check (round between 1 and 4),
  position integer not null check (position >= 0),
  status text not null default 'pending' check (status in ('pending', 'live', 'completed')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (tournament_id, round, position)
);

create unique index if not exists tournament_players_unique_name_per_tournament
  on public.tournament_players (tournament_id, lower(name));

create index if not exists tournament_players_tournament_id_idx
  on public.tournament_players (tournament_id);

create index if not exists matches_tournament_id_idx
  on public.matches (tournament_id);

create index if not exists matches_round_position_idx
  on public.matches (tournament_id, round, position);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'tournaments_champion_player_id_fkey'
  ) then
    alter table public.tournaments
      add constraint tournaments_champion_player_id_fkey
      foreign key (champion_player_id)
      references public.tournament_players(id)
      on delete set null;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'tournaments_live_match_id_fkey'
  ) then
    alter table public.tournaments
      add constraint tournaments_live_match_id_fkey
      foreign key (live_match_id)
      references public.matches(id)
      on delete set null;
  end if;
end
$$;

drop trigger if exists tournaments_set_updated_at on public.tournaments;
create trigger tournaments_set_updated_at
before update on public.tournaments
for each row
execute function public.set_updated_at();

drop trigger if exists matches_set_updated_at on public.matches;
create trigger matches_set_updated_at
before update on public.matches
for each row
execute function public.set_updated_at();

alter table public.tournaments enable row level security;
alter table public.tournament_players enable row level security;
alter table public.matches enable row level security;

drop policy if exists "Public can read tournaments" on public.tournaments;
create policy "Public can read tournaments"
on public.tournaments
for select
using (true);

drop policy if exists "Public can write tournaments" on public.tournaments;
create policy "Public can write tournaments"
on public.tournaments
for all
using (true)
with check (true);

drop policy if exists "Public can read tournament players" on public.tournament_players;
create policy "Public can read tournament players"
on public.tournament_players
for select
using (true);

drop policy if exists "Public can write tournament players" on public.tournament_players;
create policy "Public can write tournament players"
on public.tournament_players
for all
using (true)
with check (true);

drop policy if exists "Public can read matches" on public.matches;
create policy "Public can read matches"
on public.matches
for select
using (true);

drop policy if exists "Public can write matches" on public.matches;
create policy "Public can write matches"
on public.matches
for all
using (true)
with check (true);

insert into public.tournaments (
  id,
  slug,
  name,
  status,
  max_players
)
values (
  '1',
  'main',
  'Champions Tito',
  'setup',
  14
)
on conflict (id) do nothing;
