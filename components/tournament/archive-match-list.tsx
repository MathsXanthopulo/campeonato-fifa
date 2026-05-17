'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Trophy } from 'lucide-react'
import { buildKnockoutPanelSections } from '@/lib/bracket'
import { formatArchiveDate, getTournamentModeLabel } from '@/lib/tournament-archive'
import { Match, Player, TournamentArchiveSummary, TournamentState } from '@/lib/types'
import { cn } from '@/lib/utils'

function playerLabel(players: Player[], id: string | null): string {
  if (!id) return 'A definir'
  const player = players.find((entry) => entry.id === id)
  if (!player) return 'A definir'
  return player.team ? `${player.name} (${player.team})` : player.name
}

function formatScore(match: Match): string {
  if (match.score1 === null || match.score2 === null) return '—'
  const base = `${match.score1} × ${match.score2}`
  if (match.wentToPenalties && match.penaltyScore1 !== null && match.penaltyScore2 !== null) {
    return `${base} (pên. ${match.penaltyScore1}-${match.penaltyScore2})`
  }
  return base
}

function MatchRows({
  title,
  matches,
  players,
}: {
  title: string
  matches: Match[]
  players: Player[]
}) {
  if (matches.length === 0) return null

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-[#b8933b]">{title}</h3>
      <motion.div className="space-y-2">
        {matches.map((match) => {
          const p1 = playerLabel(players, match.player1Id)
          const p2 = playerLabel(players, match.player2Id)
          const winner = match.winnerId ? playerLabel(players, match.winnerId) : null

          return (
            <motion.div
              key={match.id}
              className="rounded-xl border border-border/50 bg-black/40 px-4 py-3 text-sm"
            >
              <p className="font-medium">
                {p1} <span className="text-muted-foreground">vs</span> {p2}
              </p>
              <p className="mt-1 text-muted-foreground">
                Placar: <span className="text-foreground">{formatScore(match)}</span>
                {winner && (
                  <>
                    {' '}
                    · Vencedor: <span className="text-[#f4d588]">{winner}</span>
                  </>
                )}
              </p>
            </motion.div>
          )
        })}
      </motion.div>
    </section>
  )
}

export function ArchiveDetailView({
  archive,
}: {
  archive: {
    snapshot: TournamentState
    finishedAt: string
    mode: TournamentState['tournament']['mode']
    name: string
    championName: string
    championTeam: string
  }
}) {
  const { snapshot } = archive
  const players = snapshot.players
  const groupMatches = snapshot.matches
    .filter((m) => m.phase === 'groups')
    .sort((a, b) => a.position - b.position)
  const knockoutMatches = snapshot.matches.filter((m) => m.phase === 'knockout')
  const knockoutSections = buildKnockoutPanelSections(knockoutMatches)
  const champion = players.find((p) => p.id === snapshot.tournament.championId)

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div className="glass rounded-2xl p-6 border border-[#d8a844]/30">
        <p className="text-sm text-muted-foreground">{formatArchiveDate(archive.finishedAt)}</p>
        <h2 className="text-2xl font-bold mt-1">{archive.name}</h2>
        <p className="text-sm text-[#f4d588] mt-1">{getTournamentModeLabel(archive.mode)}</p>
        <div className="mt-4 flex items-center gap-3">
          <Trophy className="w-8 h-8 text-[#f4d588]" />
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Campeão</p>
            <p className="text-lg font-bold text-[#f4d588]">{champion?.name ?? archive.championName}</p>
            {(champion?.team || archive.championTeam) && (
              <p className="text-sm text-muted-foreground">{champion?.team ?? archive.championTeam}</p>
            )}
          </div>
        </div>
      </div>

      {groupMatches.length > 0 && (
        <MatchRows
          title="Fase de grupos"
          matches={groupMatches.filter((m) => m.status === 'completed')}
          players={players}
        />
      )}

      {knockoutSections.map((section) => (
        <MatchRows
          key={section.key}
          title={section.title}
          matches={section.matches.filter((m) => m.status === 'completed')}
          players={players}
        />
      ))}

      <p className="text-xs text-muted-foreground text-center">
        {players.length} jogadores ·{' '}
        {snapshot.matches.filter((m) => m.status === 'completed').length} partidas finalizadas
      </p>
    </motion.div>
  )
}

export function ArchiveSummaryCard({
  summary,
  className,
}: {
  summary: TournamentArchiveSummary
  className?: string
}) {
  return (
    <Link
      href={`/history/${summary.id}`}
      className={cn(
        'block glass rounded-xl p-5 border border-border/50 hover:border-[#d8a844]/40 transition-colors',
        className
      )}
    >
      <p className="text-xs text-muted-foreground">{formatArchiveDate(summary.finishedAt)}</p>
      <h3 className="font-bold text-lg mt-1">{summary.name}</h3>
      <p className="text-xs text-[#f4d588] mt-0.5">{getTournamentModeLabel(summary.mode)}</p>
      <div className="mt-3 flex items-center gap-2">
        <Trophy className="w-4 h-4 text-[#f4d588]" />
        <span className="text-sm">
          <span className="text-[#f4d588] font-medium">{summary.championName}</span>
          {summary.championTeam && (
            <span className="text-muted-foreground"> · {summary.championTeam}</span>
          )}
        </span>
      </div>
      <p className="text-xs text-muted-foreground mt-2">{summary.playerCount} jogadores</p>
    </Link>
  )
}
