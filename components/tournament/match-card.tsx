"use client"

import { motion } from 'framer-motion'
import { Match, Player } from '@/lib/types'
import { cn } from '@/lib/utils'

interface MatchCardProps {
  match: Match
  player1?: Player
  player2?: Player
  isLive?: boolean
  isFinal?: boolean
  compact?: boolean
  className?: string
}

export function MatchCard({
  match,
  player1,
  player2,
  isLive = false,
  isFinal = false,
  compact = false,
  className
}: MatchCardProps) {
  const isCompleted = match.status === 'completed'
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: compact ? 1 : 1.02 }}
      className={cn(
        'relative rounded-xl overflow-hidden',
        compact ? 'glass-dark p-2' : 'glass p-4',
        isLive && 'animate-pulse-glow',
        isFinal && 'glow-purple',
        className
      )}
    >
      {/* Live indicator */}
      {isLive && (
        <div className="absolute top-2 right-2 flex items-center gap-1.5">
          <motion.div 
            className="w-2 h-2 rounded-full bg-red-500"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
          <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">
            Ao Vivo
          </span>
        </div>
      )}
      
      {/* Final badge */}
      {isFinal && !isLive && (
        <div className="absolute top-2 right-2">
          <span className="text-xs font-semibold text-gold uppercase tracking-wider">
            Final
          </span>
        </div>
      )}
      
      {/* Match content */}
      <div className={cn(
        'flex items-center justify-between gap-4',
        compact && 'gap-2'
      )}>
        {/* Player 1 */}
        <div className={cn(
          'flex-1 flex items-center gap-3',
          compact && 'gap-2'
        )}>
          <div className={cn(
            'rounded-full bg-gradient-to-br from-neon-blue to-neon-purple',
            'flex items-center justify-center text-foreground font-bold',
            compact ? 'w-8 h-8 text-xs' : 'w-12 h-12 text-base',
            isCompleted && match.winnerId === player1?.id && 'ring-2 ring-gold'
          )}>
            {player1?.name.charAt(0) || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn(
              'font-semibold truncate',
              compact ? 'text-xs' : 'text-sm',
              isCompleted && match.winnerId === player1?.id && 'text-gold'
            )}>
              {player1?.name || 'A definir'}
            </p>
            {!compact && player1 && (
              <p className="text-xs text-muted-foreground">
                OVR {player1.overall}
              </p>
            )}
          </div>
        </div>
        
        {/* Score */}
        <div className={cn(
          'flex items-center gap-2 font-bold',
          compact ? 'text-lg' : 'text-2xl',
          isLive && 'text-glow-blue'
        )}>
          <span className={cn(
            isCompleted && match.winnerId === player1?.id && 'text-gold'
          )}>
            {match.score1 ?? '-'}
          </span>
          <span className="text-muted-foreground">:</span>
          <span className={cn(
            isCompleted && match.winnerId === player2?.id && 'text-gold'
          )}>
            {match.score2 ?? '-'}
          </span>
        </div>
        
        {/* Player 2 */}
        <div className={cn(
          'flex-1 flex items-center gap-3 justify-end',
          compact && 'gap-2'
        )}>
          <div className="flex-1 min-w-0 text-right">
            <p className={cn(
              'font-semibold truncate',
              compact ? 'text-xs' : 'text-sm',
              isCompleted && match.winnerId === player2?.id && 'text-gold'
            )}>
              {player2?.name || 'A definir'}
            </p>
            {!compact && player2 && (
              <p className="text-xs text-muted-foreground">
                OVR {player2.overall}
              </p>
            )}
          </div>
          <div className={cn(
            'rounded-full bg-gradient-to-br from-neon-purple to-neon-cyan',
            'flex items-center justify-center text-foreground font-bold',
            compact ? 'w-8 h-8 text-xs' : 'w-12 h-12 text-base',
            isCompleted && match.winnerId === player2?.id && 'ring-2 ring-gold'
          )}>
            {player2?.name.charAt(0) || '?'}
          </div>
        </div>
      </div>
      
      {/* Round indicator */}
      {!compact && (
        <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {match.round === 1 && 'Rodada 1'}
            {match.round === 2 && 'Quartas de Final'}
            {match.round === 3 && 'Semifinal'}
            {match.round === 4 && 'Final'}
          </span>
          <span className={cn(
            'px-2 py-0.5 rounded-full text-xs',
            match.status === 'completed' && 'bg-green-500/20 text-green-400',
            match.status === 'live' && 'bg-red-500/20 text-red-400',
            match.status === 'pending' && 'bg-muted text-muted-foreground'
          )}>
            {match.status === 'completed' && 'Finalizado'}
            {match.status === 'live' && 'Ao Vivo'}
            {match.status === 'pending' && 'Pendente'}
          </span>
        </div>
      )}
    </motion.div>
  )
}
