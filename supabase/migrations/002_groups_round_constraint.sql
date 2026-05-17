-- Migration 002: fase de grupos (partidas gravadas com round 1 e position >= 10000)
-- Rode se aparecer erro matches_round_check ao salvar partidas de grupo.

alter table public.matches
  drop constraint if exists matches_round_check;

alter table public.matches
  add constraint matches_round_check check (round between 1 and 16);
