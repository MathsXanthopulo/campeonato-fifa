import { Match, TournamentGroup } from '../types'
import { TournamentFormatResult } from './types'

function nowIso(): string {
  return new Date().toISOString()
}

function toAppMatch(
  partial: Omit<
    Match,
    'score1' | 'score2' | 'wentToPenalties' | 'penaltyScore1' | 'penaltyScore2' | 'winnerId' | 'createdAt'
  > &
    Partial<Pick<Match, 'score1' | 'score2' | 'winnerId' | 'status'>>
): Match {
  return {
    score1: null,
    score2: null,
    wentToPenalties: false,
    penaltyScore1: null,
    penaltyScore2: null,
    winnerId: partial.winnerId ?? null,
    createdAt: nowIso(),
    phase: 'knockout',
    groupId: null,
    ...partial,
  }
}

export function formatToAppState(format: TournamentFormatResult): {
  groups: TournamentGroup[]
  matches: Match[]
} {
  const groups: TournamentGroup[] = format.groups.map((group) => ({
    id: group.id,
    name: group.name,
    playerIds: group.players.map((player) => player.id),
  }))

  const matches: Match[] = []
  let positionCounter = 0

  for (const group of format.groups) {
    for (const match of group.matches) {
      matches.push(
        toAppMatch({
          id: match.id,
          player1Id: match.player1Id,
          player2Id: match.player2Id,
          round: 0,
          position: positionCounter,
          status: match.status,
          phase: 'groups',
          groupId: group.id,
        })
      )
      positionCounter += 1
    }
  }

  const knockoutMatches = [
    ...format.knockout.preliminaryMatches,
    ...format.knockout.matches,
  ]

  const seen = new Set<string>()
  for (const match of knockoutMatches) {
    if (seen.has(match.id)) continue
    seen.add(match.id)

    matches.push(
      toAppMatch({
        id: match.id,
        player1Id: match.player1Id,
        player2Id: match.player2Id,
        round: match.round,
        position: match.position,
        status: match.isBye ? 'pending' : match.status,
        phase: 'knockout',
        groupId: null,
      })
    )
  }

  return { groups, matches }
}
