"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
        match.round === 4 && 'border-[#d8a844] shadow-[0_0_32px_rgba(240,191,85,0.18)]',
        cardWidth
      )}
    >
      <div className={cn('absolute inset-y-0 w-1', accentPosition)} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(247,211,127,0.12),transparent_55%)]" />

      {/* Live indicator */}
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
      
      {/* Player 1 */}
      <div className={cn(
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
      </div>
      
      {/* Player 2 */}
      <div className={cn(
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
      </div>
    </motion.div>
  )
}

interface BracketProps {
  matches: Match[]
  players: Player[]
  liveMatchId: string | null
}

const roundNames = ['Fase Inicial', 'Quartas', 'Semifinal', 'Final']
const roundNamesMobile = ['Inicial', 'Quartas', 'Semi', 'Final']

interface BracketColumnProps {
  title: string
  matches: Match[]
  getPlayer: (id: string | null) => Player | undefined
  liveMatchId: string | null
  side: BracketSide
  className?: string
  gapClassName?: string
}

function BracketColumn({
  title,
  matches,
  getPlayer,
  liveMatchId,
  side,
  className,
  gapClassName,
}: BracketColumnProps) {
  return (
    <div className={cn('flex flex-col items-center', className)}>
      <h3 className="mb-2 text-center text-[9px] font-semibold uppercase tracking-[0.18em] text-[#b8933b]">
        {title}
      </h3>

      <div className={cn('flex flex-col', gapClassName)}>
        {matches.map((match) => (
          <BracketMatch
            key={match.id}
            match={match}
            player1={getPlayer(match.player1Id)}
            player2={getPlayer(match.player2Id)}
            isLive={match.id === liveMatchId}
            side={side}
          />
        ))}
      </div>
    </div>
  )
}

interface ConnectorColumnProps {
  side: 'left' | 'right'
  count: number
  className?: string
  connectorHeightClassName?: string
  gapClassName?: string
}

function ConnectorColumn({
  side,
  count,
  className,
  connectorHeightClassName = 'h-24',
  gapClassName = 'gap-24',
}: ConnectorColumnProps) {
  return (
    <div className={cn('hidden md:flex flex-col justify-around', gapClassName, className)}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={cn(
            'w-5 border-[#6c5323]/70',
            connectorHeightClassName,
            side === 'right'
              ? 'rounded-r-2xl border-r-2 border-t-2 border-b-2'
              : 'rounded-l-2xl border-l-2 border-t-2 border-b-2'
          )}
        />
      ))}
    </div>
  )
}

