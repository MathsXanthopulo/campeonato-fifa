import { Player } from '../types'
import { FormatKnockout, FormatKnockoutMatch, KnockoutRoundKey } from './types'
import {
  knockoutRoundKeyForRound,
  knockoutRoundKeyFromSize,
  nextPowerOfTwo,
  shuffle,
} from './utils'

interface PreliminaryPlan {
  targetSize: number
  playInMatches: number
  playInPlayerIds: string[]
  byePlayerIds: string[]
}

function planPreliminary(playerIds: string[], targetSize: number): PreliminaryPlan {
  const surplus = playerIds.length - targetSize

  if (surplus <= 0) {
    return {
      targetSize,
      playInMatches: 0,
      playInPlayerIds: [],
      byePlayerIds: [...playerIds],
    }
  }

  const playInPlayerCount = surplus * 2
  const playInPlayerIds = playerIds.slice(-playInPlayerCount)
  const byePlayerIds = playerIds.slice(0, playerIds.length - playInPlayerCount)

  return {
    targetSize,
    playInMatches: surplus,
    playInPlayerIds,
    byePlayerIds,
  }
}

function buildKnockoutTree(
  bracketSize: number,
  roundOffset: number,
  seedIds: (string | null)[]
): FormatKnockoutMatch[] {
  const totalRounds = Math.log2(bracketSize)
  const matches: FormatKnockoutMatch[] = []

  for (let round = 1; round <= totalRounds; round += 1) {
    const matchCount = bracketSize / Math.pow(2, round)
    for (let position = 0; position < matchCount; position += 1) {
      const absoluteRound = round + roundOffset
      matches.push({
        id: `ko-r${absoluteRound}-${position}`,
        round: absoluteRound,
        position,
        roundKey: knockoutRoundKeyForRound(round, totalRounds),
        player1Id: null,
        player2Id: null,
        isBye: false,
        status: 'pending',
      })
    }
  }

  const round1Count = bracketSize / 2
  for (let i = 0; i < round1Count; i += 1) {
    const match = matches.find((m) => m.round === 1 + roundOffset && m.position === i)
    if (!match) continue
    match.player1Id = seedIds[i * 2] ?? null
    match.player2Id = seedIds[i * 2 + 1] ?? null
    match.isBye =
      (Boolean(match.player1Id) && !match.player2Id) ||
      (!match.player1Id && Boolean(match.player2Id))
    if (match.isBye) {
      match.status = 'completed'
    }
  }

  propagateByes(matches, totalRounds, roundOffset)

  return matches
}

function propagateByes(
  matches: FormatKnockoutMatch[],
  totalRounds: number,
  roundOffset: number
): void {
  for (let pass = 0; pass < totalRounds; pass += 1) {
    for (let round = 1; round < totalRounds; round += 1) {
      const absoluteRound = round + roundOffset
      const roundMatches = matches
        .filter((m) => m.round === absoluteRound)
        .sort((a, b) => a.position - b.position)

      for (const match of roundMatches) {
        let winnerId: string | null = null
        if (match.player1Id && !match.player2Id) winnerId = match.player1Id
        else if (match.player2Id && !match.player1Id) winnerId = match.player2Id
        if (!winnerId) continue

        const nextRound = absoluteRound + 1
        const nextPosition = Math.floor(match.position / 2)
        const isPlayer1 = match.position % 2 === 0
        const nextMatch = matches.find(
          (m) => m.round === nextRound && m.position === nextPosition
        )
        if (!nextMatch) continue

        if (isPlayer1) {
          if (!nextMatch.player1Id) nextMatch.player1Id = winnerId
        } else if (!nextMatch.player2Id) {
          nextMatch.player2Id = winnerId
        }
      }
    }
  }
}

