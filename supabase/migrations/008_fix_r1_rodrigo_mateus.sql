-- Migration 008: rodada 1 — Rodrigo 6x0 Mateus (correção manual)
-- Causa: vencedor da preliminar 2 não entrou em ko-r1-0 (vaga ocupada em outro confronto).

-- update public.matches set
--   player1_id = (select id from tournament_players where lower(name) like '%rodrigo%' limit 1),
--   player2_id = (select id from tournament_players where lower(name) like '%mateus%' limit 1),
--   score1 = 6, score2 = 0,
--   winner_id = (select id from tournament_players where lower(name) like '%rodrigo%' limit 1),
--   status = 'completed'
-- where id = 'ko-r1-0' and tournament_id = '1';

select 'Migration 008: ko-r1-0 Rodrigo 6x0 Mateus aplicado no Supabase.' as info;
