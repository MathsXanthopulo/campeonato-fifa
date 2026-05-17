import { getBracketSize } from './bracket'
import { fromDatabaseRoundAndPosition, toDatabaseRoundAndPosition } from './match-db-encoding'
import { formatToAppState, generateTournamentFormat } from './tournament-format'
import { isSupabaseConfigured, supabase } from './supabase'
import { Match, Player, TournamentGroup, TournamentState } from './types'

const DEFAULT_TOURNAMENT_ID = '1'
const DEFAULT_TOURNAMENT_SLUG = 'main'
const DEFAULT_TOURNAMENT_NAME = 'Champions Tito'

interface TournamentRow {
  id: string
  slug: string
  name: string
  status: 'setup' | 'active' | 'completed'
  champion_player_id: string | null
  live_match_id: string | null
  max_players: number
  created_at: string
  updated_at: string
}

interface TournamentPlayerRow {
  id: string
  tournament_id: string
  name: string
  team: string | null
  avatar: string | null
  overall: number | null
  created_at: string
}

interface MatchRow {
  id: string
  tournament_id: string
  player1_id: string | null
  player2_id: string | null
  winner_id: string | null
  score1: number | null
  score2: number | null
  went_to_penalties: boolean | null
  penalty_score1: number | null
  penalty_score2: number | null
  round: number
  position: number
  status: 'pending' | 'live' | 'completed'
  created_at: string
  updated_at: string
}

function getDefaultTournamentRow(): TournamentRow {
  const now = new Date().toISOString()

  return {
    id: DEFAULT_TOURNAMENT_ID,
    slug: DEFAULT_TOURNAMENT_SLUG,
    name: DEFAULT_TOURNAMENT_NAME,
    status: 'setup',
    champion_player_id: null,
    live_match_id: null,
    max_players: 2,
    created_at: now,
    updated_at: now,
  }
}

function mapPlayers(rows: TournamentPlayerRow[]): Player[] {
  return rows
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .map((row) => ({
      id: row.id,
      name: row.name,
      team: row.team ?? '',
      avatar: row.avatar ?? '',
      overall: row.overall ?? 80,
      createdAt: row.created_at,
    }))
}

function inferGroupId(matchId: string): string | null {
  const match = matchId.match(/^(group-[a-z])-m\d+$/i)
  return match ? match[1] : null
}

function mapMatches(rows: MatchRow[]): Match[] {
  return rows
    .sort((a, b) => {
      if (a.round !== b.round) {
        return a.round - b.round
      }

      return a.position - b.position
    })
    .map((row) => {
      const groupId = inferGroupId(row.id)
      const decoded = fromDatabaseRoundAndPosition(
        { round: row.round, position: row.position, id: row.id },
        groupId
      )

      return {
        id: row.id,
        player1Id: row.player1_id,
        player2Id: row.player2_id,
        score1: row.score1,
        score2: row.score2,
        wentToPenalties: row.went_to_penalties ?? false,
        penaltyScore1: row.penalty_score1,
        penaltyScore2: row.penalty_score2,
        winnerId: row.winner_id,
        round: decoded.round,
        position: decoded.position,
        status: row.status,
        phase: decoded.phase,
        groupId: decoded.groupId,
        createdAt: row.created_at,
      }
    })
}

function deriveGroups(matches: Match[]): TournamentGroup[] {
  const groupMap = new Map<string, Set<string>>()

  for (const match of matches) {
    if (match.phase !== 'groups' || !match.groupId) continue
    const bucket = groupMap.get(match.groupId) ?? new Set<string>()
    if (match.player1Id) bucket.add(match.player1Id)
    if (match.player2Id) bucket.add(match.player2Id)
    groupMap.set(match.groupId, bucket)
  }

  return [...groupMap.entries()].map(([id, playerIds]) => ({
    id,
    name: `Grupo ${id.replace('group-', '').toUpperCase()}`,
    playerIds: [...playerIds],
  }))
}

