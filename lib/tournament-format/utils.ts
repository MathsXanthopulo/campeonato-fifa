import { Player } from '../types'
import { FormatMatchPlayer } from './types'

export function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export function nextPowerOfTwo(n: number): number {
  if (n <= 1) return 2
  let size = 2
  while (size < n) size *= 2
  return size
}

export function toFormatPlayer(player: Player): FormatMatchPlayer {
  return {
    id: player.id,
    name: player.name,
    team: player.team,
  }
}

export function groupLetter(index: number): string {
  return String.fromCharCode(65 + index)
}

export function knockoutRoundKeyFromSize(bracketSize: number): import('./types').KnockoutRoundKey {
  if (bracketSize <= 2) return 'final'
  if (bracketSize <= 4) return 'semi_finals'
  if (bracketSize <= 8) return 'quarter_finals'
  if (bracketSize <= 16) return 'round_of_16'
  return 'round_of_32'
}

export function knockoutRoundKeyForRound(
  round: number,
  totalRounds: number
): import('./types').KnockoutRoundKey {
  const roundsFromEnd = totalRounds - round
  if (roundsFromEnd === 0) return 'final'
  if (roundsFromEnd === 1) return 'semi_finals'
  if (roundsFromEnd === 2) return 'quarter_finals'
  if (roundsFromEnd === 3) return 'round_of_16'
  if (roundsFromEnd === 4) return 'round_of_32'
  return 'round_1'
}
