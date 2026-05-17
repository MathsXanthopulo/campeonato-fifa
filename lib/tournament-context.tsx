"use client"

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react'
import { TournamentState, Player, Match, TournamentMode } from './types'
import * as store from './store'
import {
  fetchTournamentStateFromSupabase,
  persistTournamentStateToSupabase,
} from './tournament-repository'

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
  setTournamentMode: (mode: TournamentMode) => void
  advanceToKnockout: () => void
  setChampion: (playerId: string | null) => void
  getPlayer: (playerId: string | null) => Player | undefined
}

const TournamentContext = createContext<TournamentContextType | undefined>(undefined)

function hasMeaningfulState(state: TournamentState) {
  return (
    state.players.length > 0 ||
    state.tournament.status !== 'setup' ||
    Boolean(state.tournament.championId) ||
    Boolean(state.tournament.liveMatchId) ||
    state.matches.some(
      (match) =>
        Boolean(match.player1Id) ||
        Boolean(match.player2Id) ||
        Boolean(match.winnerId) ||
        match.score1 !== null ||
        match.score2 !== null
    )
  )
}

export function TournamentProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TournamentState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const syncQueueRef = useRef<Promise<void>>(Promise.resolve())

  const syncState = useCallback((nextState: TournamentState) => {
    syncQueueRef.current = syncQueueRef.current
      .catch(() => undefined)
      .then(() => persistTournamentStateToSupabase(nextState))
      .catch((error) => {
        console.error('Nao foi possivel sincronizar o torneio com o Supabase.', error)
      })
  }, [])

  useEffect(() => {
    let isMounted = true

    async function loadTournamentState() {
      const localState = store.getInitialState()

      try {
        const remoteState = await fetchTournamentStateFromSupabase()

        if (!isMounted) {
          return
        }

        if (!remoteState) {
          setState(localState)
          setIsLoading(false)
          return
        }

        const shouldPromoteLocalState = hasMeaningfulState(localState) && !hasMeaningfulState(remoteState)
        let initialState = shouldPromoteLocalState ? localState : remoteState

        if (store.shouldAutoAdvanceToKnockout(initialState)) {
          initialState = store.advanceToKnockout(initialState)
        }

        setState(initialState)
        store.saveState(initialState)
        setIsLoading(false)

        if (shouldPromoteLocalState) {
          syncState(initialState)
        }
      } catch (error) {
        console.error('Nao foi possivel carregar o torneio do Supabase.', error)

        if (!isMounted) {
          return
        }

        setState(localState)
        setIsLoading(false)
      }
    }

    void loadTournamentState()

    return () => {
      isMounted = false
    }
  }, [syncState])

  const applyStateUpdate = useCallback((updater: (currentState: TournamentState) => TournamentState) => {
    setState((previousState) => {
      if (!previousState) {
        return previousState
      }

      const nextState = updater(previousState)
      syncState(nextState)
      return nextState
    })
  }, [syncState])

  const updateMatch = useCallback((matchId: string, updates: Partial<Match>) => {
    applyStateUpdate((currentState) => store.updateMatch(currentState, matchId, updates))
  }, [applyStateUpdate])

  const setLiveMatch = useCallback((matchId: string | null) => {
    applyStateUpdate((currentState) => store.setLiveMatch(currentState, matchId))
  }, [applyStateUpdate])

  const addPlayer = useCallback((player: Omit<Player, 'id' | 'createdAt'>) => {
    applyStateUpdate((currentState) => store.addPlayer(currentState, player))
  }, [applyStateUpdate])

  const updatePlayer = useCallback((playerId: string, updates: Partial<Player>) => {
    applyStateUpdate((currentState) => store.updatePlayer(currentState, playerId, updates))
  }, [applyStateUpdate])

  const deletePlayer = useCallback((playerId: string) => {
    applyStateUpdate((currentState) => store.deletePlayer(currentState, playerId))
  }, [applyStateUpdate])

  const resetTournament = useCallback(() => {
    applyStateUpdate((currentState) => store.resetTournament(currentState))
  }, [applyStateUpdate])

  const drawBracket = useCallback(() => {
    applyStateUpdate((currentState) => store.drawBracket(currentState))
  }, [applyStateUpdate])

  const startTournament = useCallback(() => {
    applyStateUpdate((currentState) => store.startTournament(currentState))
  }, [applyStateUpdate])

  const setChampion = useCallback((playerId: string | null) => {
    applyStateUpdate((currentState) => store.setChampion(currentState, playerId))
  }, [applyStateUpdate])

  const setTournamentMode = useCallback((mode: TournamentMode) => {
    applyStateUpdate((currentState) => store.setTournamentMode(currentState, mode))
  }, [applyStateUpdate])

  const advanceToKnockout = useCallback(() => {
    applyStateUpdate((currentState) => store.advanceToKnockout(currentState))
  }, [applyStateUpdate])

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
        setTournamentMode,
        advanceToKnockout,
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
