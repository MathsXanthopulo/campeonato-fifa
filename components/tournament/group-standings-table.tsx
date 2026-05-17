'use client'

import { GroupStanding } from '@/lib/tournament-format/standings'
import { Player } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Crown } from 'lucide-react'

interface GroupStandingsTableProps {
  groupName: string
  standings: GroupStanding[]
  getPlayer: (id: string) => Player | undefined
  highlightLeaderPrivilege?: boolean
  /** Destaca as N primeiras posições como vagas no mata-mata (ex.: 2 = 1º e 2º). */
  qualifySlots?: number
}

export function GroupStandingsTable({
  groupName,
  standings,
  getPlayer,
  highlightLeaderPrivilege = false,
  qualifySlots = 0,
}: GroupStandingsTableProps) {
  return (
    <div className="rounded-xl border border-border/50 bg-black/40 overflow-hidden">
      <div className="border-b border-border/50 px-4 py-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[#b8933b]">
          {groupName}
        </h3>
        {highlightLeaderPrivilege && (
          <span className="text-[10px] uppercase tracking-wide text-[#f4d588]/90 flex items-center gap-1">
            <Crown className="w-3 h-3" />
            1º → quartas
          </span>
        )}
        {!highlightLeaderPrivilege && qualifySlots >= 2 && (
          <span className="text-[10px] uppercase tracking-wide text-[#f4d588]/90">
            1º e 2º → mata-mata
          </span>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-border/40">
            <TableHead className="w-10 text-center">#</TableHead>
            <TableHead>Jogador</TableHead>
            <TableHead className="text-center w-10" title="Jogos">
              J
            </TableHead>
            <TableHead className="text-center w-10" title="Vitórias">
              V
            </TableHead>
            <TableHead className="text-center w-10" title="Empates">
              E
            </TableHead>
            <TableHead className="text-center w-10" title="Derrotas">
              D
            </TableHead>
            <TableHead className="text-center w-10" title="Gols pró">
              GP
            </TableHead>
            <TableHead className="text-center w-10" title="Gols contra">
              GC
            </TableHead>
            <TableHead className="text-center w-12" title="Saldo de gols">
              SG
            </TableHead>
            <TableHead className="text-center w-12 font-bold" title="Pontos">
              Pts
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {standings.map((row, index) => {
            const player = getPlayer(row.playerId)
            const isLeader = index === 0
            const isQualified = qualifySlots > 0 && index < qualifySlots

            return (
              <TableRow
                key={row.playerId}
                className={cn(
                  'border-border/30',
                  (isLeader || isQualified) && 'bg-[#c6972c]/10'
                )}
              >
                <TableCell className="text-center font-medium text-muted-foreground">
                  {index + 1}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 min-w-0">
                    {isLeader && (
                      <Crown className="w-3.5 h-3.5 text-[#f4d588] flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p
                        className={cn(
                          'font-medium truncate',
                          isQualified && 'text-[#f4d588]'
                        )}
                      >
                        {player?.name ?? 'Jogador'}
                      </p>
                      {player?.team && (
                        <p className="text-xs text-muted-foreground truncate">
                          {player.team}
                        </p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-center">{row.played}</TableCell>
                <TableCell className="text-center">{row.wins}</TableCell>
                <TableCell className="text-center">{row.draws}</TableCell>
                <TableCell className="text-center">{row.losses}</TableCell>
                <TableCell className="text-center">{row.goalsFor}</TableCell>
                <TableCell className="text-center">{row.goalsAgainst}</TableCell>
                <TableCell
                  className={cn(
                    'text-center font-medium',
                    row.goalDifference > 0 && 'text-green-400',
                    row.goalDifference < 0 && 'text-red-400'
                  )}
                >
                  {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                </TableCell>
                <TableCell className="text-center font-bold text-[#f7d37f]">
                  {row.points}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      <p className="px-4 py-2 text-[10px] text-muted-foreground border-t border-border/30">
        Vitória 3 pts · Empate 1 pt · Derrota 0 · Desempate: saldo de gols
      </p>
    </div>
  )
}
