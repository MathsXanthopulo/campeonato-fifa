"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useTournament } from '@/lib/tournament-context'
import { Navigation } from '@/components/tournament/navigation'
import { Bracket } from '@/components/tournament/bracket'
import { Loading } from '@/components/tournament/loading'
import { Button } from '@/components/ui/button'
import { Shuffle, Trophy } from 'lucide-react'

export default function BracketPage() {
  const { state, isLoading, drawBracket } = useTournament()
  const [drawMessage, setDrawMessage] = useState('')
  
  if (isLoading || !state) {
    return (
      <main className="min-h-screen pb-20 md:pt-24">
        <Loading />
      </main>
    )
  }
  
  const { tournament, players, matches, groups } = state

  const isGroupsPhase =
    tournament.mode === 'groups_knockout' && tournament.phase === 'groups'
  const displayMatches = isGroupsPhase
    ? matches.filter((match) => match.phase === 'groups')
    : matches.filter((match) => match.phase === 'knockout')

  const completedMatches = displayMatches.filter((m) => m.status === 'completed').length
  const totalMatches = displayMatches.length
  const canDrawMatches = tournament.status === 'setup' && players.length >= 2

  const handleDrawBracket = () => {
    drawBracket()
    setDrawMessage('Confrontos sorteados com sucesso.')
  }
  
  return (
    <>
      <Navigation />
      <main className="min-h-screen pb-24 md:pt-24 md:pb-8">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center glow-purple">
                <Trophy className="w-6 h-6 text-foreground" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">Chaveamento</h1>
                <p className="text-muted-foreground">{tournament.name}</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-muted-foreground">
                {tournament.mode === 'groups_knockout'
                  ? isGroupsPhase
                    ? 'Sorteie os grupos antes de iniciar. O mata-mata sera gerado automaticamente quando todas as partidas de grupos forem finalizadas.'
                    : 'Mata-mata gerado automaticamente com base na classificacao dos grupos.'
                  : 'Sorteie os confrontos antes de iniciar o torneio.'}
              </p>

              <Button onClick={handleDrawBracket} disabled={!canDrawMatches}>
                <Shuffle className="w-4 h-4 mr-2" />
                {tournament.mode === 'groups_knockout' ? 'Sortear grupos' : 'Sortear confrontos'}
              </Button>
            </div>

            {drawMessage && (
              <div className="mt-4 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
                {drawMessage}
              </div>
            )}
            
            {/* Progress bar */}
            <div className="glass rounded-xl p-4 mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Progresso do Torneio</span>
                <span className="text-sm font-medium">{completedMatches}/{totalMatches} partidas</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-neon-blue to-neon-purple"
                  initial={{ width: 0 }}
                  animate={{ width: `${(completedMatches / totalMatches) * 100}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
            </div>
          </motion.div>
          
          {/* Bracket */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-xl p-4 overflow-hidden"
          >
            {isGroupsPhase && groups.length > 0 ? (
              <motion.div className="space-y-6">
                {groups.map((group) => {
                  const groupMatches = displayMatches.filter((m) => m.groupId === group.id)
                  return (
                    <motion.div key={group.id} className="rounded-xl border border-border/50 p-4">
                      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#b8933b]">
                        {group.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mb-3">
                        {group.playerIds.length} jogadores · {groupMatches.length} partidas (todos contra todos)
                      </p>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        {group.playerIds.map((id) => {
                          const player = players.find((p) => p.id === id)
                          return <li key={id}>{player?.name ?? 'Jogador'}</li>
                        })}
                      </ul>
                    </motion.div>
                  )
                })}
              </motion.div>
            ) : (
              <Bracket
                matches={displayMatches}
                players={players}
                liveMatchId={tournament.liveMatchId}
              />
            )}
          </motion.div>
          
          {/* Legend */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 flex flex-wrap items-center justify-center gap-6 text-sm"
          >
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gold" />
              <span className="text-muted-foreground">Vencedor</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-muted" />
              <span className="text-muted-foreground">Pendente</span>
            </div>
          </motion.div>
        </div>
      </main>
    </>
  )
}
