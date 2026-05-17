-- Migration 009: histórico de campeonatos finalizados (snapshot completo)

create table if not exists public.tournament_archives (
  id text primary key,
  source_tournament_id text not null,
  name text not null,
  mode text not null check (mode in ('knockout', 'groups_knockout')),
  champion_player_id text null,
  champion_name text not null default '',
  champion_team text not null default '',
  player_count integer not null default 0 check (player_count >= 0),
  match_count integer not null default 0 check (match_count >= 0),
  finished_at timestamptz not null default timezone('utc', now()),
  snapshot jsonb not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists tournament_archives_finished_at_idx
  on public.tournament_archives (finished_at desc);

alter table public.tournament_archives enable row level security;

drop policy if exists "Public can read tournament archives" on public.tournament_archives;
create policy "Public can read tournament archives"
  on public.tournament_archives for select using (true);

drop policy if exists "Public can write tournament archives" on public.tournament_archives;
create policy "Public can write tournament archives"
  on public.tournament_archives for all using (true) with check (true);

select 'Migration 009: tabela tournament_archives criada.' as info;
