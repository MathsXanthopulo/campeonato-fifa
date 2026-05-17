import { Match, MatchPhase } from './types'

/**
 * Faixas de `position` no banco (round quase sempre 1 para grupos/prelim):
 * - 0..4999: mata-mata principal
 * - 5000..9999: preliminares (evita colisao com rodada 1)
 * - 10000+: fase de grupos
 */
export const PRELIM_MATCH_POSITION_OFFSET = 5_000
export const GROUP_MATCH_POSITION_OFFSET = 10_000

function isPreliminaryMatchId(matchId: string): boolean {
  return matchId.startsWith('ko-prelim-')
}

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

  if (isPreliminaryMatchId(match.id) || match.round === 0) {
    return {
      round: 1,
      position: PRELIM_MATCH_POSITION_OFFSET + match.position,
    }
  }

  const round = Math.max(1, match.round)

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

  if (isPreliminaryMatchId(row.id) || row.position >= PRELIM_MATCH_POSITION_OFFSET) {
    return {
      round: 0,
      position: row.position - PRELIM_MATCH_POSITION_OFFSET,
      phase: 'knockout',
      groupId: null,
    }
  }

  return {
    round: row.round,
    position: row.position,
    phase: 'knockout',
    groupId: null,
  }
}
