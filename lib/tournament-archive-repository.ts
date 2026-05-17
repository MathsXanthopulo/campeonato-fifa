import {
  buildArchiveFromState,
  fetchArchiveFromLocalStorage,
  fetchArchiveSummariesFromLocalStorage,
  saveArchiveToLocalStorage,
} from './tournament-archive'
import { isSupabaseConfigured, supabase } from './supabase'
import { TournamentArchive, TournamentArchiveSummary, TournamentState } from './types'
import { persistTournamentStateToSupabase } from './tournament-repository'
import { createEmptyTournamentState } from './store'

interface ArchiveRow {
  id: string
  source_tournament_id: string
  name: string
  mode: 'knockout' | 'groups_knockout'
  champion_player_id: string | null
  champion_name: string
  champion_team: string
  player_count: number
  match_count: number
  finished_at: string
  snapshot: TournamentState
  created_at: string
}

function mapSummary(row: ArchiveRow): TournamentArchiveSummary {
  return {
    id: row.id,
    sourceTournamentId: row.source_tournament_id,
    name: row.name,
    mode: row.mode,
    championPlayerId: row.champion_player_id,
    championName: row.champion_name,
    championTeam: row.champion_team,
    playerCount: row.player_count,
    matchCount: row.match_count,
    finishedAt: row.finished_at,
  }
}

function mapArchive(row: ArchiveRow): TournamentArchive {
  return {
    ...mapSummary(row),
    snapshot: row.snapshot,
  }
}

export async function saveTournamentArchive(state: TournamentState): Promise<TournamentArchive> {
  const archive = buildArchiveFromState(state)

  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('tournament_archives').insert({
      id: archive.id,
      source_tournament_id: archive.sourceTournamentId,
      name: archive.name,
      mode: archive.mode,
      champion_player_id: archive.championPlayerId,
      champion_name: archive.championName,
      champion_team: archive.championTeam,
      player_count: archive.playerCount,
      match_count: archive.matchCount,
      finished_at: archive.finishedAt,
      snapshot: archive.snapshot,
    })

    if (error) {
      throw new Error(`Falha ao salvar campeonato no histórico: ${error.message}`)
    }
  }

  saveArchiveToLocalStorage(archive)
  return archive
}

export async function fetchTournamentArchiveSummaries(): Promise<TournamentArchiveSummary[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('tournament_archives')
      .select(
        'id, source_tournament_id, name, mode, champion_player_id, champion_name, champion_team, player_count, match_count, finished_at'
      )
      .order('finished_at', { ascending: false })

    if (error) {
      throw new Error(`Falha ao carregar histórico: ${error.message}`)
    }

    if (data && data.length > 0) {
      return (data as ArchiveRow[]).map(mapSummary)
    }
  }

  return fetchArchiveSummariesFromLocalStorage()
}

export async function fetchTournamentArchiveById(id: string): Promise<TournamentArchive | null> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('tournament_archives')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) {
      throw new Error(`Falha ao carregar campeonato: ${error.message}`)
    }

    if (data) {
      return mapArchive(data as ArchiveRow)
    }
  }

  return fetchArchiveFromLocalStorage(id)
}

/** Salva snapshot no histórico e zera o torneio ativo para um campeonato novo. */
export async function archiveTournamentAndStartNew(
  state: TournamentState
): Promise<{ archive: TournamentArchive; nextState: TournamentState }> {
  const archive = await saveTournamentArchive(state)
  const nextState = createEmptyTournamentState(state.tournament.name)
  await persistTournamentStateToSupabase(nextState)
  return { archive, nextState }
}
