"use client"

import { Player, Match, Tournament, TournamentState } from './types'

const STORAGE_KEY = 'fc-tournament-data'
export const MAX_PLAYERS = 14

const defaultTournament: Tournament = {
  id: '1',
  name: 'Champions Tito',
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

// 14 players = 2 byes in round 1, then 8 players in round 2, 4 in semifinals, 2 in finals
function generateBracket(players: Player[]): Match[] {
  const matches: Match[] = []
  
  // Round 1: 6 matches (12 players play, 2 get byes)
  // Positions 0-5 are round 1 matches
  const round1Matchups = [
    [0, 13], // 1 vs 14
    [1, 12], // 2 vs 13
    [2, 11], // 3 vs 12
    [3, 10], // 4 vs 11
    [4, 9],  // 5 vs 10
    [5, 8],  // 6 vs 9
  ]
  
  round1Matchups.forEach(([p1, p2], index) => {
    matches.push({
      id: `r1-${index}`,
      player1Id: players[p1]?.id || null,
      player2Id: players[p2]?.id || null,
      score1: null,
      score2: null,
      wentToPenalties: false,
      penaltyScore1: null,
      penaltyScore2: null,
      winnerId: null,
      round: 1,
      position: index,
      status: 'pending',
      createdAt: new Date().toISOString(),
    })
  })
  
  // Round 2 (Quarterfinals): 4 matches
  // 2 players with byes (7 and 8) + 6 winners from round 1
  for (let i = 0; i < 4; i++) {
    matches.push({
      id: `r2-${i}`,
      player1Id: i === 0 ? players[6]?.id : null, // Player 7 gets bye
      player2Id: i === 3 ? players[7]?.id : null, // Player 8 gets bye
      score1: null,
      score2: null,
      wentToPenalties: false,
      penaltyScore1: null,
      penaltyScore2: null,
      winnerId: null,
      round: 2,
      position: i,
      status: 'pending',
      createdAt: new Date().toISOString(),
    })
  }
  
  // Semifinals: 2 matches
  for (let i = 0; i < 2; i++) {
    matches.push({
      id: `r3-${i}`,
      player1Id: null,
      player2Id: null,
      score1: null,
      score2: null,
      wentToPenalties: false,
      penaltyScore1: null,
      penaltyScore2: null,
      winnerId: null,
      round: 3,
      position: i,
      status: 'pending',
      createdAt: new Date().toISOString(),
    })
  }
  
  // Finals: 1 match
  matches.push({
    id: 'r4-0',
    player1Id: null,
    player2Id: null,
    score1: null,
    score2: null,
    wentToPenalties: false,
    penaltyScore1: null,
    penaltyScore2: null,
    winnerId: null,
    round: 4,
    position: 0,
    status: 'pending',
    createdAt: new Date().toISOString(),
  })
  
  return matches
}

function shufflePlayers(players: Player[]): Player[] {
  const shuffledPlayers = [...players]

  for (let index = shuffledPlayers.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    ;[shuffledPlayers[index], shuffledPlayers[randomIndex]] = [shuffledPlayers[randomIndex], shuffledPlayers[index]]
  }

  return shuffledPlayers
}

function hasDrawnMatches(matches: Match[]): boolean {
  return matches.some((match) => match.player1Id || match.player2Id)
}

function createInitialState(): TournamentState {
  return {
    tournament: defaultTournament,
    players: defaultPlayers,
    matches: generateBracket(defaultPlayers),
  }
}

function normalizeState(state: TournamentState): TournamentState {
  return {
    ...state,
    players: state.players.map((player) => ({
      ...player,
      team: player.team ?? '',
    })),
    matches: state.matches.map((match) => ({
      ...match,
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

      return parsedState
    } catch {
      // Invalid stored data, return default
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

export function updateMatch(state: TournamentState, matchId: string, updates: Partial<Match>): TournamentState {
  const newMatches = state.matches.map(m => 
    m.id === matchId ? { ...m, ...updates } : m
  )
  
  // If match is completed, advance winner to next round
  const updatedMatch = newMatches.find(m => m.id === matchId)
  if (updatedMatch && updates.winnerId && updatedMatch.status === 'completed') {
    const { round, position } = updatedMatch
    
    if (round < 4) {
      const nextRound = round + 1
      let nextPosition: number
      let isPlayer1: boolean
      
      if (round === 1) {
        // Round 1 winners go to round 2
        // Match 0,1 -> R2 pos 0 (but pos 0 has bye player already)
        // Match 2,3 -> R2 pos 1
        // Match 4,5 -> R2 pos 2
        // Actually need proper mapping
        if (position === 0) { nextPosition = 0; isPlayer1 = false }
        else if (position === 1) { nextPosition = 1; isPlayer1 = true }
        else if (position === 2) { nextPosition = 1; isPlayer1 = false }
        else if (position === 3) { nextPosition = 2; isPlayer1 = true }
        else if (position === 4) { nextPosition = 2; isPlayer1 = false }
        else { nextPosition = 3; isPlayer1 = true }
      } else {
        nextPosition = Math.floor(position / 2)
        isPlayer1 = position % 2 === 0
      }
      
      const nextMatchIndex = newMatches.findIndex(
        m => m.round === nextRound && m.position === nextPosition
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
    
    // If finals completed, set champion
    if (round === 4 && updates.winnerId) {
      const newState = {
        ...state,
        tournament: {
          ...state.tournament,
          championId: updates.winnerId,
          status: 'completed' as const,
          liveMatchId: state.tournament.liveMatchId === matchId ? null : state.tournament.liveMatchId,
        },
        matches: newMatches,
      }
      saveState(newState)
      return newState
    }
  }
  
  const newState = {
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
  saveState(newState)
  return newState
}

export function setLiveMatch(state: TournamentState, matchId: string | null): TournamentState {
  // Set previous live match to pending if exists
  const newMatches = state.matches.map(m => ({
    ...m,
    status: m.id === matchId ? 'live' as const : 
            (m.status === 'live' ? 'pending' as const : m.status)
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
  if (state.players.length >= MAX_PLAYERS) {
    return state
  }

  const newPlayer: Player = {
    ...player,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  }
  
  const newState = {
    ...state,
    players: [...state.players, newPlayer],
  }
  saveState(newState)
  return newState
}

export function updatePlayer(state: TournamentState, playerId: string, updates: Partial<Player>): TournamentState {
  const newState = {
    ...state,
    players: state.players.map(p => 
      p.id === playerId ? { ...p, ...updates } : p
    ),
  }
  saveState(newState)
  return newState
}

export function deletePlayer(state: TournamentState, playerId: string): TournamentState {
  const newState = {
    ...state,
    players: state.players.filter(p => p.id !== playerId),
  }
  saveState(newState)
  return newState
}

export function resetTournament(state: TournamentState): TournamentState {
  const newState = {
    tournament: {
      ...state.tournament,
      championId: null,
      status: 'setup' as const,
      liveMatchId: null,
    },
    players: state.players,
    matches: generateBracket(state.players),
  }
  saveState(newState)
  return newState
}

export function drawBracket(state: TournamentState): TournamentState {
  if (state.tournament.status !== 'setup' || state.players.length < 2) {
    return state
  }

  const shuffledPlayers = shufflePlayers(state.players)

  const newState = {
    ...state,
    tournament: {
      ...state.tournament,
      championId: null,
      liveMatchId: null,
    },
    matches: generateBracket(shuffledPlayers),
  }

  saveState(newState)
  return newState
}

export function startTournament(state: TournamentState): TournamentState {
  if (state.players.length < 2) {
    return state
  }

  const newState = {
    ...state,
    tournament: {
      ...state.tournament,
      status: 'active' as const,
    },
    matches: hasDrawnMatches(state.matches) ? state.matches : generateBracket(state.players),
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
      status: playerId ? 'completed' as const : state.tournament.status,
    },
  }
  saveState(newState)
  return newState
}
