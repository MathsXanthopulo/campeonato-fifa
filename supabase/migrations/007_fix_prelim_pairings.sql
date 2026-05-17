-- Migration 007: ajuste manual da preliminar (jogos em andamento)
-- vitor vs claudio | diego vs ailton | rodrigo vs lucas
--
-- Executado no Supabase em 2026-05-17.
-- Se precisar reaplicar, ajuste os IDs conforme tournament_players do seu torneio.

-- Cadastro dos jogadores que faltavam (IDs exemplo; troque se já existirem):
-- insert into public.tournament_players (id, tournament_id, name, team, avatar, overall)
-- values
--   ('1779031000001', '1', 'vitor alves', 'NemNoe', '', 80),
--   ('1779031000002', '1', 'claudio', 'palmeiras', '', 80)
-- on conflict (id) do update set name = excluded.name, team = excluded.team;

-- delete from public.matches where tournament_id = '1';
-- (reinserir ko-prelim-0..2 e ko-r1-0..3 conforme script do repositório)

select 'Migration 007: preliminar vitor/claudio, diego/ailton, rodrigo/lucas — ver historico do deploy.' as info;
