import { MAX_PLAYERS } from './store'
import { isSupabaseConfigured, supabase } from './supabase'
import { Match, Player, TournamentState } from './types'

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
    max_players: MAX_PLAYERS,
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

function mapMatches(rows: MatchRow[]): Match[] {
  return rows
    .sort((a, b) => {
      if (a.round !== b.round) {
        return a.round - b.round
      }

      return a.position - b.position
    })
    .map((row) => ({
      id: row.id,
      player1Id: row.player1_id,
      player2Id: row.player2_id,
      score1: row.score1,
      score2: row.score2,
      wentToPenalties: row.went_to_penalties ?? false,
      penaltyScore1: row.penalty_score1,
      penaltyScore2: row.penalty_score2,
      winnerId: row.winner_id,
      round: row.round,
      position: row.position,
      status: row.status,
      createdAt: row.created_at,
    }))
}

function createFallbackBracket(players: Player[]): Match[] {
  const now = new Date().toISOString()
  const matches: Match[] = []

  const round1Matchups = [
    [0, 13],
    [1, 12],
    [2, 11],
    [3, 10],
    [4, 9],
    [5, 8],
  ]

  round1Matchups.forEach(([p1, p2], index) => {
    matches.push({
      id: `r1-${index}`,
      player1Id: players[p1]?.id ?? null,
      player2Id: players[p2]?.id ?? null,
      score1: null,
      score2: null,
      wentToPenalties: false,
      penaltyScore1: null,
      penaltyScore2: null,
      winnerId: null,
      round: 1,
      position: index,
      status: 'pending',
      createdAt: now,
    })
  })

  for (let i = 0; i < 4; i += 1) {
    matches.push({
      id: `r2-${i}`,
      player1Id: i === 0 ? players[6]?.id ?? null : null,
      player2Id: i === 3 ? players[7]?.id ?? null : null,
      score1: null,
      score2: null,
      wentToPenalties: false,
      penaltyScore1: null,
      penaltyScore2: null,
      winnerId: null,
      round: 2,
      position: i,
      status: 'pending',
      createdAt: now,
    })
  }

  for (let i = 0; i < 2; i += 1) {
    matches.push({
      id: `r3-${i}`,
      player1Id: null,
      player2Id: null,
      score1: null,
      score2: null,
      wentToPenalties: false,
      penaltyScore1: null,
      penaltyScore2: null,
      winnerId: null,
      round: 3,
      position: i,
      status: 'pending',
      createdAt: now,
    })
  }

  matches.push({
    id: 'r4-0',
    player1Id: null,
    player2Id: null,
    score1: null,
    score2: null,
    wentToPenalties: false,
    penaltyScore1: null,
    penaltyScore2: null,
    winnerId: null,
    round: 4,
    position: 0,
    status: 'pending',
    createdAt: now,
  })

  return matches
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

  return {
    tournament: {
      id: tournament.id,
      name: tournament.name,
      championId: tournament.champion_player_id,
      status: tournament.status,
      liveMatchId: tournament.live_match_id,
      createdAt: tournament.created_at,
    },
    players: mappedPlayers,
    matches: mappedMatches.length > 0 ? mappedMatches : createFallbackBracket(mappedPlayers),
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

  return matches.map((match) => ({
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
    round: match.round,
    position: match.position,
    status: match.status,
    created_at: match.createdAt,
    updated_at: now,
  }))
}

export async function persistTournamentStateToSupabase(state: TournamentState): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    return
  }

  const now = new Date().toISOString()
  const tournamentId = state.tournament.id || DEFAULT_TOURNAMENT_ID

  const { error: upsertTournamentError } = await supabase
    .from('tournaments')
    .upsert(
      {
        id: tournamentId,
        slug: DEFAULT_TOURNAMENT_SLUG,
        name: state.tournament.name,
        status: state.tournament.status,
        champion_player_id: null,
        live_match_id: null,
        max_players: MAX_PLAYERS,
        created_at: state.tournament.createdAt,
        updated_at: now,
      },
      { onConflict: 'id' }
    )

  if (upsertTournamentError) {
    throw upsertTournamentError
  }

  const { error: deleteMatchesError } = await supabase
    .from('matches')
    .delete()
    .eq('tournament_id', tournamentId)

  if (deleteMatchesError) {
    throw deleteMatchesError
  }

  const { error: deletePlayersError } = await supabase
    .from('tournament_players')
    .delete()
    .eq('tournament_id', tournamentId)

  if (deletePlayersError) {
    throw deletePlayersError
  }

  const playerRows = mapPlayerRows(tournamentId, state.players)
  if (playerRows.length > 0) {
    const { error: insertPlayersError } = await supabase
      .from('tournament_players')
      .insert(playerRows)

    if (insertPlayersError) {
      throw insertPlayersError
    }
  }

  const matchRows = mapMatchRows(tournamentId, state.matches)
  if (matchRows.length > 0) {
    const { error: insertMatchesError } = await supabase
      .from('matches')
      .insert(matchRows)

    if (insertMatchesError) {
      throw insertMatchesError
    }
  }

  const { error: finalizeTournamentError } = await supabase
    .from('tournaments')
    .update({
      name: state.tournament.name,
      status: state.tournament.status,
      champion_player_id: state.tournament.championId,
      live_match_id: state.tournament.liveMatchId,
      max_players: MAX_PLAYERS,
      updated_at: now,
    })
    .eq('id', tournamentId)

  if (finalizeTournamentError) {
    throw finalizeTournamentError
  }
}