export function Bracket({ matches, players, liveMatchId }: BracketProps) {
  const [activeRound, setActiveRound] = useState(1)
  const getPlayer = (id: string | null) => players.find(p => p.id === id)
  
  const round1 = matches.filter(m => m.round === 1).sort((a, b) => a.position - b.position)
  const round2 = matches.filter(m => m.round === 2).sort((a, b) => a.position - b.position)
  const semis = matches.filter(m => m.round === 3).sort((a, b) => a.position - b.position)
  const finals = matches.filter(m => m.round === 4)
  const leftRound1 = round1.slice(0, 3)
  const rightRound1 = round1.slice(3, 6)
  const leftRound2 = round2.slice(0, 2)
  const rightRound2 = round2.slice(2, 4)
  const leftSemi = semis[0] ? [semis[0]] : []
  const rightSemi = semis[1] ? [semis[1]] : []
  
  const rounds = [round1, round2, semis, finals]
  const activeMatches = rounds[activeRound - 1] || []
  
  const goToPrevRound = () => setActiveRound(r => Math.max(1, r - 1))
  const goToNextRound = () => setActiveRound(r => Math.min(4, r + 1))

  // Mobile View - Swipeable rounds
  const MobileView = () => (
    <div className="md:hidden">
      {/* Round selector */}
      <div className="flex items-center justify-between mb-4 px-2">
        <button
          onClick={goToPrevRound}
          disabled={activeRound === 1}
          className={cn(
            'p-2 rounded-lg transition-colors',
            activeRound === 1 ? 'text-muted-foreground/30' : 'text-foreground hover:bg-muted/50'
          )}
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4].map((round) => (
            <button
              key={round}
              onClick={() => setActiveRound(round)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                activeRound === round 
                  ? 'bg-gradient-to-r from-neon-blue to-neon-purple text-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {roundNamesMobile[round - 1]}
            </button>
          ))}
        </div>
        
        <button
          onClick={goToNextRound}
          disabled={activeRound === 4}
          className={cn(
            'p-2 rounded-lg transition-colors',
            activeRound === 4 ? 'text-muted-foreground/30' : 'text-foreground hover:bg-muted/50'
          )}
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
      
      {/* Round title */}
      <div className="text-center mb-4">
        <h3 className={cn(
          'text-lg font-bold',
          activeRound === 4 && 'text-gold'
        )}>
          {roundNames[activeRound - 1]}
        </h3>
        <p className="text-xs text-muted-foreground">
          {activeMatches.length} {activeMatches.length === 1 ? 'partida' : 'partidas'}
        </p>
      </div>
      
      {/* Matches */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeRound}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="space-y-3 px-2"
        >
          {activeRound === 4 && (
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
            />
          ))}
        </motion.div>
      </AnimatePresence>
      
      {/* Progress dots */}
      <div className="flex justify-center gap-2 mt-6">
        {[1, 2, 3, 4].map((round) => (
          <button
            key={round}
            onClick={() => setActiveRound(round)}
            className={cn(
              'w-2 h-2 rounded-full transition-all',
              activeRound === round 
                ? 'w-6 bg-gradient-to-r from-neon-blue to-neon-purple' 
                : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
            )}
          />
        ))}
      </div>
    </div>
  )

  // Desktop View - Symmetrical bracket
  const DesktopView = () => (
    <div className="hidden md:block relative overflow-x-auto pb-8">
      <div className="relative min-w-[1020px] px-3 py-4 lg:min-w-[1100px]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(247,211,127,0.08),transparent_45%)]" />
        <div className="absolute left-1/2 top-8 h-[75%] w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-[#5d4720]/60 to-transparent" />

        <div className="relative flex items-center justify-center gap-2 lg:gap-3">
          <BracketColumn
            title="Lado A"
            matches={leftRound1}
            getPlayer={getPlayer}
            liveMatchId={liveMatchId}
            side="left"
            gapClassName="gap-5"
          />

          <ConnectorColumn
            side="right"
            count={3}
            className="py-8"
            connectorHeightClassName="h-12"
            gapClassName="gap-10"
          />

          <BracketColumn
            title="Quartas A"
            matches={leftRound2}
            getPlayer={getPlayer}
            liveMatchId={liveMatchId}
            side="left"
            className="pt-7"
            gapClassName="gap-20"
          />

          <ConnectorColumn
            side="right"
            count={2}
            className="py-14"
            connectorHeightClassName="h-16"
            gapClassName="gap-24"
          />

          <BracketColumn
            title="Semi A"
            matches={leftSemi}
            getPlayer={getPlayer}
            liveMatchId={liveMatchId}
            side="left"
            className="pt-[4.5rem]"
          />

          <div className="flex flex-col items-center px-1">
            <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-full border border-[#6c5323]/80 bg-black/80 shadow-[0_0_24px_rgba(240,191,85,0.12)] lg:h-24 lg:w-24">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#9d7830]/60 bg-[radial-gradient(circle,rgba(247,211,127,0.2),transparent_70%)] lg:h-16 lg:w-16">
                <Trophy className="h-8 w-8 text-[#f4d588] lg:h-9 lg:w-9" />
              </div>
            </div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#b8933b]">
              Final
            </p>
            <p className="mt-1 mb-3 text-[9px] text-muted-foreground">
              Chave em duas pontas
            </p>
            {finals.map((match) => (
              <BracketMatch
                key={match.id}
                match={match}
                player1={getPlayer(match.player1Id)}
                player2={getPlayer(match.player2Id)}
                isLive={match.id === liveMatchId}
                side="center"
              />
            ))}
          </div>

          <BracketColumn
            title="Semi B"
            matches={rightSemi}
            getPlayer={getPlayer}
            liveMatchId={liveMatchId}
            side="right"
            className="pt-[4.5rem]"
          />

          <ConnectorColumn
            side="left"
            count={2}
            className="py-14"
            connectorHeightClassName="h-16"
            gapClassName="gap-24"
          />

          <BracketColumn
            title="Quartas B"
            matches={rightRound2}
            getPlayer={getPlayer}
            liveMatchId={liveMatchId}
            side="right"
            className="pt-7"
            gapClassName="gap-20"
          />

          <ConnectorColumn
            side="left"
            count={3}
            className="py-8"
            connectorHeightClassName="h-12"
            gapClassName="gap-10"
          />

          <BracketColumn
            title="Lado B"
            matches={rightRound1}
            getPlayer={getPlayer}
            liveMatchId={liveMatchId}
            side="right"
            gapClassName="gap-5"
          />
        </div>
      </div>
    </div>
  )

  return (
    <>
      <MobileView />
      <DesktopView />
    </>
  )
}
