import { TournamentArchive, TournamentArchiveSummary, TournamentMode, TournamentState } from './types'

const ARCHIVES_STORAGE_KEY = 'fc-tournament-archives'

export function getTournamentModeLabel(mode: TournamentMode): string {
  return mode === 'groups_knockout' ? 'Grupos + mata-mata' : 'Mata-mata'
}

export function buildArchiveFromState(state: TournamentState): TournamentArchive {
  const champion = state.players.find((player) => player.id === state.tournament.championId)
  const finishedAt = new Date().toISOString()

  return {
    id: `archive-${Date.now()}`,
    sourceTournamentId: state.tournament.id,
    name: state.tournament.name,
    mode: state.tournament.mode,
    championPlayerId: state.tournament.championId,
    championName: champion?.name ?? '—',
    championTeam: champion?.team ?? '',
    playerCount: state.players.length,
    matchCount: state.matches.length,
    finishedAt,
    snapshot: {
      ...state,
      tournament: {
        ...state.tournament,
        status: 'completed',
        phase: 'completed',
      },
    },
  }
}

export function canArchiveTournament(state: TournamentState): boolean {
  if (state.tournament.championId) return true
  if (state.tournament.status === 'completed') return true
  return state.matches.some((match) => match.status === 'completed')
}

function readLocalArchives(): TournamentArchive[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(ARCHIVES_STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as TournamentArchive[]
  } catch {
    return []
  }
}

function writeLocalArchives(archives: TournamentArchive[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(ARCHIVES_STORAGE_KEY, JSON.stringify(archives))
}

export function saveArchiveToLocalStorage(archive: TournamentArchive): void {
  const archives = readLocalArchives()
  writeLocalArchives([archive, ...archives])
}

export function fetchArchiveSummariesFromLocalStorage(): TournamentArchiveSummary[] {
  return readLocalArchives().map(({ snapshot: _snapshot, ...summary }) => summary)
}

export function fetchArchiveFromLocalStorage(id: string): TournamentArchive | null {
  return readLocalArchives().find((archive) => archive.id === id) ?? null
}

export function formatArchiveDate(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date(iso))
}
