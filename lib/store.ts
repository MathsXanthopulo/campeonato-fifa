"use client"

import { formatToAppState, generateTournamentFormat } from './tournament-format'
import { buildQualificationPlan } from './tournament-format/group-plan'
import { buildKnockoutFromGroupQualification } from './tournament-format/knockout'
import {
  areGroupMatchesComplete,
  computeQualificationResult,
} from './tournament-format/standings'
import { Player, Match, Tournament, TournamentState, TournamentMode } from './types'

const STORAGE_KEY = 'fc-tournament-data'

const defaultTournament: Tournament = {
  id: '1',
  name: 'Champions Tito',
  mode: 'knockout',
  phase: 'setup',
  championId: null,
  status: 'setup',
  liveMatchId: null,
  createdAt: new Date().toISOString(),
}

const legacyDemoPlayers = [
  'CR7',
  'Messi',
  'Neymar',
  'Mbappé',
  'Haaland',
  'Vini Jr',
  'Bellingham',
  'De Bruyne',
  'Salah',
  'Kane',
  'Modric',
  'Lewandowski',
  'Son',
  'Rodri',
]

const defaultPlayers: Player[] = []

function hasDrawnMatches(matches: Match[]): boolean {
  return matches.some((match) => match.player1Id || match.player2Id)
}

function buildMatchesForState(players: Player[], mode: TournamentMode, shuffle = false) {
  const format = generateTournamentFormat({ players, mode, shuffle })
  return formatToAppState(format)
}

function createInitialState(): TournamentState {
  const { groups, matches } = buildMatchesForState(defaultPlayers, defaultTournament.mode)
  return {
    tournament: defaultTournament,
    players: defaultPlayers,
    groups,
    matches,
  }
}

function normalizeState(state: TournamentState): TournamentState {
  const mode = state.tournament.mode ?? 'knockout'
  const phase =
    state.tournament.phase ??
    (state.tournament.status === 'completed'
      ? 'completed'
      : state.groups.length > 0 && state.matches.some((m) => m.phase === 'groups')
        ? 'groups'
        : 'knockout')

  return {
    ...state,
    tournament: {
      ...state.tournament,
      mode,
      phase,
    },
    players: state.players.map((player) => ({
      ...player,
      team: player.team ?? '',
    })),
    groups: state.groups ?? [],
    matches: state.matches.map((match) => ({
      ...match,
      phase: match.phase ?? 'knockout',
      groupId: match.groupId ?? null,
      wentToPenalties: match.wentToPenalties ?? false,
      penaltyScore1: match.penaltyScore1 ?? null,
      penaltyScore2: match.penaltyScore2 ?? null,
    })),
  }
}

function isLegacyDemoState(state: TournamentState): boolean {
  return (
    state.tournament.status === 'setup' &&
    !state.tournament.championId &&
    !state.tournament.liveMatchId &&
    state.players.length === legacyDemoPlayers.length &&
    state.players.every((player, index) => player.name === legacyDemoPlayers[index])
  )
}

function isPreliminaryKnockoutMatch(match: Match): boolean {
  return match.phase === 'knockout' && match.id.startsWith('ko-prelim-')
}

function getMaxKnockoutRound(matches: Match[]): number {
  const knockout = matches.filter(
    (m) => m.phase === 'knockout' && !isPreliminaryKnockoutMatch(m) && m.round >= 1
  )
  if (knockout.length === 0) return 0
  return Math.max(...knockout.map((m) => m.round))
}

function getPrelimFeedPosition(targetSize: number, playInCount: number, prelimIndex: number): number {
  const firstRoundMatches = targetSize / 2
  return firstRoundMatches - playInCount + prelimIndex
}

function advancePreliminaryWinner(
  matches: Match[],
  prelimMatch: Match,
  winnerId: string
): void {
  const prelimIndex = Number.parseInt(prelimMatch.id.replace('ko-prelim-', ''), 10)
  if (Number.isNaN(prelimIndex)) return

  const knockoutRounds = matches.filter((m) => m.phase === 'knockout' && m.round >= 1)
  const bracketSize = knockoutRounds.filter((m) => m.round === 1).length * 2
  const playInCount = matches.filter((m) => m.id.startsWith('ko-prelim-')).length
  const feedPosition = getPrelimFeedPosition(bracketSize, playInCount, prelimIndex)
  const feedMatch = matches.find(
    (m) => m.phase === 'knockout' && m.round === 1 && m.position === feedPosition
  )

  if (!feedMatch) return

  if (!feedMatch.player1Id) {
    feedMatch.player1Id = winnerId
  } else if (!feedMatch.player2Id) {
    feedMatch.player2Id = winnerId
  }
}