function buildFallbackState(players: Player[]): TournamentState {
  const format = generateTournamentFormat({
    players,
    mode: 'knockout',
    shuffle: false,
  })
  const { groups, matches } = formatToAppState(format)

  return {
    tournament: {
      id: DEFAULT_TOURNAMENT_ID,
      name: DEFAULT_TOURNAMENT_NAME,
      mode: 'knockout',
      phase: 'setup',
      championId: null,
      status: 'setup',
      liveMatchId: null,
      createdAt: new Date().toISOString(),
    },
    players,
    groups,
    matches,
  }
}

async function ensureTournament(): Promise<TournamentRow> {
  if (!supabase) {
    throw new Error('Supabase nao configurado.')
  }

  const { data: existingTournament, error: fetchError } = await supabase
    .from('tournaments')
    .select('*')
    .eq('slug', DEFAULT_TOURNAMENT_SLUG)
    .maybeSingle()

  if (fetchError) {
    throw fetchError
  }

  if (existingTournament) {
    return existingTournament as TournamentRow
  }

  const { data: createdTournament, error: createError } = await supabase
    .from('tournaments')
    .insert(getDefaultTournamentRow())
    .select('*')
    .single()

  if (createError) {
    throw createError
  }

  return createdTournament as TournamentRow
}

export async function fetchTournamentStateFromSupabase(): Promise<TournamentState | null> {
  if (!isSupabaseConfigured || !supabase) {
    return null
  }

  const tournament = await ensureTournament()

  const [{ data: players, error: playersError }, { data: matches, error: matchesError }] = await Promise.all([
    supabase
      .from('tournament_players')
      .select('*')
      .eq('tournament_id', tournament.id),
    supabase
      .from('matches')
      .select('*')
      .eq('tournament_id', tournament.id),
  ])

  if (playersError) {
    throw playersError
  }

  if (matchesError) {
    throw matchesError
  }

  const mappedPlayers = mapPlayers((players ?? []) as TournamentPlayerRow[])
  const mappedMatches = mapMatches((matches ?? []) as MatchRow[])

  if (mappedMatches.length === 0 && mappedPlayers.length === 0) {
    return buildFallbackState([])
  }

  if (mappedMatches.length === 0) {
    return buildFallbackState(mappedPlayers)
  }

  const hasGroupMatches = mappedMatches.some((match) => match.phase === 'groups')
  const mode = hasGroupMatches ? 'groups_knockout' : 'knockout'
  const hasKnockout = mappedMatches.some((match) => match.phase === 'knockout')

  return {
    tournament: {
      id: tournament.id,
      name: tournament.name,
      mode,
      phase:
        tournament.status === 'completed'
          ? 'completed'
          : hasGroupMatches && !hasKnockout
            ? 'groups'
            : 'knockout',
      championId: tournament.champion_player_id,
      status: tournament.status,
      liveMatchId: tournament.live_match_id,
      createdAt: tournament.created_at,
    },
    players: mappedPlayers,
    groups: deriveGroups(mappedMatches),
    matches: mappedMatches,
  }
}

function mapPlayerRows(tournamentId: string, players: Player[]): TournamentPlayerRow[] {
  return players.map((player) => ({
    id: player.id,
    tournament_id: tournamentId,
    name: player.name,
    team: player.team,
    avatar: player.avatar,
    overall: player.overall,
    created_at: player.createdAt,
  }))
}

function mapMatchRows(tournamentId: string, matches: Match[]): MatchRow[] {
  const now = new Date().toISOString()

  return matches.map((match) => {
    const { round, position } = toDatabaseRoundAndPosition(match)

    return {
      id: match.id,
      tournament_id: tournamentId,
      player1_id: match.player1Id,
      player2_id: match.player2Id,
      winner_id: match.winnerId,
      score1: match.score1,
      score2: match.score2,
      went_to_penalties: match.wentToPenalties,
      penalty_score1: match.penaltyScore1,
      penalty_score2: match.penaltyScore2,
      round,
      position,
      status: match.status,
      created_at: match.createdAt,
      updated_at: now,
    }
  })
}

