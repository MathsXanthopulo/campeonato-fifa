import { QualificationPlan } from './types'
import { nextPowerOfTwo } from './utils'

/** 4 grupos com 3 jogadores cada (12 no total). */
export function isFourGroupsOfThree(groupSizes: number[]): boolean {
  return groupSizes.length === 4 && groupSizes.every((size) => size === 3)
}

export function fourGroupsOfThreeQualificationPlan(groupSizes: number[]): QualificationPlan {
  return {
    groupCount: 4,
    groupSizes,
    qualifyPerGroup: 2,
    bestSecondPlaces: 0,
    bestThirdPlaces: 0,
    targetKnockoutSize: 8,
    description:
      '4 grupos de 3: 1º e 2º de cada grupo classificam → quartas de final (8 jogadores).',
  }
}

/** Distribui N jogadores em grupos com diferença máxima de 1. */
export function planGroupSizes(playerCount: number): number[] {
  if (playerCount <= 0) return []
  if (playerCount <= 6) return [playerCount]
  /** Torneio padrão: 4 grupos × 3 jogadores. */
  if (playerCount === 12) return [3, 3, 3, 3]

  let bestSizes: number[] = [playerCount]
  let bestScore = Number.POSITIVE_INFINITY

  const minGroups = 2
  const maxGroups = Math.min(Math.ceil(playerCount / 3), Math.ceil(playerCount / 2))

  for (let groupCount = minGroups; groupCount <= maxGroups; groupCount += 1) {
    const base = Math.floor(playerCount / groupCount)
    const remainder = playerCount % groupCount

    if (base < 2) continue

    const sizes = Array.from({ length: groupCount }, (_, index) =>
      base + (index < remainder ? 1 : 0)
    )

    const spread = Math.max(...sizes) - Math.min(...sizes)
    if (spread > 1) continue

    const avgSize = playerCount / groupCount
    const knockoutTarget = estimateTargetKnockoutSize(playerCount)
    const estimatedQualified =
      sizes.length * defaultQualifyPerGroup(playerCount, sizes) +
      extraBestPlaces(playerCount, sizes)

    const fourByThree = sizes.length === 4 && sizes.every((size) => size === 3)
    const score =
      spread * 10 +
      Math.abs(estimatedQualified - knockoutTarget) * 4 +
      (fourByThree ? 0 : Math.abs(avgSize - 4) * 2) +
      groupCount * 0.5 -
      (fourByThree ? 6 : 0)

    if (score < bestScore) {
      bestScore = score
      bestSizes = sizes
    }
  }

  return bestSizes
}

function defaultQualifyPerGroup(playerCount: number, groupSizes: number[]): number {
  if (groupSizes.length === 1) {
    if (playerCount <= 4) return 2
    return Math.min(4, playerCount)
  }
  if (isFourGroupsOfThree(groupSizes)) return 2
  if (playerCount <= 10) return 1
  if (playerCount <= 16) return 2
  return 1
}

function extraBestPlaces(playerCount: number, groupSizes: number[]): number {
  const leaders = groupSizes.length * defaultQualifyPerGroup(playerCount, groupSizes)
  const target = estimateTargetKnockoutSize(playerCount)
  return Math.max(0, target - leaders)
}

export function estimateTargetKnockoutSize(playerCount: number): number {
  if (playerCount <= 4) return Math.max(2, nextPowerOfTwo(playerCount))
  if (playerCount <= 6) return 4
  if (playerCount <= 10) return 4
  if (playerCount <= 16) return 8
  if (playerCount <= 32) return 16
  return nextPowerOfTwo(playerCount)
}

export function buildQualificationPlan(playerCount: number, groupSizes: number[]): QualificationPlan {
  const groupCount = groupSizes.length
  const targetKnockoutSize = estimateTargetKnockoutSize(playerCount)

  if (groupCount === 1) {
    const qualifyPerGroup = playerCount <= 4 ? 2 : 4
    return {
      groupCount: 1,
      groupSizes,
      qualifyPerGroup,
      bestSecondPlaces: 0,
      bestThirdPlaces: 0,
      targetKnockoutSize: Math.min(targetKnockoutSize, qualifyPerGroup),
      description:
        playerCount <= 4
          ? 'Grupo único: os 2 primeiros disputam a final.'
          : 'Grupo único: os 4 primeiros disputam as semifinais.',
    }
  }

  let qualifyPerGroup = defaultQualifyPerGroup(playerCount, groupSizes)
  let leaders = groupCount * qualifyPerGroup
  let bestSecondPlaces = Math.max(0, targetKnockoutSize - leaders)
  let bestThirdPlaces = 0

  if (playerCount >= 17 && bestSecondPlaces > groupCount) {
    const fromLeaders = groupCount
    const remaining = targetKnockoutSize - fromLeaders
    bestSecondPlaces = Math.min(groupCount, remaining)
    bestThirdPlaces = Math.max(0, remaining - bestSecondPlaces)
    qualifyPerGroup = 1
    leaders = groupCount
  }

  if (playerCount === 9 && groupCount === 3) {
    return {
      groupCount: 3,
      groupSizes,
      qualifyPerGroup: 1,
      bestSecondPlaces: 1,
      bestThirdPlaces: 0,
      targetKnockoutSize: 4,
      description: '3 grupos de 3: líderes + melhor 2º colocado → semifinal.',
    }
  }

  if (isFourGroupsOfThree(groupSizes)) {
    return fourGroupsOfThreeQualificationPlan(groupSizes)
  }

  if (playerCount === 16 && groupCount === 4) {
    return {
      groupCount: 4,
      groupSizes,
      qualifyPerGroup: 2,
      bestSecondPlaces: 0,
      bestThirdPlaces: 0,
      targetKnockoutSize: 8,
      description: '4 grupos de 4: 2 classificados por grupo → quartas.',
    }
  }

  if (playerCount === 24 && groupCount === 6) {
    return {
      groupCount: 6,
      groupSizes,
      qualifyPerGroup: 1,
      bestSecondPlaces: 10,
      bestThirdPlaces: 0,
      targetKnockoutSize: 16,
      description: '6 grupos de 4: líderes + 10 melhores 2º → oitavas.',
    }
  }

  const roundName =
    targetKnockoutSize <= 4
      ? 'semifinal'
      : targetKnockoutSize <= 8
        ? 'quartas de final'
        : 'oitavas de final'

  return {
    groupCount,
    groupSizes,
    qualifyPerGroup,
    bestSecondPlaces,
    bestThirdPlaces,
    targetKnockoutSize,
    description: `${groupCount} grupos (${groupSizes.join('-')}): ${qualifyPerGroup} por grupo${bestSecondPlaces > 0 ? ` + ${bestSecondPlaces} melhores 2º` : ''}${bestThirdPlaces > 0 ? ` + ${bestThirdPlaces} melhores 3º` : ''} → ${roundName}.`,
  }
}
