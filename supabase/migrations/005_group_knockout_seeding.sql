-- Migration 005: sorteio do mata-mata evitando mesmo grupo na 1ª rodada (somente app)
--
-- Nenhuma alteracao de schema. A logica roda ao finalizar todas as partidas de grupos.
-- Rode "Novo torneio" no /admin e refaca os grupos se o mata-mata antigo tiver confrontos errados.

select 'Migration 005: mata-mata com classificados de grupos sem repetir adversario do mesmo grupo na 1ª rodada.' as info;
