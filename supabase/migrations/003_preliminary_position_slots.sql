-- Migration 003: slots de position para preliminares (sem alterar colunas)
--
-- O app grava:
--   position 0..4999     -> mata-mata principal
--   position 5000..9999  -> preliminares (round 1)
--   position 10000+      -> fase de grupos (round 1)
--
-- Nenhum ALTER TABLE necessario. Esta migration documenta o contrato e
-- limpa dados antigos que colidiam (preliminar e rodada 1 na mesma position).

-- Opcional: apagar partidas com preliminar mal gravada (position 0..99, id ko-prelim-*)
-- Descomente se o sync falhar com duplicate key em (tournament_id, round, position):

-- delete from public.matches
-- where id like 'ko-prelim-%'
--   and position < 5000;

-- Recomendado apos atualizar o app: use "Novo torneio" na home (mantem jogadores)
-- ou delete from public.matches where tournament_id = '1';

select 'Migration 003: nenhum DDL obrigatorio. Atualize o app e reinicie o torneio se necessario.' as info;
