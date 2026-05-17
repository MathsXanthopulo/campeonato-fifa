'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useTournament } from '@/lib/tournament-context'
import { Match } from '@/lib/types'
import { Loading } from '@/components/tournament/loading'
import { MatchPanelCard } from '@/components/tournament/match-panel-card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Home, List, Trophy } from 'lucide-react'
import { getMaxRound, getRoundLabel } from '@/lib/bracket'
import { getKnockoutRoundLabel } from '@/lib/tournament-format/knockout'

type MatchFilter = 'all' | 'pending' | 'completed'

function filterMatches(matches: Match[], filter: MatchFilter) {
  if (filter === 'pending') return matches.filter((m) => m.status !== 'completed')
  if (filter === 'completed') return matches.filter((m) => m.status === 'completed')
  return matches
}

function SectionProgress({ matches }: { matches: Match[] }) {
  const total = matches.length
  const done = matches.filter((m) => m.status === 'completed').length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{done} de {total} finalizadas</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-black/40">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#d8a844] to-[#f7d37f] transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function FilterTabs({
  value,
  onChange,
  counts,
}: {
  value: MatchFilter
  onChange: (v: MatchFilter) => void
  counts: { all: number; pending: number; completed: number }
}) {
  const tabs: { id: MatchFilter; label: string; count: number }[] = [
    { id: 'all', label: 'Todas', count: counts.all },
    { id: 'pending', label: 'Pendentes', count: counts.pending },
    { id: 'completed', label: 'Finalizadas', count: counts.completed },
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
            value === tab.id
              ? 'border-[#d8a844] bg-[#d8a844]/15 text-[#f7d37f]'
              : 'border-border/60 text-muted-foreground hover:border-[#b8933b]/50 hover:text-foreground'
          )}
        >
          {tab.label}
          <span className="ml-1.5 tabular-nums opacity-70">({tab.count})</span>
        </button>
      ))}
    </div>
  )
}

