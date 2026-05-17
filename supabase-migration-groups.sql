-- Execute no SQL Editor do Supabase se o projeto ja existia antes da fase de grupos.
-- Corrige: matches_round_check (round 0 nos grupos) e permite chaves maiores.

alter table public.matches
  drop constraint if exists matches_round_check;

alter table public.matches
  add constraint matches_round_check check (round between 1 and 16);