export function getInitialState(): TournamentState {
  if (typeof window === 'undefined') {
    return createInitialState()
  }

  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    try {
      const parsedState = normalizeState(JSON.parse(stored) as TournamentState)

      if (isLegacyDemoState(parsedState)) {
        const freshState = createInitialState()
        localStorage.setItem(STORAGE_KEY, JSON.stringify(freshState))
        return freshState
      }

      const resolved = maybeAdvanceToKnockout(parsedState)
      if (resolved !== parsedState) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(resolved))
      }
      return resolved
    } catch {
      // Invalid stored data
    }
  }

  const state = createInitialState()
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  return state
}

export function saveState(state: TournamentState): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }
}

export function setTournamentMode(state: TournamentState, mode: TournamentMode): TournamentState {
  if (state.tournament.status !== 'setup') {
    return state
  }

  const { groups, matches } = buildMatchesForState(state.players, mode)

  const newState: TournamentState = {
    ...state,
    tournament: {
      ...state.tournament,
      mode,
      phase: 'setup',
      championId: null,
      liveMatchId: null,
    },
    groups,
    matches,
  }
  saveState(newState)
  return newState
}

export function updateMatch(state: TournamentState, matchId: string, updates: Partial<Match>): TournamentState {
  const newMatches = state.matches.map((m) => (m.id === matchId ? { ...m, ...updates } : m))

  const updatedMatch = newMatches.find((m) => m.id === matchId)

  if (updatedMatch && updates.winnerId && updatedMatch.status === 'completed') {
    if (updatedMatch.phase === 'knockout') {
      if (updatedMatch.id.startsWith('ko-prelim-')) {
        advancePreliminaryWinner(newMatches, updatedMatch, updates.winnerId)
      } else {
        const maxRound = getMaxKnockoutRound(newMatches)
        const { round, position } = updatedMatch

        if (round < maxRound) {
          const nextRound = round + 1
          const nextPosition = Math.floor(position / 2)
          const isPlayer1 = position % 2 === 0
          const nextMatchIndex = newMatches.findIndex(
            (m) =>
              m.phase === 'knockout' &&
              m.round === nextRound &&
              m.position === nextPosition &&
              !m.id.startsWith('ko-prelim-')
          )

          if (nextMatchIndex !== -1) {
            if (isPlayer1) {
              newMatches[nextMatchIndex] = {
                ...newMatches[nextMatchIndex],
                player1Id: updates.winnerId,
              }
            } else {
              newMatches[nextMatchIndex] = {
                ...newMatches[nextMatchIndex],
                player2Id: updates.winnerId,
              }
            }
          }
        }

        if (round === maxRound && updates.winnerId) {
          const newState: TournamentState = {
            ...state,
            tournament: {
              ...state.tournament,
              championId: updates.winnerId,
              status: 'completed',
              phase: 'completed',
              liveMatchId:
                state.tournament.liveMatchId === matchId ? null : state.tournament.liveMatchId,
            },
            matches: newMatches,
          }
          saveState(newState)
          return newState
        }
      }
    }
  }

  const newState: TournamentState = {
    ...state,
    tournament: {
      ...state.tournament,
      liveMatchId:
        updates.status === 'completed' && state.tournament.liveMatchId === matchId
          ? null
          : state.tournament.liveMatchId,
    },
    matches: newMatches,
  }

  const finalState = maybeAdvanceToKnockout(newState)
  saveState(finalState)
  return finalState
}

export function shouldAutoAdvanceToKnockout(state: TournamentState): boolean {
  return (
    state.tournament.mode === 'groups_knockout' &&
    state.tournament.phase === 'groups' &&
    state.groups.length > 0 &&
    areGroupMatchesComplete(state.groups, state.matches)
  )
}

function maybeAdvanceToKnockout(state: TournamentState): TournamentState {
  if (!shouldAutoAdvanceToKnockout(state)) {
    return state
  }
  return advanceToKnockout(state)
}

export function advanceToKnockout(state: TournamentState): TournamentState {
  if (state.tournament.mode !== 'groups_knockout') {
    return state
  }

  if (state.tournament.phase !== 'groups') {
    return state
  }

  if (!areGroupMatchesComplete(state.groups, state.matches)) {
    return state
  }

  const groupSizes = state.groups.map((group) => group.playerIds.length)
  const qualificationPlan = buildQualificationPlan(state.players.length, groupSizes)

  const qualification = computeQualificationResult(
    state.groups,
    state.matches,
    qualificationPlan
  )

  const knockoutFormat = buildKnockoutFromGroupQualification(
    qualification,
    qualificationPlan.targetKnockoutSize
  )

  const { matches: knockoutMatches } = formatToAppState({
    mode: 'knockout',
    playerCount: qualification.all.length,
    groups: [],
    qualified: qualification.all,
    qualification: qualificationPlan,
    knockout: knockoutFormat,
  })

  const groupMatches = state.matches.filter((m) => m.phase === 'groups')

  const newState: TournamentState = {
    ...state,
    tournament: {
      ...state.tournament,
      phase: 'knockout',
    },
    matches: [...groupMatches, ...knockoutMatches],
  }
  saveState(newState)
  return newState
}

