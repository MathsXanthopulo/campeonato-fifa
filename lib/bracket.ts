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

/** Avança vencedores de bye e preenche slots da rodada seguinte (inclui cascata). */
function propagateByes(matches: Match[], totalRounds: number): void {
  for (let pass = 0; pass < totalRounds; pass += 1) {
    for (let round = 1; round < totalRounds; round += 1) {
      const roundMatches = matches
        .filter((m) => m.round === round)
        .sort((a, b) => a.position - b.position)

      for (const match of roundMatches) {
        let winnerId = match.winnerId

        if (!winnerId) {
          if (match.player1Id && !match.player2Id) winnerId = match.player1Id
          else if (match.player2Id && !match.player1Id) winnerId = match.player2Id
        }

        if (!winnerId) continue

        const isBye =
          (match.player1Id && !match.player2Id) || (!match.player1Id && match.player2Id)

        if (isBye) {
          match.winnerId = winnerId
          match.status = 'completed'
          match.score1 = match.player1Id ? 1 : 0
          match.score2 = match.player2Id ? 1 : 0
        }

        const nextRound = round + 1
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

  propagateByes(matches, totalRounds)

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
  if (matches.length === 0) return 0
  return Math.max(...matches.map((m) => m.round))
}