function formatSupabaseError(error: unknown): string {
  if (error && typeof error === 'object') {
    const row = error as { message?: string; details?: string; hint?: string; code?: string }
    return [row.message, row.details, row.hint, row.code ? `(${row.code})` : '']
      .filter(Boolean)
      .join(' — ')
  }
  return String(error)
}

export async function persistTournamentStateToSupabase(state: TournamentState): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    return
  }

  const now = new Date().toISOString()
  const tournamentId = state.tournament.id || DEFAULT_TOURNAMENT_ID
  const maxPlayers = Math.max(2, getBracketSize(state.players.length))

  // Limpa FKs antes de apagar partidas/jogadores (evita violacao em live_match_id / champion).
  const { error: clearRefsError } = await supabase
    .from('tournaments')
    .update({
      champion_player_id: null,
      live_match_id: null,
      updated_at: now,
    })
    .eq('id', tournamentId)

  if (clearRefsError) {
    throw new Error(`Falha ao limpar referencias do torneio: ${formatSupabaseError(clearRefsError)}`)
  }

  const { error: upsertTournamentError } = await supabase.from('tournaments').upsert(
    {
      id: tournamentId,
      slug: DEFAULT_TOURNAMENT_SLUG,
      name: state.tournament.name,
      status: state.tournament.status,
      champion_player_id: null,
      live_match_id: null,
      max_players: maxPlayers,
      created_at: state.tournament.createdAt,
      updated_at: now,
    },
    { onConflict: 'id' }
  )

  if (upsertTournamentError) {
    throw new Error(`Falha ao salvar torneio: ${formatSupabaseError(upsertTournamentError)}`)
  }

  const { error: deleteMatchesError } = await supabase
    .from('matches')
    .delete()
    .eq('tournament_id', tournamentId)

  if (deleteMatchesError) {
    throw new Error(`Falha ao apagar partidas: ${formatSupabaseError(deleteMatchesError)}`)
  }

  const { error: deletePlayersError } = await supabase
    .from('tournament_players')
    .delete()
    .eq('tournament_id', tournamentId)

  if (deletePlayersError) {
    throw new Error(`Falha ao apagar jogadores: ${formatSupabaseError(deletePlayersError)}`)
  }

  const playerRows = mapPlayerRows(tournamentId, state.players)
  if (playerRows.length > 0) {
    const { error: insertPlayersError } = await supabase
      .from('tournament_players')
      .upsert(playerRows, { onConflict: 'id' })

    if (insertPlayersError) {
      throw new Error(`Falha ao salvar jogadores: ${formatSupabaseError(insertPlayersError)}`)
    }
  }

  const matchRows = mapMatchRows(tournamentId, state.matches)
  if (matchRows.length > 0) {
    const slotKeys = new Set<string>()
    for (const row of matchRows) {
      const key = `${row.round}:${row.position}`
      if (slotKeys.has(key)) {
        throw new Error(
          `Conflito de chave no banco (round/position duplicado): round=${row.round} position=${row.position}. Rode supabase/migrations/002 e 003.`
        )
      }
      slotKeys.add(key)
    }

    const { error: insertMatchesError } = await supabase.from('matches').insert(matchRows)

    if (insertMatchesError) {
      throw new Error(`Falha ao salvar partidas: ${formatSupabaseError(insertMatchesError)}`)
    }
  }

  const liveMatchId =
    state.tournament.liveMatchId &&
    matchRows.some((row) => row.id === state.tournament.liveMatchId)
      ? state.tournament.liveMatchId
      : null

  const championId =
    state.tournament.championId &&
    playerRows.some((row) => row.id === state.tournament.championId)
      ? state.tournament.championId
      : null

  const { error: finalizeTournamentError } = await supabase
    .from('tournaments')
    .update({
      name: state.tournament.name,
      status: state.tournament.status,
      champion_player_id: championId,
      live_match_id: liveMatchId,
      max_players: maxPlayers,
      updated_at: now,
    })
    .eq('id', tournamentId)

  if (finalizeTournamentError) {
    throw new Error(`Falha ao finalizar torneio: ${formatSupabaseError(finalizeTournamentError)}`)
  }
}
