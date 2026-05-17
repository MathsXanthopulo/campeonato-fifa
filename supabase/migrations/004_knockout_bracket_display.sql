-- Migration 004: correcao de exibicao do mata-mata (sem DDL obrigatorio)
--
-- Bug corrigido no app: byes nao preenchem semifinal/final ao sortear a chave.
-- Preliminares deixam de ser misturadas com a Rodada 1 na UI.
--
-- Nenhuma alteracao de tabela necessaria.
-- Recomendado apos atualizar o app:
--   1. Clique em "Novo torneio" na home (mantem jogadores), OU
--   2. delete from public.matches where tournament_id = '1';
--   3. Sorteie a chave novamente em /bracket

select 'Migration 004 aplicada (logica no app). Reinicie o torneio se a chave antiga estiver errada.' as info;
