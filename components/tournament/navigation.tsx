"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Home, Trophy, List } from 'lucide-react'

const navItems = [
  { href: '/', label: 'Início', icon: Home },
  { href: '/bracket', label: 'Chaveamento', icon: Trophy },
  { href: '/admin', label: 'Partidas', icon: List },
]

export function Navigation() {
  const pathname = usePathname()
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:top-0 md:bottom-auto">
      <div className="glass-dark border-t md:border-t-0 md:border-b border-border/50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo - hidden on mobile */}
            <Link 
              href="/"
              className="hidden md:flex items-center gap-2"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center">
                <Trophy className="w-5 h-5 text-foreground" />
              </div>
              <span className="font-bold text-xl bg-gradient-to-r from-neon-blue to-neon-purple bg-clip-text text-transparent">
                Champions Tito
              </span>
            </Link>
            
            {/* Nav items */}
            <div className="flex items-center justify-around w-full md:w-auto md:gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'relative flex flex-col md:flex-row items-center gap-1 md:gap-2 px-4 py-2 rounded-lg transition-colors',
                      'hover:bg-muted/50',
                      isActive ? 'text-primary' : 'text-muted-foreground'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs md:text-sm font-medium">
                      {item.label}
                    </span>
                    {isActive && (
                      <motion.div
                        layoutId="nav-indicator"
                        className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-neon-blue to-neon-purple rounded-full md:bottom-0"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
