"use client"

import { motion } from 'framer-motion'

export function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      {/* Animated logo */}
      <motion.div
        className="relative w-20 h-20"
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      >
        <div className="absolute inset-0 rounded-full border-4 border-muted" />
        <div className="absolute inset-0 rounded-full border-4 border-t-neon-blue border-r-transparent border-b-transparent border-l-transparent" />
        <div className="absolute inset-2 rounded-full border-4 border-t-transparent border-r-neon-purple border-b-transparent border-l-transparent" />
      </motion.div>
      
      {/* Loading text */}
      <motion.p
        className="text-muted-foreground text-lg"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        Carregando torneio...
      </motion.p>
    </div>
  )
}
