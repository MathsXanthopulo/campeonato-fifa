# Supabase — migrations do torneio

Sempre que o app ganhar **lógica nova de banco**, aparece um arquivo numerado em `migrations/`.

## Como rodar

1. Abra o [Supabase Dashboard](https://supabase.com/dashboard) do seu projeto.
2. Vá em **SQL Editor** → **New query**.
3. Execute **na ordem** (só o que ainda não rodou):

| Arquivo | Quando rodar |
|---------|----------------|
| `001_initial_schema.sql` | Projeto novo, sem tabelas |
| `002_groups_round_constraint.sql` | Erro `matches_round_check` ou fase de grupos |
| `003_preliminary_position_slots.sql` | Erro de `unique (tournament_id, round, position)` no sync |
| `004_knockout_bracket_display.sql` | Chave mata-mata com jogador na final antes de jogar (re-sortear) |
| `005_group_knockout_seeding.sql` | Mata-mata pós-grupos sem repetir adversário do mesmo grupo na 1ª rodada |
| `006_four_groups_of_three_qualify_two.sql` | 4 grupos de 3: 1º e 2º de cada grupo → quartas (8 jogadores) |
| `007_fix_prelim_pairings.sql` | Ajuste manual preliminar: vitor/claudio, diego/ailton, rodrigo/lucas |
| `009_tournament_archives.sql` | Histórico de campeonatos finalizados (snapshot JSON) |

4. Se o sync ainda falhar após a 003, use **Novo torneio** na home (mantém jogadores) ou apague as linhas de `matches` no Table Editor e recarregue o app.

## O que não vai no SQL

Modo do torneio (`knockout` vs `grupos`), fase e grupos são inferidos das partidas no código — não há colunas extras para isso.

## Credenciais

Ficam no `.env` (não versionado):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
