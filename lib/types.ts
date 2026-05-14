export interface Player {
  id: string
  name: string
  team: string
  avatar: string
  overall: number
  createdAt: string
}

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
  createdAt: string
}

export interface Tournament {
  id: string
  name: string
  championId: string | null
  status: 'setup' | 'active' | 'completed'
  liveMatchId: string | null
  createdAt: string
}

export interface TournamentState {
  tournament: Tournament
  players: Player[]
  matches: Match[]
}