export function setLiveMatch(state: TournamentState, matchId: string | null): TournamentState {
  const newMatches = state.matches.map((m) => ({
    ...m,
    status:
      m.id === matchId
        ? ('live' as const)
        : m.status === 'live'
          ? ('pending' as const)
          : m.status,
  }))

  const newState = {
    ...state,
    tournament: {
      ...state.tournament,
      liveMatchId: matchId,
    },
    matches: newMatches,
  }
  saveState(newState)
  return newState
}

export function addPlayer(state: TournamentState, player: Omit<Player, 'id' | 'createdAt'>): TournamentState {
  const newPlayer: Player = {
    ...player,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  }

  const newPlayers = [...state.players, newPlayer]
  const built =
    state.tournament.status === 'setup'
      ? buildMatchesForState(newPlayers, state.tournament.mode)
      : null

  const newState: TournamentState = {
    ...state,
    players: newPlayers,
    groups: built?.groups ?? state.groups,
    matches: built?.matches ?? state.matches,
  }
  saveState(newState)
  return newState
}

export function updatePlayer(state: TournamentState, playerId: string, updates: Partial<Player>): TournamentState {
  const newState = {
    ...state,
    players: state.players.map((p) => (p.id === playerId ? { ...p, ...updates } : p)),
  }
  saveState(newState)
  return newState
}

export function deletePlayer(state: TournamentState, playerId: string): TournamentState {
  const newPlayers = state.players.filter((p) => p.id !== playerId)
  const built =
    state.tournament.status === 'setup'
      ? buildMatchesForState(newPlayers, state.tournament.mode)
      : null

  const newState: TournamentState = {
    ...state,
    tournament: {
      ...state.tournament,
      championId: state.tournament.championId === playerId ? null : state.tournament.championId,
      liveMatchId: state.tournament.status === 'setup' ? null : state.tournament.liveMatchId,
    },
    players: newPlayers,
    groups: built?.groups ?? state.groups,
    matches: built?.matches ?? state.matches,
  }
  saveState(newState)
  return newState
}

/** Encerra o torneio atual e prepara um novo ciclo: mantém inscritos, zera placares e chave. */
export function resetTournament(state: TournamentState): TournamentState {
  if (state.players.length < 2) {
    return state
  }

  const { groups, matches } = buildMatchesForState(state.players, state.tournament.mode)

  const newState: TournamentState = {
    tournament: {
      ...state.tournament,
      championId: null,
      status: 'setup',
      phase: 'setup',
      liveMatchId: null,
    },
    players: state.players,
    groups,
    matches: matches.map((match) => ({
      ...match,
      score1: null,
      score2: null,
      wentToPenalties: false,
      penaltyScore1: null,
      penaltyScore2: null,
      winnerId: null,
      status: 'pending' as const,
    })),
  }
  saveState(newState)
  return newState
}

export function drawBracket(state: TournamentState): TournamentState {
  if (state.tournament.status !== 'setup' || state.players.length < 2) {
    return state
  }

  const { groups, matches } = buildMatchesForState(state.players, state.tournament.mode, true)

  const newState: TournamentState = {
    ...state,
    tournament: {
      ...state.tournament,
      championId: null,
      liveMatchId: null,
      phase: state.tournament.mode === 'groups_knockout' ? 'groups' : 'knockout',
    },
    groups,
    matches,
  }

  saveState(newState)
  return newState
}

export function startTournament(state: TournamentState): TournamentState {
  if (state.players.length < 2) {
    return state
  }

  const hasMatches = hasDrawnMatches(state.matches)
  const built = hasMatches ? null : buildMatchesForState(state.players, state.tournament.mode)

  const newState: TournamentState = {
    ...state,
    tournament: {
      ...state.tournament,
      status: 'active',
      phase:
        state.tournament.mode === 'groups_knockout' && !hasMatches
          ? 'groups'
          : state.tournament.mode === 'groups_knockout'
            ? 'groups'
            : 'knockout',
    },
    groups: built?.groups ?? state.groups,
    matches: built?.matches ?? state.matches,
  }
  saveState(newState)
  return newState
}

export function setChampion(state: TournamentState, playerId: string | null): TournamentState {
  const newState = {
    ...state,
    tournament: {
      ...state.tournament,
      championId: playerId,
      status: playerId ? ('completed' as const) : state.tournament.status,
      phase: playerId ? ('completed' as const) : state.tournament.phase,
    },
  }
  saveState(newState)
  return newState
}
