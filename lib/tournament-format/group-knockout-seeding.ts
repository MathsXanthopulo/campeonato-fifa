import { QualificationPlan } from './types'
import { rankGroup } from './standings'

export interface QualifiedEntry {
  playerId: string
  groupId: string
  groupIndex: number
  rankInGroup: number
}

/** Ordem dos IDs para o mata-mata: byes primeiro, depois jogadores da preliminar (pares sem mesmo grupo). */
export function buildGroupAwarePlayerOrder(
  entries: QualifiedEntry[],
  targetKnockoutSize: number
): string[] {
  if (entries.length === 0) return []

  const targetSize = Math.max(2, targetKnockoutSize)
  const surplus = Math.max(0, entries.length - targetSize)
  const prelimPlayerCount = surplus * 2
  const byePlayerCount = Math.max(0, entries.length - prelimPlayerCount)

  const byePool = selectByePool(entries, byePlayerCount)
  const byeIds = new Set(byePool.map((e) => e.playerId))
  const prelimPool = entries.filter((e) => !byeIds.has(e.playerId))

  const byeOrder = flattenPairs(buildRound1Pairs(byePool))
  const prelimOrder = flattenPairs(buildRound1Pairs(prelimPool))

  return [...byeOrder, ...prelimOrder]
}

function selectByePool(entries: QualifiedEntry[], count: number): QualifiedEntry[] {
  if (count <= 0) return []

  const sorted = [...entries].sort((a, b) => {
    if (a.rankInGroup !== b.rankInGroup) return a.rankInGroup - b.rankInGroup
    return a.groupIndex - b.groupIndex
  })

  return sorted.slice(0, count)
}

function buildRound1Pairs(players: QualifiedEntry[]): [QualifiedEntry, QualifiedEntry][] {
  const pool = [...players]
  const pairs: [QualifiedEntry, QualifiedEntry][] = []

  while (pool.length >= 2) {
    const first = pool.shift()!
    const partnerIndex = pool.findIndex((candidate) => candidate.groupIndex !== first.groupIndex)

    if (partnerIndex === -1) {
      const partner = pool.shift()!
      pairs.push([first, partner])
      continue
    }

    const partner = pool.splice(partnerIndex, 1)[0]
    pairs.push([first, partner])
  }

  return pairs
}

function flattenPairs(pairs: [QualifiedEntry, QualifiedEntry][]): string[] {
  const ids: string[] = []
  for (const [a, b] of pairs) {
    ids.push(a.playerId, b.playerId)
  }
  return ids
}

export function buildQualifiedEntries(
  groups: { id: string; playerIds: string[] }[],
  matches: import('../types').Match[],
  plan: QualificationPlan
): QualifiedEntry[] {
  const entries: QualifiedEntry[] = []
  const seen = new Set<string>()

  const add = (playerId: string, groupId: string, groupIndex: number, rankInGroup: number) => {
    if (seen.has(playerId)) return
    seen.add(playerId)
    entries.push({ playerId, groupId, groupIndex, rankInGroup })
  }

  groups.forEach((group, groupIndex) => {
    const groupMatches = matches.filter(
      (match) => match.phase === 'groups' && match.groupId === group.id
    )
    const ranking = rankGroup(group.playerIds, groupMatches)

    ranking.slice(0, plan.qualifyPerGroup).forEach((row, index) => {
      add(row.playerId, group.id, groupIndex, index + 1)
    })
  })

  const runnersUp: { entry: QualifiedEntry; standing: ReturnType<typeof rankGroup>[0] }[] = []
  const thirdPlaces: { entry: QualifiedEntry; standing: ReturnType<typeof rankGroup>[0] }[] = []

  groups.forEach((group, groupIndex) => {
    const groupMatches = matches.filter(
      (match) => match.phase === 'groups' && match.groupId === group.id
    )
    const ranking = rankGroup(group.playerIds, groupMatches)

    if (plan.qualifyPerGroup < ranking.length) {
      const row = ranking[plan.qualifyPerGroup]
      runnersUp.push({
        entry: { playerId: row.playerId, groupId: group.id, groupIndex, rankInGroup: plan.qualifyPerGroup + 1 },
        standing: row,
      })
    }

    if (plan.bestThirdPlaces > 0 && ranking.length > 2) {
      const row = ranking[2]
      thirdPlaces.push({
        entry: { playerId: row.playerId, groupId: group.id, groupIndex, rankInGroup: 3 },
        standing: row,
      })
    }
  })

  if (plan.bestSecondPlaces > 0) {
    runnersUp
      .sort((a, b) => compareStandingsRow(a.standing, b.standing))
      .slice(0, plan.bestSecondPlaces)
      .forEach(({ entry }) => add(entry.playerId, entry.groupId, entry.groupIndex, entry.rankInGroup))
  }

  if (plan.bestThirdPlaces > 0) {
    thirdPlaces
      .sort((a, b) => compareStandingsRow(a.standing, b.standing))
      .slice(0, plan.bestThirdPlaces)
      .forEach(({ entry }) => add(entry.playerId, entry.groupId, entry.groupIndex, entry.rankInGroup))
  }

  return entries
}

function compareStandingsRow(
  a: { points: number; goalDifference: number; goalsFor: number; playerId: string },
  b: { points: number; goalDifference: number; goalsFor: number; playerId: string }
): number {
  if (b.points !== a.points) return b.points - a.points
  if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference
  if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor
  return a.playerId.localeCompare(b.playerId)
}

/** Valida que nenhum confronto da 1ª rodada do mata-mata repete duplas do mesmo grupo. */
export function validateNoSameGroupInFirstKnockoutRound(
  seedOrder: string[],
  entries: QualifiedEntry[],
  targetKnockoutSize: number
): boolean {
  const byPlayer = new Map(entries.map((e) => [e.playerId, e]))
  const targetSize = Math.max(2, targetKnockoutSize)
  const surplus = Math.max(0, entries.length - targetSize)
  const prelimPlayerCount = surplus * 2
  const byePlayerCount = Math.max(0, entries.length - prelimPlayerCount)
  const mainSeeds = seedOrder.slice(0, targetSize)
  const directCount = Math.min(byePlayerCount, mainSeeds.length)
  const directSeeds = mainSeeds.slice(0, directCount)

  for (let i = 0; i < directCount; i += 2) {
    const a = byPlayer.get(directSeeds[i])
    const b = byPlayer.get(directSeeds[i + 1])
    if (a && b && a.groupId === b.groupId) return false
  }

  const prelimPlayers = seedOrder.slice(byePlayerCount)
  for (let i = 0; i < prelimPlayers.length; i += 2) {
    const a = byPlayer.get(prelimPlayers[i])
    const b = byPlayer.get(prelimPlayers[i + 1])
    if (a && b && a.groupId === b.groupId) return false
  }

  return true
}
