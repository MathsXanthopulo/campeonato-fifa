import { getKnockoutRoundLabel } from './tournament-format/knockout'
import { Match, Player } from './types'

export const MIN_PLAYERS_TO_START = 2

/** Próxima potência de 2 >= n (mínimo 2). */
export function getBracketSize(playerCount: number): number {
  if (playerCount <= 1) return 2
  let size = 2
  while (size < playerCount) size *= 2
  return size
}

export function getTotalRounds(playerCount: number): number {
  const size = getBracketSize(Math.max(playerCount, 0))
  return Math.log2(size)
}

export function getRoundLabel(round: number, totalRounds: number): string {
  if (round === totalRounds) return 'Final'
  if (totalRounds === 2) return 'Semifinal'
  if (round === totalRounds - 1) return 'Semifinal'
  if (round === totalRounds - 2 && totalRounds >= 4) return 'Quartas'
  if (round === 1) return 'Rodada 1'
  return `Rodada ${round}`
}

export function getRoundLabelShort(round: number, totalRounds: number): string {
  if (round === totalRounds) return 'Final'
  if (round === totalRounds - 1) return 'Semi'
  if (round === totalRounds - 2 && totalRounds >= 4) return 'Quartas'
  return `R${round}`
}

function shufflePlayers(players: Player[]): Player[] {
  const shuffled = [...players]
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export function isPreliminaryMatch(match: Match): boolean {
  return match.id.startsWith('ko-prelim-')
}

export function isKnockoutByeMatch(match: Match): boolean {
  return (
    match.phase === 'knockout' &&
    ((Boolean(match.player1Id) && !match.player2Id) ||
      (!match.player1Id && Boolean(match.player2Id)))
  )
}

/**
 * Gera chaveamento mata-mata 1v1 para qualquer quantidade de jogadores.
 * Completa com byes até a próxima potência de 2.
 */
export function generateBracket(players: Player[], shuffle = false): Match[] {
  const now = new Date().toISOString()
  const ordered = shuffle ? shufflePlayers(players) : [...players]
  const count = ordered.length

  if (count === 0) {
    return buildEmptyBracketStructure(2, now)
  }

  if (count === 1) {
    return []
  }

  const bracketSize = getBracketSize(count)
  const totalRounds = Math.log2(bracketSize)
  const matches: Match[] = []

  for (let round = 1; round <= totalRounds; round += 1) {
    const matchCount = bracketSize / Math.pow(2, round)
    for (let position = 0; position < matchCount; position += 1) {
      matches.push({
        id: `r${round}-${position}`,
        player1Id: null,
        player2Id: null,
        score1: null,
        score2: null,
        wentToPenalties: false,
        penaltyScore1: null,
        penaltyScore2: null,
        winnerId: null,
        round,
        position,
        status: 'pending',
        createdAt: now,
      })
    }
  }

  const seeds: (string | null)[] = ordered.map((p) => p.id)
  while (seeds.length < bracketSize) {
    seeds.push(null)
  }

  const round1Count = bracketSize / 2
  for (let i = 0; i < round1Count; i += 1) {
    const match = matches.find((m) => m.round === 1 && m.position === i)
    if (match) {
      match.player1Id = seeds[i * 2] ?? null
      match.player2Id = seeds[i * 2 + 1] ?? null
    }
  }

  return matches
}

function buildEmptyBracketStructure(bracketSize: number, createdAt: string): Match[] {
  const totalRounds = Math.log2(bracketSize)
  const matches: Match[] = []

  for (let round = 1; round <= totalRounds; round += 1) {
    const matchCount = bracketSize / Math.pow(2, round)
    for (let position = 0; position < matchCount; position += 1) {
      matches.push({
        id: `r${round}-${position}`,
        player1Id: null,
        player2Id: null,
        score1: null,
        score2: null,
        wentToPenalties: false,
        penaltyScore1: null,
        penaltyScore2: null,
        winnerId: null,
        round,
        position,
        status: 'pending',
        createdAt,
      })
    }
  }

  return matches
}

export function getMaxRound(matches: Match[]): number {
  const main = matches.filter((m) => !isPreliminaryMatch(m) && m.round >= 1)
  if (main.length === 0) return 0
  return Math.max(...main.map((m) => m.round))
}

export function splitKnockoutMatches(matches: Match[]) {
  const preliminary = matches
    .filter((m) => isPreliminaryMatch(m))
    .sort((a, b) => a.position - b.position)
  const main = matches
    .filter((m) => m.phase === 'knockout' && !isPreliminaryMatch(m))
    .sort((a, b) => {
      if (a.round !== b.round) return a.round - b.round
      return a.position - b.position
    })
  return { preliminary, main }
}

export interface KnockoutPanelSection {
  key: string
  title: string
  matches: Match[]
}

/** Mesma ordem e agrupamento do componente de chaveamento (preliminar → rodadas). */
export function buildKnockoutPanelSections(knockoutMatches: Match[]): KnockoutPanelSection[] {
  const { preliminary, main } = splitKnockoutMatches(knockoutMatches)
  const totalRounds = getMaxRound(main)
  const sections: KnockoutPanelSection[] = []

  if (preliminary.length > 0) {
    sections.push({
      key: 'preliminary',
      title: getKnockoutRoundLabel('preliminary'),
      matches: preliminary,
    })
  }

  for (let round = 1; round <= totalRounds; round += 1) {
    const roundMatches = main
      .filter((match) => match.round === round)
      .sort((a, b) => a.position - b.position)

    if (roundMatches.length === 0) continue

    sections.push({
      key: `round-${round}`,
      title: getRoundLabel(round, totalRounds),
      matches: roundMatches,
    })
  }

  return sections
}
