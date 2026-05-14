"use client"

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { TournamentState, Player, Match } from './types'
import * as store from './store'

interface TournamentContextType {
  state: TournamentState | null
  isLoading: boolean
  updateMatch: (matchId: string, updates: Partial<Match>) => void
  setLiveMatch: (matchId: string | null) => void
  addPlayer: (player: Omit<Player, 'id' | 'createdAt'>) => void
  updatePlayer: (playerId: string, updates: Partial<Player>) => void
  deletePlayer: (playerId: string) => void
  resetTournament: () => void
  drawBracket: () => void
  startTournament: () => void
  setChampion: (playerId: string | null) => void
  getPlayer: (playerId: string | null) => Player | undefined
}

const TournamentContext = createContext<TournamentContextType | undefined>(undefined)

export function TournamentProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TournamentState | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setState(store.getInitialState())
    setIsLoading(false)
  }, [])

  const updateMatch = useCallback((matchId: string, updates: Partial<Match>) => {
    setState(prev => prev ? store.updateMatch(prev, matchId, updates) : prev)
  }, [])

  const setLiveMatch = useCallback((matchId: string | null) => {
    setState(prev => prev ? store.setLiveMatch(prev, matchId) : prev)
  }, [])

  const addPlayer = useCallback((player: Omit<Player, 'id' | 'createdAt'>) => {
    setState(prev => prev ? store.addPlayer(prev, player) : prev)
  }, [])

  const updatePlayer = useCallback((playerId: string, updates: Partial<Player>) => {
    setState(prev => prev ? store.updatePlayer(prev, playerId, updates) : prev)
  }, [])

  const deletePlayer = useCallback((playerId: string) => {
    setState(prev => prev ? store.deletePlayer(prev, playerId) : prev)
  }, [])

  const resetTournament = useCallback(() => {
    setState(prev => prev ? store.resetTournament(prev) : prev)
  }, [])

  const drawBracket = useCallback(() => {
    setState(prev => prev ? store.drawBracket(prev) : prev)
  }, [])

  const startTournament = useCallback(() => {
    setState(prev => prev ? store.startTournament(prev) : prev)
  }, [])

  const setChampion = useCallback((playerId: string | null) => {
    setState(prev => prev ? store.setChampion(prev, playerId) : prev)
  }, [])

  const getPlayer = useCallback((playerId: string | null) => {
    if (!playerId || !state) return undefined
    return state.players.find(p => p.id === playerId)
  }, [state])

  return (
    <TournamentContext.Provider
      value={{
        state,
        isLoading,
        updateMatch,
        setLiveMatch,
        addPlayer,
        updatePlayer,
        deletePlayer,
        resetTournament,
        drawBracket,
        startTournament,
        setChampion,
        getPlayer,
      }}
    >
      {children}
    </TournamentContext.Provider>
  )
}

export function useTournament() {
  const context = useContext(TournamentContext)
  if (context === undefined) {
    throw new Error('useTournament must be used within a TournamentProvider')
  }
  return context
}
