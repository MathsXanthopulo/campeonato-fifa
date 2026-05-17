'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useTournament } from '@/lib/tournament-context'
import { generateTournamentFormat } from '@/lib/tournament-format'
import {
  groupWinnersGetQuarterByes,
  rankGroup,
} from '@/lib/tournament-format/standings'
import { Navigation } from '@/components/tournament/navigation'
import { GroupStandingsTable } from '@/components/tournament/group-standings-table'
import { Loading } from '@/components/tournament/loading'
import { Button } from '@/components/ui/button'
import { LayoutGrid, Trophy } from 'lucide-react'

export default function GroupsPage() {
  const { state, isLoading, getPlayer } = useTournament()

  const formatMeta = useMemo(() => {
    if (!state || state.players.length < 2) return null
    return generateTournamentFormat({
      players: state.players,
      mode: 'groups_knockout',
      shuffle: false,
    }).qualification
  }, [state])

  if (isLoading || !state) {
    return (
      <main className="min-h-screen pb-20 md:pt-24">
        <Loading />
      </main>
    )
  }

  const { tournament, groups, matches } = state
  const hasGroups = groups.length > 0

  const estimatedQualified = formatMeta
    ? formatMeta.groupCount * formatMeta.qualifyPerGroup +
      formatMeta.bestSecondPlaces +
      formatMeta.bestThirdPlaces
    : 0

  const showQuarterByeHint =
    formatMeta &&
    groupWinnersGetQuarterByes(
      estimatedQualified,
      formatMeta.targetKnockoutSize,
      groups.length
    )

  return (
    <>
      <Navigation />
      <main className="min-h-screen pb-24 md:pt-24 md:pb-8">
        <div className="container mx-auto px-4 py-8 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-cyan to-neon-blue flex items-center justify-center">
                <LayoutGrid className="w-6 h-6 text-foreground" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">Classificação</h1>
                <p className="text-sm text-muted-foreground">
                  Tabelas dos grupos — atualizadas conforme os resultados
                </p>
              </div>
            </div>
          </motion.div>

          {!hasGroups && (
            <div className="glass rounded-xl p-8 text-center space-y-4">
              <p className="text-muted-foreground">
                {tournament.mode !== 'groups_knockout'
                  ? 'Selecione a modalidade Grupos + mata-mata na página inicial.'
                  : 'Cadastre jogadores e sorteie os grupos na página de chaveamento.'}
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <Link href="/">
                  <Button variant="outline">Ir para início</Button>
                </Link>
                {tournament.mode === 'groups_knockout' && (
                  <Link href="/bracket">
                    <Button>
                      <Trophy className="w-4 h-4 mr-2" />
                      Sortear grupos
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          )}

          {hasGroups && (
            <>
              {tournament.phase === 'knockout' && (
                <div className="glass rounded-xl px-4 py-3 text-sm border border-green-500/30 bg-green-500/5">
                  <p className="text-green-400 font-medium">Fase de grupos encerrada</p>
                  <p className="text-muted-foreground mt-1">
                    O mata-mata foi gerado automaticamente.{' '}
                    <Link href="/bracket" className="text-[#f4d588] hover:underline">
                      Ver chaveamento
                    </Link>
                  </p>
                </div>
              )}

              <motion.div className="glass rounded-xl px-4 py-3 text-sm text-muted-foreground space-y-1">
                {formatMeta?.description && (
                  <p className="text-[#f4d588] font-medium">{formatMeta.description}</p>
                )}
                <p>
                  <strong className="text-foreground">Pontuação:</strong> vitória 3 pts,
                  empate 1 pt para cada, derrota 0 pt.
                </p>
                <p>
                  <strong className="text-foreground">Desempate:</strong> saldo de gols (gols
                  marcados − gols sofridos).
                </p>
                {showQuarterByeHint && (
                  <p className="text-[#f4d588]">
                    Líderes de cada grupo (1º colocado) avançam direto às quartas de final
                    quando houver vagas por bye no mata-mata.
                  </p>
                )}
              </motion.div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {groups.map((group) => {
                  const groupMatches = matches.filter(
                    (m) => m.phase === 'groups' && m.groupId === group.id
                  )
                  const standings = rankGroup(group.playerIds, groupMatches)

                  return (
                    <motion.div
                      key={group.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <GroupStandingsTable
                        groupName={group.name}
                        standings={standings}
                        getPlayer={getPlayer}
                        highlightLeaderPrivilege={Boolean(showQuarterByeHint)}
                        qualifySlots={formatMeta?.qualifyPerGroup ?? 0}
                      />
                    </motion.div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </main>
    </>
  )
}
