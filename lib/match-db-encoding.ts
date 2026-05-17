import { Match, MatchPhase } from './types'

/** Partidas de grupo usam position >= OFFSET no banco (round 1) para compatibilidade com schema antigo. */
export const GROUP_MATCH_POSITION_OFFSET = 10_000

export function toDatabaseRoundAndPosition(match: Match): {
  round: number
  position: number
} {
  if (match.phase === 'groups') {
    return {
      round: 1,
      position: GROUP_MATCH_POSITION_OFFSET + match.position,
    }
  }

  const round = Math.max(1, match.round === 0 ? 1 : match.round)

  return {
    round,
    position: match.position,
  }
}

export function fromDatabaseRoundAndPosition(
  row: { round: number; position: number; id: string },
  groupIdFromId: string | null
): { round: number; position: number; phase: MatchPhase; groupId: string | null } {
  const groupId = groupIdFromId

  if (groupId || row.position >= GROUP_MATCH_POSITION_OFFSET) {
    return {
      round: 0,
      position: row.position - GROUP_MATCH_POSITION_OFFSET,
      phase: 'groups',
      groupId,
    }
  }

  return {
    round: row.round,
    position: row.position,
    phase: 'knockout',
    groupId: null,
  }
}
