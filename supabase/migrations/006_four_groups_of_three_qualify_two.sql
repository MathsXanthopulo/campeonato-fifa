-- Migration 006: 4 grupos de 3 — classificam 1º e 2º de cada grupo (somente app)
--
-- Com 12 jogadores: sempre 4 grupos × 3 jogadores → 8 no mata-mata (quartas).
-- Rode "Novo torneio" no /admin se o torneio antigo usava 3 grupos de 4.

select 'Migration 006: 4 grupos de 3, 1º e 2º de cada grupo para o mata-mata.' as info;
