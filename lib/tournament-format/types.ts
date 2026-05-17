import { Player } from '../types'

export type TournamentMode = 'knockout' | 'groups_knockout'

export type KnockoutRoundKey =
  | 'final'
  | 'semi_finals'
  | 'quarter_finals'
  | 'round_of_16'
  | 'round_of_32'
  | 'preliminary'
  | 'round_1'

export interface FormatMatchPlayer {
  id: string
  name: string
  team: string
}

export interface FormatGroupMatch {
  id: string
  groupId: string
  player1Id: string
  player2Id: string
  status: 'pending' | 'live' | 'completed'
}

export interface FormatGroup {
  id: string
  name: string
  players: FormatMatchPlayer[]
  matches: FormatGroupMatch[]
}

export interface FormatKnockoutMatch {
  id: string
  round: number
  position: number
  roundKey: KnockoutRoundKey
  player1Id: string | null
  player2Id: string | null
  isBye: boolean
  status: 'pending' | 'live' | 'completed'
}

export interface FormatKnockout {
  round: KnockoutRoundKey
  bracketSize: number
  totalRounds: number
  preliminaryMatches: FormatKnockoutMatch[]
  matches: FormatKnockoutMatch[]
}

export interface QualificationPlan {
  groupCount: number
  groupSizes: number[]
  qualifyPerGroup: number
  bestSecondPlaces: number
  bestThirdPlaces: number
  targetKnockoutSize: number
  description: string
}

export interface TournamentFormatResult {
  mode: TournamentMode
  playerCount: number
  groups: FormatGroup[]
  qualified: string[]
  qualification: QualificationPlan | null
  knockout: FormatKnockout
}

export interface GenerateFormatInput {
  players: Player[]
  mode: TournamentMode
  shuffle?: boolean
}
