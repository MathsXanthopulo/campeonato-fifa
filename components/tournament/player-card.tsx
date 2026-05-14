"use client"

import { motion } from 'framer-motion'
import { Player } from '@/lib/types'
import { cn } from '@/lib/utils'

interface PlayerCardProps {
  player: Player
  size?: 'sm' | 'md' | 'lg'
  isChampion?: boolean
  showOverall?: boolean
  className?: string
}

export function PlayerCard({ 
  player, 
  size = 'md', 
  isChampion = false,
  showOverall = true,
  className 
}: PlayerCardProps) {
  const sizeClasses = {
    sm: 'w-16 h-22',
    md: 'w-24 h-36',
    lg: 'w-32 h-48',
  }
  
  const avatarSizes = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-20 h-20',
  }
  
  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }
  
  const overallSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  }

  const getOverallColor = (overall: number) => {
    if (overall >= 90) return 'text-gold'
    if (overall >= 80) return 'text-neon-purple'
    return 'text-neon-blue'
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05, y: -5 }}
      transition={{ duration: 0.2 }}
      className={cn(
        sizeClasses[size],
        'relative flex flex-col items-center justify-center rounded-xl',
        'glass gradient-border overflow-hidden',
        isChampion && 'glow-gold',
        className
      )}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-neon-blue/10 via-transparent to-neon-purple/10" />
      
      {/* Champion crown */}
      {isChampion && (
        <motion.div 
          className="absolute -top-1 left-1/2 -translate-x-1/2 text-gold"
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <svg className={size === 'lg' ? 'w-8 h-8' : 'w-5 h-5'} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
          </svg>
        </motion.div>
      )}
      
      {/* Overall rating */}
      {showOverall && (
        <div className={cn(
          'absolute top-1 left-1 font-bold',
          overallSizes[size],
          getOverallColor(player.overall),
          player.overall >= 90 && 'text-glow-gold'
        )}>
          {player.overall}
        </div>
      )}
      
      {/* Avatar */}
      <div className={cn(
        avatarSizes[size],
        'rounded-full bg-gradient-to-br from-neon-blue to-neon-purple',
        'flex items-center justify-center text-foreground font-bold',
        size === 'lg' ? 'text-2xl' : size === 'md' ? 'text-lg' : 'text-sm',
        isChampion ? 'mt-3' : 'mt-1'
      )}>
        {player.name.charAt(0)}
      </div>
      
      {/* Name */}
      <p className={cn(
        'mt-2 font-semibold truncate w-full text-center px-1',
        textSizes[size],
        isChampion && 'text-gold'
      )}>
        {player.name}
      </p>

      {player.team && (
        <p className={cn(
          'mt-1 px-2 text-center leading-tight text-muted-foreground',
          size === 'lg' ? 'text-xs' : 'text-[10px]'
        )}>
          {player.team}
        </p>
      )}
      
      {/* Position indicator */}
      <div className={cn(
        'absolute bottom-1 left-1/2 -translate-x-1/2',
        'h-0.5 rounded-full bg-gradient-to-r from-neon-blue to-neon-purple',
        size === 'lg' ? 'w-16' : size === 'md' ? 'w-12' : 'w-8'
      )} />
    </motion.div>
  )
}