export default function MatchesPanelPage() {
  const { state, isLoading, getPlayer, updateMatch } = useTournament()
  const [filter, setFilter] = useState<MatchFilter>('all')

  const counts = useMemo(() => {
    if (!state) return { all: 0, pending: 0, completed: 0 }
    const all = state.matches.length
    const completed = state.matches.filter((m) => m.status === 'completed').length
    return { all, pending: all - completed, completed }
  }, [state])

  if (isLoading || !state) {
    return (
      <main className="min-h-screen pb-20">
        <Loading />
      </main>
    )
  }

  const { tournament, matches, groups } = state
  const groupMatches = matches.filter((match) => match.phase === 'groups')
  const knockoutMatches = matches.filter((match) => match.phase === 'knockout')
  const totalKnockoutRounds = getMaxRound(knockoutMatches)
  const liveMatches = matches.filter((match) => match.status === 'live').length
  const overallPct =
    matches.length > 0
      ? Math.round((counts.completed / matches.length) * 100)
      : 0

  const groupsPhaseComplete =
    tournament.mode === 'groups_knockout' &&
    tournament.phase === 'knockout' &&
    groups.length > 0

  const groupsInProgress =
    tournament.mode === 'groups_knockout' &&
    tournament.phase === 'groups' &&
    groups.length > 0

  const pendingGroupMatches = groupMatches.filter((m) => m.status !== 'completed').length

  const handleSaveMatchResult = (matchId: string, updates: Partial<Match>) => {
    updateMatch(matchId, updates)
  }

  return (
    <main className="min-h-screen pb-24 md:pb-8">
      <div className="container mx-auto px-4 py-8 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center">
              <List className="w-6 h-6 text-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Painel de Partidas</h1>
              <p className="text-sm text-muted-foreground">
                Lance placares e acompanhe o status de cada confronto.
              </p>
            </div>
          </div>

          <Link href="/">
            <Button variant="outline">
              <Home className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <div className="glass rounded-xl p-5">
            <p className="text-sm text-muted-foreground">Torneio</p>
            <p className="mt-2 text-lg font-semibold">
              {tournament.status === 'setup' && 'Em preparação'}
              {tournament.status === 'active' && 'Em andamento'}
              {tournament.status === 'completed' && 'Finalizado'}
            </p>
          </div>

          <div className="glass rounded-xl p-5 sm:col-span-2">
            <p className="text-sm text-muted-foreground">Progresso geral</p>
            <p className="mt-1 text-lg font-semibold tabular-nums">
              {counts.completed}/{counts.all} partidas
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/40">
              <div
                className="h-full rounded-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-500"
                style={{ width: `${overallPct}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{overallPct}% concluído</p>
          </div>

          <div className="glass rounded-xl p-5">
            <p className="text-sm text-muted-foreground">Ao vivo</p>
            <p className="mt-2 text-lg font-semibold tabular-nums">{liveMatches}</p>
          </div>
        </motion.section>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <FilterTabs value={filter} onChange={setFilter} counts={counts} />
        </motion.div>

        {groupsPhaseComplete && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-xl p-5 border border-green-500/30 bg-green-500/5"
          >
            <p className="font-semibold text-green-400">Mata-mata iniciado automaticamente</p>
            <p className="text-sm text-muted-foreground mt-1">
              Todas as partidas de grupos foram finalizadas. O chaveamento foi gerado com base na
              classificação.
            </p>
            <Link href="/bracket" className="inline-block mt-3">
              <Button size="sm" variant="outline">
                Ver chaveamento
              </Button>
            </Link>
          </motion.div>
        )}

        {groupsInProgress && pendingGroupMatches > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-xl p-5 border border-[#d8a844]/20"
          >
            <p className="font-semibold">Fase de grupos em andamento</p>
            <p className="text-sm text-muted-foreground mt-1">
              Faltam {pendingGroupMatches} partida{pendingGroupMatches === 1 ? '' : 's'} para
              iniciar o mata-mata automaticamente.
            </p>
          </motion.div>
        )}

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="space-y-8"
        >
          {groups.map((group) => {
            const roundMatches = filterMatches(
              groupMatches
                .filter((match) => match.groupId === group.id)
                .sort((a, b) => a.position - b.position),
              filter
            )

            if (roundMatches.length === 0) return null

            const allInGroup = groupMatches.filter((m) => m.groupId === group.id)

            return (
              <motion.section key={group.id} className="glass rounded-2xl p-6 space-y-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-neon-purple" />
                    <h2 className="text-lg font-bold">{group.name}</h2>
                  </div>
                  <div className="w-full sm:max-w-xs">
                    <SectionProgress matches={allInGroup} />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {roundMatches.map((match) => (
                    <MatchPanelCard
                      key={match.id}
                      match={match}
                      player1={getPlayer(match.player1Id)}
                      player2={getPlayer(match.player2Id)}
                      onSave={handleSaveMatchResult}
                    />
                  ))}
                </div>
              </motion.section>
            )
          })}

          {Array.from({ length: totalKnockoutRounds }, (_, index) => {
            const round = index + 1
            const allRoundMatches = knockoutMatches
              .filter((match) => match.round === round)
              .sort((a, b) => a.position - b.position)

            const roundMatches = filterMatches(allRoundMatches, filter)

            if (roundMatches.length === 0) return null

            const prelimCount = knockoutMatches.filter((m) => m.id.startsWith('ko-prelim-')).length
            const roundTitle =
              prelimCount > 0 && round === 1
                ? getKnockoutRoundLabel('preliminary')
                : getRoundLabel(round, totalKnockoutRounds)

            return (
              <motion.section key={`ko-${round}`} className="glass rounded-2xl p-6 space-y-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy
                      className={`w-5 h-5 ${round === totalKnockoutRounds ? 'text-gold' : 'text-neon-purple'}`}
                    />
                    <h2 className="text-lg font-bold">{roundTitle}</h2>
                  </div>
                  <div className="w-full sm:max-w-xs">
                    <SectionProgress matches={allRoundMatches} />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {roundMatches.map((match) => (
                    <MatchPanelCard
                      key={match.id}
                      match={match}
                      player1={getPlayer(match.player1Id)}
                      player2={getPlayer(match.player2Id)}
                      onSave={handleSaveMatchResult}
                    />
                  ))}
                </div>
              </motion.section>
            )
          })}
        </motion.section>

        {filter !== 'all' && counts[filter === 'pending' ? 'pending' : 'completed'] === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">
            Nenhuma partida neste filtro.
          </p>
        )}
      </div>
    </main>
  )
}
