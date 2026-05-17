"use client"

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  getMaxRound,
  getRoundLabel,
  getRoundLabelShort,
  splitKnockoutMatches,
} from '@/lib/bracket'
import { getKnockoutRoundLabel } from '@/lib/tournament-format/knockout'
import { Match, Player } from '@/lib/types'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight, Trophy } from 'lucide-react'

type BracketSide = 'left' | 'right' | 'center'

interface BracketMatchProps {
  match: Match
  player1?: Player
  player2?: Player
  isLive?: boolean
  compact?: boolean
  side?: BracketSide
  isFinal?: boolean
}

function getBracketTitle(player?: Player) {
  return player?.team || player?.name || 'A definir'
}

function getBracketSubtitle(player?: Player) {
  if (!player) return undefined
  return player.team ? player.name : undefined
}

function BracketMatch({
  match,
  player1,
  player2,
  isLive,
  compact = false,
  side = 'left',
  isFinal = false,
}: BracketMatchProps) {
  const isCompleted = match.status === 'completed'
  const cardWidth = compact ? 'w-full' : 'w-[144px] lg:w-[152px] xl:w-[160px]'
  const accentPosition =
    side === 'right'
      ? 'right-0 bg-gradient-to-b from-[#f7d37f] via-[#d8a844] to-[#6c4d15]'
      : 'left-0 bg-gradient-to-b from-[#f7d37f] via-[#d8a844] to-[#6c4d15]'
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'relative overflow-hidden rounded-2xl border border-[#5d4720]/80 bg-black/75 shadow-[0_0_24px_rgba(240,191,85,0.08)]',
        isLive && 'border-red-500/70 shadow-[0_0_28px_rgba(239,68,68,0.15)]',
        isFinal && 'border-[#d8a844] shadow-[0_0_32px_rgba(240,191,85,0.18)]',
        cardWidth
      )}
    >
      <motion.div className={cn('absolute inset-y-0 w-1', accentPosition)} />
      <motion.div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(247,211,127,0.12),transparent_55%)]" />

      {isLive && (
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1 rounded-full bg-red-500/10 px-1.5 py-1">
          <motion.div 
            className="w-2 h-2 rounded-full bg-red-500"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
          <span className="text-[10px] font-bold text-red-400">LIVE</span>
        </div>
      )}
      
      <motion.div className={cn(
        'relative flex items-center gap-2 border-b border-[#2c2110] px-2.5 py-2',
        isCompleted && match.winnerId === player1?.id && 'bg-[#c6972c]/12'
      )}>
        <div className={cn(
          'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold',
          'bg-gradient-to-br from-[#f4d588] to-[#7a5619] text-black',
          isCompleted && match.winnerId === player1?.id && 'ring-2 ring-[#f4d588]'
        )}>
          {getBracketTitle(player1).charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <p className={cn(
            'truncate text-xs font-semibold text-white',
            isCompleted && match.winnerId === player1?.id && 'text-[#f4d588]',
            !player1 && 'italic text-muted-foreground'
          )}>
            {getBracketTitle(player1)}
          </p>
          {getBracketSubtitle(player1) && (
            <p className="hidden truncate text-[9px] text-muted-foreground xl:block">
              {getBracketSubtitle(player1)}
            </p>
          )}
        </div>
        <span className={cn(
          'min-w-[20px] text-center text-sm font-bold text-[#f7d37f]',
          isCompleted && match.winnerId === player1?.id && 'text-[#f4d588]'
        )}>
          {match.score1 ?? '-'}
        </span>
      </motion.div>
      
      <motion.div className={cn(
        'relative flex items-center gap-2 px-2.5 py-2',
        isCompleted && match.winnerId === player2?.id && 'bg-[#c6972c]/12'
      )}>
        <div className={cn(
          'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold',
          'bg-gradient-to-br from-[#f4d588] to-[#7a5619] text-black',
          isCompleted && match.winnerId === player2?.id && 'ring-2 ring-[#f4d588]'
        )}>
          {getBracketTitle(player2).charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <p className={cn(
            'truncate text-xs font-semibold text-white',
            isCompleted && match.winnerId === player2?.id && 'text-[#f4d588]',
            !player2 && 'italic text-muted-foreground'
          )}>
            {getBracketTitle(player2)}
          </p>
          {getBracketSubtitle(player2) && (
            <p className="hidden truncate text-[9px] text-muted-foreground xl:block">
              {getBracketSubtitle(player2)}
            </p>
          )}
        </div>
        <span className={cn(
          'min-w-[20px] text-center text-sm font-bold text-[#f7d37f]',
          isCompleted && match.winnerId === player2?.id && 'text-[#f4d588]'
        )}>
          {match.score2 ?? '-'}
        </span>
      </motion.div>
    </motion.div>
  )
}