export function generateKnockoutSection(
  players: Player[],
  options: {
    shuffle?: boolean
    targetSize?: number
    seedIds?: string[]
    roundOffset?: number
  } = {}
): FormatKnockout {
  const ordered = options.shuffle ? shuffle(players) : [...players]
  const playerIds =
    options.seedIds ?? ordered.map((player) => player.id)

  const targetSize = options.targetSize ?? estimateKnockoutTarget(players.length)
  const bracketSize = Math.max(targetSize, nextPowerOfTwo(players.length))
  const effectiveTarget = Math.min(bracketSize, Math.max(targetSize, 2))

  const plan = planPreliminary(playerIds, effectiveTarget)
  const preliminaryMatches: FormatKnockoutMatch[] = []

  for (let i = 0; i < plan.playInMatches; i += 1) {
    preliminaryMatches.push({
      id: `ko-prelim-${i}`,
      round: 0,
      position: i,
      roundKey: 'preliminary',
      player1Id: plan.playInPlayerIds[i * 2] ?? null,
      player2Id: plan.playInPlayerIds[i * 2 + 1] ?? null,
      isBye: false,
      status: 'pending',
    })
  }

  const seeds: (string | null)[] = plan.byePlayerIds.map((id) => id)
  while (seeds.length < effectiveTarget - plan.playInMatches) {
    seeds.push(null)
  }
  for (let i = 0; i < plan.playInMatches; i += 1) {
    seeds.push(null)
  }

  const mainMatches = buildKnockoutTree(
    effectiveTarget,
    options.roundOffset ?? 0,
    seeds.slice(0, effectiveTarget)
  )

  const firstMainRound = (options.roundOffset ?? 0) + 1
  const entryRoundKey = knockoutRoundKeyFromSize(effectiveTarget)

  return {
    round: preliminaryMatches.length > 0 ? 'preliminary' : entryRoundKey,
    bracketSize: effectiveTarget,
    totalRounds: Math.log2(effectiveTarget) + (preliminaryMatches.length > 0 ? 1 : 0),
    preliminaryMatches,
    matches: [...preliminaryMatches, ...mainMatches],
  }
}

export function estimateKnockoutTarget(playerCount: number): number {
  if (playerCount <= 4) return Math.max(2, nextPowerOfTwo(playerCount))
  if (playerCount <= 6) return 4
  if (playerCount <= 10) return 8
  if (playerCount <= 16) return 8
  if (playerCount <= 32) return 16
  return nextPowerOfTwo(playerCount)
}

export function buildKnockoutFromQualified(
  qualifiedIds: string[],
  shuffle = false,
  targetSize?: number
): FormatKnockout {
  const ids = shuffle ? shuffle(qualifiedIds) : [...qualifiedIds]
  const fakePlayers = ids.map((id) => ({
    id,
    name: id,
    team: '',
    avatar: '',
    overall: 80,
    createdAt: '',
  }))

  const bracketTarget = targetSize ?? nextPowerOfTwo(ids.length)

  return generateKnockoutSection(fakePlayers, {
    shuffle: false,
    targetSize: bracketTarget,
    seedIds: ids,
  })
}

/**
 * Monta o mata-mata a partir dos classificados.
 * Líderes de grupo vão primeiro na ordem de seeds → recebem bye/preliminar favorável.
 */
export function buildKnockoutFromGroupQualification(
  groupWinners: string[],
  otherQualified: string[],
  targetSize: number
): FormatKnockout {
  const seedIds = [...groupWinners, ...otherQualified]
  const fakePlayers = seedIds.map((id) => ({
    id,
    name: id,
    team: '',
    avatar: '',
    overall: 80,
    createdAt: '',
  }))

  return generateKnockoutSection(fakePlayers, {
    shuffle: false,
    targetSize,
    seedIds,
  })
}

export function getKnockoutRoundLabel(key: KnockoutRoundKey): string {
  const labels: Record<KnockoutRoundKey, string> = {
    final: 'Final',
    semi_finals: 'Semifinal',
    quarter_finals: 'Quartas de final',
    round_of_16: 'Oitavas de final',
    round_of_32: 'Rodada de 32',
    preliminary: 'Preliminar',
    round_1: 'Rodada 1',
  }
  return labels[key]
}
