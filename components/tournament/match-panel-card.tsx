'use client'

import { Match, Player } from '@/lib/types'
import { cn } from '@/lib/utils'
import { MatchResultDialog } from '@/components/tournament/match-result-dialog'
import { MatchStatusBadge } from '@/components/tournament/match-status-badge'
import { Crown } from 'lucide-react'

function getScoreDisplay(match: Match) {
  if (match.score1 === null || match.score2 === null) {
    return { main: '—', sub: null }
  }

  if (match.wentToPenalties && match.penaltyScore1 !== null && match.penaltyScore2 !== null) {
    return {
      main: `${match.score1} × ${match.score2}`,
      sub: `Pên. ${match.penaltyScore1} × ${match.penaltyScore2}`,
    }
  }

  return { main: `${match.score1} × ${match.score2}`, sub: null }
}

interface MatchPanelCardProps {
  match: Match
  player1?: Player
  player2?: Player
  onSave: (matchId: string, updates: Partial<Match>) => void
}

export function MatchPanelCard({ match, player1, player2, onSave }: MatchPanelCardProps) {
  const score = getScoreDisplay(match)
  const isCompleted = match.status === 'completed'
  const p1Wins = isCompleted && match.winnerId === player1?.id
  const p2Wins = isCompleted && match.winnerId === player2?.id
  const isDraw = isCompleted && !match.winnerId && match.score1 !== null && match.score2 !== null
  const missingPlayers = !player1 || !player2

  return (
    <article
      className={cn(
        'relative overflow-hidden rounded-2xl border bg-black/50 transition-all',
        isCompleted
          ? 'border-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.08)]'
          : 'border-[#5d4720]/60 hover:border-[#b8933b]/50',
        missingPlayers && 'opacity-60'
      )}
    >
      <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-[#f7d37f] via-[#d8a844] to-[#6c4d15]" />

      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <MatchStatusBadge status={match.status} />
          {match.phase === 'groups' && (
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Grupos
            </span>
          )}
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <PlayerSide player={player1} label="Jogador 1" isWinner={p1Wins} align="left" />

          <div className="flex flex-col items-center justify-center min-w-[72px] px-2">
            <span
              className={cn(
                'text-2xl font-bold tabular-nums',
                isCompleted ? 'text-[#f7d37f]' : 'text-muted-foreground'
              )}
            >
              {score.main}
            </span>
            {score.sub && (
              <span className="text-[10px] text-muted-foreground mt-0.5">{score.sub}</span>
            )}
            {isDraw && (
              <span className="text-[10px] text-amber-400/90 mt-1 font-medium">Empate</span>
            )}
          </div>

          <PlayerSide player={player2} label="Jogador 2" isWinner={p2Wins} align="right" />
        </div>

        {missingPlayers && (
          <p className="text-xs text-center text-amber-500/90">
            Aguardando definição dos dois jogadores na chave
          </p>
        )}

        <MatchResultDialog match={match} player1={player1} player2={player2} onSave={onSave} />
      </div>
    </article>
  )
}

function PlayerSide({
  player,
  label,
  isWinner,
  align,
}: {
  player?: Player
  label: string
  isWinner: boolean
  align: 'left' | 'right'
}) {
  return (
    <div className={cn('min-w-0', align === 'right' && 'text-right')}>
      <div className={cn('flex items-center gap-2', align === 'right' && 'flex-row-reverse')}>
        <div
          className={cn(
            'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold',
            'bg-gradient-to-br from-[#f4d588] to-[#7a5619] text-black',
            isWinner && 'ring-2 ring-[#f4d588] ring-offset-2 ring-offset-black'
          )}
        >
          {(player?.team || player?.name || '?').charAt(0).toUpperCase()}
        </div>
        {isWinner && <Crown className="w-4 h-4 text-[#f4d588] flex-shrink-0" />}
      </div>
      <p
        className={cn(
          'mt-2 font-semibold truncate text-sm',
          isWinner && 'text-[#f4d588]',
          !player && 'text-muted-foreground italic'
        )}
      >
        {player?.name || 'A definir'}
      </p>
      {player?.team && <p className="text-xs text-muted-foreground truncate">{player.team}</p>}
      {!player && <p className="text-[10px] text-muted-foreground">{label}</p>}
    </div>
  )
}