interface BracketProps {
  matches: Match[]
  players: Player[]
  liveMatchId: string | null
}

function getRoundGapPx(round: number, totalRounds: number): number {
  const exponent = Math.max(0, totalRounds - round - 1)
  return Math.max(12, Math.pow(2, exponent) * 10)
}

export function Bracket({ matches, players, liveMatchId }: BracketProps) {
  const [activeRound, setActiveRound] = useState(1)
  const getPlayer = (id: string | null) => players.find(p => p.id === id)

  const { preliminary, main } = useMemo(() => splitKnockoutMatches(matches), [matches])
  const totalRounds = getMaxRound(main)

  const rounds = useMemo(() => {
    return Array.from({ length: totalRounds }, (_, index) => {
      const round = index + 1
      return main.filter((m) => m.round === round)
    })
  }, [main, totalRounds])

  const activeMatches = rounds[activeRound - 1] || []
  const isFinalRound = activeRound === totalRounds && totalRounds > 0

  const goToPrevRound = () => setActiveRound((r) => Math.max(1, r - 1))
  const goToNextRound = () => setActiveRound((r) => Math.min(totalRounds, r + 1))

  if (totalRounds === 0 && preliminary.length === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground py-12">
        Cadastre pelo menos 2 jogadores e sorteie os confrontos para ver a chave.
      </p>
    )
  }

  const renderPreliminaryColumn = (compact?: boolean) => {
    if (preliminary.length === 0) return null

    return (
      <motion.div className={cn('flex flex-col items-center', compact && 'mb-6')}>
        <h3 className="mb-3 text-center text-[9px] font-semibold uppercase tracking-[0.18em] text-[#b8933b]">
          {getKnockoutRoundLabel('preliminary')}
        </h3>
        <div className="flex flex-col gap-3">
          {preliminary.map((match) => (
            <BracketMatch
              key={match.id}
              match={match}
              player1={getPlayer(match.player1Id)}
              player2={getPlayer(match.player2Id)}
              isLive={match.id === liveMatchId}
              compact={compact}
              side="left"
            />
          ))}
        </div>
      </motion.div>
    )
  }

  const MobileView = () => (
    <motion.div className="md:hidden">
      <div className="flex items-center justify-between mb-4 px-2">
        <button
          type="button"
          onClick={goToPrevRound}
          disabled={activeRound === 1}
          className={cn(
            'p-2 rounded-lg transition-colors',
            activeRound === 1 ? 'text-muted-foreground/30' : 'text-foreground hover:bg-muted/50'
          )}
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        
        <div className="flex items-center gap-1 overflow-x-auto max-w-[70vw]">
          {Array.from({ length: totalRounds }, (_, index) => {
            const round = index + 1
            return (
              <button
                key={round}
                type="button"
                onClick={() => setActiveRound(round)}
                className={cn(
                  'px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap',
                  activeRound === round 
                    ? 'bg-gradient-to-r from-neon-blue to-neon-purple text-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {getRoundLabelShort(round, totalRounds)}
              </button>
            )
          })}
        </div>
        
        <button
          type="button"
          onClick={goToNextRound}
          disabled={activeRound === totalRounds}
          className={cn(
            'p-2 rounded-lg transition-colors',
            activeRound === totalRounds ? 'text-muted-foreground/30' : 'text-foreground hover:bg-muted/50'
          )}
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
      
      <div className="text-center mb-4">
        <h3 className={cn('text-lg font-bold', isFinalRound && 'text-gold')}>
          {getRoundLabel(activeRound, totalRounds)}
        </h3>
        <p className="text-xs text-muted-foreground">
          {activeMatches.length} {activeMatches.length === 1 ? 'partida' : 'partidas'}
        </p>
      </div>
      
      {preliminary.length > 0 && activeRound === 1 && (
        <motion.div className="px-2 mb-4">{renderPreliminaryColumn(true)}</motion.div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={activeRound}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="space-y-3 px-2"
        >
          {isFinalRound && (
            <div className="mb-4 flex flex-col items-center justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[#6c5323] bg-black/70 shadow-[0_0_25px_rgba(240,191,85,0.12)]">
                <Trophy className="w-10 h-10 text-[#f4d588]" />
              </div>
            </div>
          )}
          {activeMatches.map((match) => (
            <BracketMatch
              key={match.id}
              match={match}
              player1={getPlayer(match.player1Id)}
              player2={getPlayer(match.player2Id)}
              isLive={match.id === liveMatchId}
              compact
              side="center"
              isFinal={isFinalRound}
            />
          ))}
        </motion.div>
      </AnimatePresence>
      
      <div className="flex justify-center gap-2 mt-6">
        {Array.from({ length: totalRounds }, (_, index) => {
          const round = index + 1
          return (
            <button
              key={round}
              type="button"
              onClick={() => setActiveRound(round)}
              className={cn(
                'w-2 h-2 rounded-full transition-all',
                activeRound === round 
                  ? 'w-6 bg-gradient-to-r from-neon-blue to-neon-purple' 
                  : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
              )}
            />
          )
        })}
      </div>
    </motion.div>
  )

  const DesktopView = () => (
    <div className="hidden md:block relative overflow-x-auto pb-8">
      <motion.div className="relative min-w-max px-4 py-4">
        <motion.div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(247,211,127,0.08),transparent_45%)]" />

        <div className="relative flex items-center justify-center gap-3 lg:gap-4">
          {renderPreliminaryColumn()}
          {rounds.map((roundMatches, index) => {
            const round = index + 1
            const isFinal = round === totalRounds
            const gapPx = getRoundGapPx(round, totalRounds)
            const showConnector = index > 0

            return (
              <div key={round} className="flex items-center gap-3 lg:gap-4">
                {showConnector && (
                  <div
                    className="hidden lg:flex flex-col justify-around"
                    style={{ gap: `${gapPx}px` }}
                  >
                    {Array.from({ length: Math.max(1, Math.ceil(roundMatches.length / 2)) }).map((_, connectorIndex) => (
                      <div
                        key={connectorIndex}
                        className="w-4 h-8 border-[#6c5323]/70 rounded-r-xl border-r-2 border-t-2 border-b-2"
                      />
                    ))}
                  </div>
                )}

                <div className="flex flex-col items-center">
                  <h3 className="mb-3 text-center text-[9px] font-semibold uppercase tracking-[0.18em] text-[#b8933b]">
                    {getRoundLabel(round, totalRounds)}
                  </h3>

                  {isFinal && (
                    <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full border border-[#6c5323]/80 bg-black/80 shadow-[0_0_24px_rgba(240,191,85,0.12)]">
                      <Trophy className="h-7 w-7 text-[#f4d588]" />
                    </div>
                  )}

                  <div
                    className="flex flex-col justify-around"
                    style={{ gap: `${gapPx}px` }}
                  >
                    {roundMatches.map((match) => (
                      <BracketMatch
                        key={match.id}
                        match={match}
                        player1={getPlayer(match.player1Id)}
                        player2={getPlayer(match.player2Id)}
                        isLive={match.id === liveMatchId}
                        side={round <= Math.ceil(totalRounds / 2) ? 'left' : 'right'}
                        isFinal={isFinal}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </motion.div>
    </div>
  )

  return (
    <>
      <MobileView />
      <DesktopView />
    </>
  )
}
