export interface Player {
  id: string
  name: string
  team: string
  avatar: string
  overall: number
  createdAt: string
}

export type TournamentMode = 'knockout' | 'groups_knockout'
export type TournamentPhase = 'setup' | 'groups' | 'knockout' | 'completed'
export type MatchPhase = 'groups' | 'knockout'

export interface Match {
  id: string
  player1Id: string | null
  player2Id: string | null
  score1: number | null
  score2: number | null
  wentToPenalties: boolean
  penaltyScore1: number | null
  penaltyScore2: number | null
  winnerId: string | null
  round: number
  position: number
  status: 'pending' | 'live' | 'completed'
  phase: MatchPhase
  groupId: string | null
  createdAt: string
}

export interface TournamentGroup {
  id: string
  name: string
  playerIds: string[]
}

export interface Tournament {
  id: string
  name: string
  mode: TournamentMode
  phase: TournamentPhase
  championId: string | null
  status: 'setup' | 'active' | 'completed'
  liveMatchId: string | null
  createdAt: string
}

export interface TournamentState {
  tournament: Tournament
  players: Player[]
  groups: TournamentGroup[]
  matches: Match[]
}

export interface TournamentArchiveSummary {
  id: string
  sourceTournamentId: string
  name: string
  mode: TournamentMode
  championPlayerId: string | null
  championName: string
  championTeam: string
  playerCount: number
  matchCount: number
  finishedAt: string
}

export interface TournamentArchive extends TournamentArchiveSummary {
  snapshot: TournamentState
}
