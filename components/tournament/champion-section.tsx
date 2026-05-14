"use client"

import { motion } from 'framer-motion'
import { Player } from '@/lib/types'
import { PlayerCard } from './player-card'
import { Trophy, Sparkles } from 'lucide-react'

interface ChampionSectionProps {
  champion: Player
}

export function ChampionSection({ champion }: ChampionSectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl glass glow-gold p-8"
    >
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-gold/10 via-neon-purple/10 to-gold/10"
          animate={{ 
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] 
          }}
          transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
          style={{ backgroundSize: '200% 200%' }}
        />
        
        {/* Floating particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-gold/30"
            initial={{ 
              x: Math.random() * 100 + '%',
              y: '100%',
              opacity: 0 
            }}
            animate={{ 
              y: '-20%',
              opacity: [0, 1, 0],
            }}
            transition={{ 
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>
      
      <div className="relative flex flex-col md:flex-row items-center gap-6 md:gap-8">
        {/* Trophy icon */}
        <motion.div
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-gold"
        >
          <Trophy className="w-16 h-16 md:w-20 md:h-20" />
        </motion.div>
        
        {/* Champion card */}
        <PlayerCard player={champion} size="lg" isChampion />
        
        {/* Champion info */}
        <div className="flex-1 text-center md:text-left">
          <motion.div 
            className="flex items-center justify-center md:justify-start gap-2 text-gold mb-2"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Sparkles className="w-5 h-5" />
            <span className="text-sm font-semibold uppercase tracking-wider">
              Campeao
            </span>
            <Sparkles className="w-5 h-5" />
          </motion.div>
          
          <h2 className="text-3xl md:text-4xl font-bold text-gold text-glow-gold mb-2">
            {champion.name}
          </h2>
          
          <p className="text-muted-foreground">
            {champion.team ? (
              <>
                Time: <span className="text-gold font-bold">{champion.team}</span>
              </>
            ) : (
              <>
                Overall: <span className="text-gold font-bold">{champion.overall}</span>
              </>
            )}
          </p>
          
          <div className="mt-4 flex items-center justify-center md:justify-start gap-2">
            <div className="px-3 py-1 rounded-full bg-gold/20 text-gold text-sm font-medium">
              FC25 Champion
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  )
}
