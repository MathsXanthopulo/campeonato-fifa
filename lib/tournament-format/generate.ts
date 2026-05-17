import { generateGroups } from './groups'
import { buildKnockoutFromQualified, generateKnockoutSection } from './knockout'
import {
  GenerateFormatInput,
  TournamentFormatResult,
  TournamentMode,
} from './types'

export function generateTournamentFormat(
  input: GenerateFormatInput
): TournamentFormatResult {
  const { players, mode, shuffle = true } = input
  const playerCount = players.length

  if (playerCount < 2) {
    return emptyFormat(mode, playerCount)
  }

  if (mode === 'knockout') {
    const knockout = generateKnockoutSection(players, { shuffle })
    return {
      mode,
      playerCount,
      groups: [],
      qualified: [],
      qualification: null,
      knockout,
    }
  }

  const { groups, qualification } = generateGroups(players, shuffle)
  const entryRound =
    qualification.targetKnockoutSize <= 4
      ? 'semi_finals'
      : qualification.targetKnockoutSize <= 8
        ? 'quarter_finals'
        : 'round_of_16'

  return {
    mode,
    playerCount,
    groups,
    qualified: [],
    qualification,
    knockout: {
      round: entryRound,
      bracketSize: qualification.targetKnockoutSize,
      totalRounds: Math.log2(qualification.targetKnockoutSize),
      preliminaryMatches: [],
      matches: [],
    },
  }
}

function emptyFormat(mode: TournamentMode, playerCount: number): TournamentFormatResult {
  return {
    mode,
    playerCount,
    groups: [],
    qualified: [],
    qualification: null,
    knockout: {
      round: 'final',
      bracketSize: 2,
      totalRounds: 0,
      preliminaryMatches: [],
      matches: [],
    },
  }
}

/** Gera mata-mata a partir dos classificados da fase de grupos. */
export function generateKnockoutFromGroups(
  qualifiedIds: string[],
  shuffle = true
): TournamentFormatResult['knockout'] {
  return buildKnockoutFromQualified(qualifiedIds, shuffle)
}
