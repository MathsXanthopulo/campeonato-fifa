'use client'

import { Match } from '@/lib/types'
import { cn } from '@/lib/utils'
import { CheckCircle2, CircleDashed, Radio } from 'lucide-react'

const config = {
  pending: {
    label: 'Aguardando',
    className: 'bg-muted/60 text-muted-foreground border-border/60',
    icon: CircleDashed,
  },
  live: {
    label: 'Ao vivo',
    className: 'bg-red-500/15 text-red-400 border-red-500/40',
    icon: Radio,
  },
  completed: {
    label: 'Finalizada',
    className: 'bg-green-500/15 text-green-400 border-green-500/40',
    icon: CheckCircle2,
  },
} as const

interface MatchStatusBadgeProps {
  status: Match['status']
  className?: string
}

export function MatchStatusBadge({ status, className }: MatchStatusBadgeProps) {
  const item = config[status]
  const Icon = item.icon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
        item.className,
        className
      )}
    >
      <Icon className="w-3 h-3" />
      {item.label}
    </span>
  )
}
