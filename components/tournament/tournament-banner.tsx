"use client"

import { motion } from 'framer-motion'
import { Trophy, Users, Gamepad2 } from 'lucide-react'

interface TournamentBannerProps {
  title: string
  status: 'setup' | 'active' | 'completed'
  playerCount: number
}

export function TournamentBanner({ title, status, playerCount }: TournamentBannerProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl"
    >
      {/* Background with animated gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-neon-blue/20 via-neon-purple/20 to-neon-cyan/20 animate-gradient" />
      <div className="absolute inset-0 glass-dark" />
      
      {/* Decorative elements */}
      <motion.div
        className="absolute top-0 right-0 w-64 h-64 bg-neon-purple/10 rounded-full blur-3xl"
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 4, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-0 left-0 w-64 h-64 bg-neon-blue/10 rounded-full blur-3xl"
        animate={{ 
          scale: [1.2, 1, 1.2],
          opacity: [0.5, 0.3, 0.5],
        }}
        transition={{ duration: 4, repeat: Infinity }}
      />
      
      <div className="relative p-8 md:p-12">
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Icon */}
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="p-4 rounded-2xl bg-gradient-to-br from-neon-blue to-neon-purple glow-purple"
          >
            <Gamepad2 className="w-12 h-12 md:w-16 md:h-16 text-foreground" />
          </motion.div>
          
          {/* Title and info */}
          <div className="flex-1 text-center md:text-left">
            <motion.h1 
              className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-neon-blue via-neon-purple to-neon-cyan bg-clip-text text-transparent"
              animate={{ 
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] 
              }}
              transition={{ duration: 5, repeat: Infinity }}
              style={{ backgroundSize: '200% 200%' }}
            >
              {title}
            </motion.h1>
            
            <p className="mt-2 text-muted-foreground text-lg">
              Torneio 1v1 Ultimate Team
            </p>
            
            {/* Stats */}
            <div className="mt-4 flex flex-wrap items-center justify-center md:justify-start gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50">
                <Users className="w-4 h-4 text-neon-blue" />
                <span className="text-sm font-medium">{playerCount} Jogadores</span>
              </div>
              
              <div className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-full',
                status === 'setup' && 'bg-yellow-500/20 text-yellow-400',
                status === 'active' && 'bg-green-500/20 text-green-400',
                status === 'completed' && 'bg-gold/20 text-gold'
              )}>
                <Trophy className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {status === 'setup' && 'Em Preparacao'}
                  {status === 'active' && 'Em Andamento'}
                  {status === 'completed' && 'Finalizado'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}
