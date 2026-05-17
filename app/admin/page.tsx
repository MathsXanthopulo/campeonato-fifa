'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useTournament } from '@/lib/tournament-context'
import { Match } from '@/lib/types'
import { Loading } from '@/components/tournament/loading'
import { MatchPanelCard } from '@/components/tournament/match-panel-card'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import { generateTournamentFormat } from '@/lib/tournament-format'
import { Home, List, RotateCcw, Shuffle, Trophy } from 'lucide-react'
import { buildKnockoutPanelSections } from '@/lib/bracket'

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
  const {
    state,
    isLoading,
    getPlayer,
    updateMatch,
    setTournamentMode,
    drawBracket,
    restartTournament,
  } = useTournament()
  const [filter, setFilter] = useState<MatchFilter>('all')
  const [adminMessage, setAdminMessage] = useState('')

  const counts = useMemo(() => {
    if (!state) return { all: 0, pending: 0, completed: 0 }
    const all = state.matches.length
    const completed = state.matches.filter((m) => m.status === 'completed').length
    return { all, pending: all - completed, completed }
  }, [state])

  const formatPreview = useMemo(() => {
    if (!state || state.players.length < 2) return null
    return generateTournamentFormat({
      players: state.players,
      mode: state.tournament.mode,
      shuffle: false,
    })
  }, [state])

  if (isLoading || !state) {
    return (
      <main className="min-h-screen pb-20">
        <Loading />
      </main>
    )
  }

  const { tournament, players, matches, groups } = state
  const groupMatches = matches.filter((match) => match.phase === 'groups')
  const knockoutMatches = matches.filter((match) => match.phase === 'knockout')
  const knockoutSections = buildKnockoutPanelSections(knockoutMatches)
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

  const canDrawBracket = tournament.status === 'setup' && players.length >= 2
  const hasTournamentProgress =
    tournament.status !== 'setup' ||
    matches.some(
      (match) =>
        match.status === 'completed' ||
        match.score1 !== null ||
        match.winnerId !== null
    )
  const canRestartTournament = players.length >= 2 && hasTournamentProgress

  const handleSaveMatchResult = (matchId: string, updates: Partial<Match>) => {
    updateMatch(matchId, updates)
  }

  const handleDrawBracket = () => {
    drawBracket()
    setAdminMessage(
      tournament.mode === 'groups_knockout'
        ? 'Grupos sorteados com sucesso.'
        : 'Chaveamento sorteado com sucesso.'
    )
  }

  const handleRestartTournament = () => {
    restartTournament()
    setAdminMessage(
      'Campeonato reiniciado. Inscritos mantidos — escolha a modalidade e sorteie a chave novamente.'
    )
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
              <h1 className="text-2xl font-bold">Painel do operador</h1>
              <p className="text-sm text-muted-foreground">
                Configure o campeonato, sorteie a chave e lance placares.
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

        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="glass rounded-xl p-6 space-y-5 border border-[#d8a844]/20"
        >
          <div>
            <h2 className="text-lg font-semibold">Configuração do campeonato</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Defina a modalidade e sorteie antes de liberar o público na chave.
            </p>
          </div>

          {tournament.status === 'setup' ? (
            <>
              <div className="space-y-2">
                <p className="text-sm font-medium">Modalidade</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={tournament.mode === 'knockout' ? 'default' : 'outline'}
                    onClick={() => setTournamentMode('knockout')}
                  >
                    Apenas mata-mata
                  </Button>
                  <Button
                    type="button"
                    variant={tournament.mode === 'groups_knockout' ? 'default' : 'outline'}
                    onClick={() => setTournamentMode('groups_knockout')}
                  >
                    Grupos + mata-mata
                  </Button>
                </div>
                {formatPreview && (
                  <p className="text-xs text-muted-foreground rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
                    {formatPreview.mode === 'knockout' ? (
                      <>
                        Mata-mata com {formatPreview.knockout.bracketSize} vagas
                        {formatPreview.knockout.preliminaryMatches.length > 0 &&
                          ` (${formatPreview.knockout.preliminaryMatches.length} preliminar(es))`}
                        .
                      </>
                    ) : (
                      formatPreview.qualification?.description ??
                      'Fase de grupos seguida de mata-mata.'
                    )}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2 border-t border-border/40">
                <p className="text-sm text-muted-foreground">
                  {players.length < 2
                    ? 'Cadastre pelo menos 2 jogadores na página inicial.'
                    : tournament.mode === 'groups_knockout'
                      ? 'Sorteia os grupos e gera as partidas da fase inicial.'
                      : 'Sorteia os confrontos do mata-mata.'}
                </p>
                <Button onClick={handleDrawBracket} disabled={!canDrawBracket} className="shrink-0">
                  <Shuffle className="w-4 h-4 mr-2" />
                  {tournament.mode === 'groups_knockout' ? 'Sortear grupos' : 'Sortear chave'}
                </Button>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Modalidade e sorteio só podem ser alterados com o torneio em preparação. Use
              &quot;Novo torneio&quot; abaixo para recomeçar.
            </p>
          )}

          {canRestartTournament && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2 border-t border-border/40">
              <div>
                <p className="text-sm font-medium">Recomeçar campeonato</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Mantém {players.length} inscritos e zera placares e chave.
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="shrink-0 border-amber-500/40">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Novo torneio
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Recomeçar o campeonato?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Os {players.length} jogadores cadastrados serão mantidos. Todos os
                      resultados e o chaveamento atual serão apagados.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRestartTournament}>
                      Sim, novo torneio
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}

          {adminMessage && (
            <p className="text-sm text-green-400 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2">
              {adminMessage}
            </p>
          )}
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
              classificação, evitando confrontos entre jogadores do mesmo grupo na 1ª rodada.
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
              Faltam {pendingGroupMatches} partida{pendingGroupMatches === 1 ? '' : 's'} em todos os
              grupos para gerar o mata-mata automaticamente (sem repetir adversários da fase de
              grupos na 1ª rodada).
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

          {knockoutSections.map((section, sectionIndex) => {
            const allSectionMatches = section.matches
            const sectionMatches = filterMatches(allSectionMatches, filter)

            if (sectionMatches.length === 0) return null

            const isFinalSection = sectionIndex === knockoutSections.length - 1

            return (
              <motion.section key={section.key} className="glass rounded-2xl p-6 space-y-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy
                      className={`w-5 h-5 ${isFinalSection ? 'text-gold' : 'text-neon-purple'}`}
                    />
                    <h2 className="text-lg font-bold">{section.title}</h2>
                  </div>
                  <div className="w-full sm:max-w-xs">
                    <SectionProgress matches={allSectionMatches} />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {sectionMatches.map((match) => (
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
