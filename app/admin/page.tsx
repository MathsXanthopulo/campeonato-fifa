"use client"

import { FormEvent, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useTournament } from '@/lib/tournament-context'
import { Match, Player } from '@/lib/types'
import { Loading } from '@/components/tournament/loading'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Home, List, PencilLine, Trophy } from 'lucide-react'

const roundNames = ['Rodada 1', 'Quartas de Final', 'Semifinal', 'Final']

function getMatchStatusLabel(status: 'pending' | 'live' | 'completed') {
  if (status === 'completed') return 'Finalizada'
  if (status === 'live') return 'Ao vivo'
  return 'Aguardando'
}

function getScoreLabel(match: Match) {
  if (match.score1 === null || match.score2 === null) {
    return '-'
  }

  if (match.wentToPenalties && match.penaltyScore1 !== null && match.penaltyScore2 !== null) {
    return `${match.score1} x ${match.score2} (pen. ${match.penaltyScore1} x ${match.penaltyScore2})`
  }

  return `${match.score1} x ${match.score2}`
}

interface MatchResultDialogProps {
  match: Match
  player1?: Player
  player2?: Player
  onSave: (matchId: string, updates: Partial<Match>) => void
}

function MatchResultDialog({ match, player1, player2, onSave }: MatchResultDialogProps) {
  const [open, setOpen] = useState(false)
  const [score1, setScore1] = useState('')
  const [score2, setScore2] = useState('')
  const [hadPenalties, setHadPenalties] = useState(false)
  const [penaltyScore1, setPenaltyScore1] = useState('')
  const [penaltyScore2, setPenaltyScore2] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!open) {
      return
    }

    setScore1(match.score1?.toString() ?? '')
    setScore2(match.score2?.toString() ?? '')
    setHadPenalties(match.wentToPenalties)
    setPenaltyScore1(match.penaltyScore1?.toString() ?? '')
    setPenaltyScore2(match.penaltyScore2?.toString() ?? '')
    setErrorMessage('')
  }, [match, open])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!player1 || !player2) {
      setErrorMessage('Essa partida ainda nao possui os dois jogadores definidos.')
      return
    }

    if (score1 === '' || score2 === '') {
      setErrorMessage('Preencha o placar dos dois jogadores.')
      return
    }

    const parsedScore1 = Number(score1)
    const parsedScore2 = Number(score2)

    if (Number.isNaN(parsedScore1) || Number.isNaN(parsedScore2) || parsedScore1 < 0 || parsedScore2 < 0) {
      setErrorMessage('Informe um placar valido.')
      return
    }

    if (hadPenalties) {
      if (parsedScore1 !== parsedScore2) {
        setErrorMessage('Para marcar penaltis, o placar do jogo precisa terminar empatado.')
        return
      }

      if (penaltyScore1 === '' || penaltyScore2 === '') {
        setErrorMessage('Preencha o placar dos penaltis.')
        return
      }

      const parsedPenalty1 = Number(penaltyScore1)
      const parsedPenalty2 = Number(penaltyScore2)

      if (
        Number.isNaN(parsedPenalty1) ||
        Number.isNaN(parsedPenalty2) ||
        parsedPenalty1 < 0 ||
        parsedPenalty2 < 0
      ) {
        setErrorMessage('Informe um placar de penaltis valido.')
        return
      }

      if (parsedPenalty1 === parsedPenalty2) {
        setErrorMessage('Nos penaltis precisa existir um vencedor.')
        return
      }

      onSave(match.id, {
        score1: parsedScore1,
        score2: parsedScore2,
        wentToPenalties: true,
        penaltyScore1: parsedPenalty1,
        penaltyScore2: parsedPenalty2,
        winnerId: parsedPenalty1 > parsedPenalty2 ? player1.id : player2.id,
        status: 'completed',
      })

      setOpen(false)
      return
    }

    if (parsedScore1 === parsedScore2) {
      setErrorMessage('Em mata-mata nao pode terminar empatado sem penaltis.')
      return
    }

    onSave(match.id, {
      score1: parsedScore1,
      score2: parsedScore2,
      wentToPenalties: false,
      penaltyScore1: null,
      penaltyScore2: null,
      winnerId: parsedScore1 > parsedScore2 ? player1.id : player2.id,
      status: 'completed',
    })

    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant={match.status === 'completed' ? 'outline' : 'default'} disabled={!player1 || !player2}>
          <PencilLine className="w-4 h-4 mr-2" />
          {match.status === 'completed' ? 'Editar placar' : 'Lancar placar'}
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resultado da partida</DialogTitle>
          <DialogDescription>
            Registre o placar entre {player1?.name || 'Jogador 1'} e {player2?.name || 'Jogador 2'}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`score1-${match.id}`}>{player1?.name || 'Jogador 1'}</Label>
              <Input
                id={`score1-${match.id}`}
                type="number"
                min={0}
                value={score1}
                onChange={(event) => setScore1(event.target.value)}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`score2-${match.id}`}>{player2?.name || 'Jogador 2'}</Label>
              <Input
                id={`score2-${match.id}`}
                type="number"
                min={0}
                value={score2}
                onChange={(event) => setScore2(event.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div className="rounded-lg border border-border/60 p-4">
            <div className="flex items-center gap-3">
              <Checkbox
                id={`penalties-${match.id}`}
                checked={hadPenalties}
                onCheckedChange={(checked) => {
                  const nextValue = checked === true
                  setHadPenalties(nextValue)

                  if (!nextValue) {
                    setPenaltyScore1('')
                    setPenaltyScore2('')
                  }
                }}
              />
              <Label htmlFor={`penalties-${match.id}`} className="cursor-pointer">
                Teve penaltis?
              </Label>
            </div>

            {hadPenalties && (
              <Accordion type="single" collapsible defaultValue="penalties" className="mt-3">
                <AccordionItem value="penalties" className="border-b-0">
                  <AccordionTrigger className="py-2">
                    Informar gols nos penaltis
                  </AccordionTrigger>
                  <AccordionContent className="pt-2">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor={`penalty-score1-${match.id}`}>
                          Penaltis de {player1?.name || 'Jogador 1'}
                        </Label>
                        <Input
                          id={`penalty-score1-${match.id}`}
                          type="number"
                          min={0}
                          value={penaltyScore1}
                          onChange={(event) => setPenaltyScore1(event.target.value)}
                          placeholder="0"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`penalty-score2-${match.id}`}>
                          Penaltis de {player2?.name || 'Jogador 2'}
                        </Label>
                        <Input
                          id={`penalty-score2-${match.id}`}
                          type="number"
                          min={0}
                          value={penaltyScore2}
                          onChange={(event) => setPenaltyScore2(event.target.value)}
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
          </div>

          {errorMessage && (
            <p className="text-sm text-destructive">{errorMessage}</p>
          )}

          <DialogFooter>
            <Button type="submit">Salvar resultado</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function MatchesPanelPage() {
  const { state, isLoading, getPlayer, updateMatch } = useTournament()

  if (isLoading || !state) {
    return (
      <main className="min-h-screen pb-20">
        <Loading />
      </main>
    )
  }

  const { tournament, matches } = state
  const completedMatches = matches.filter((match) => match.status === 'completed').length
  const liveMatches = matches.filter((match) => match.status === 'live').length

  const handleSaveMatchResult = (matchId: string, updates: Partial<Match>) => {
    updateMatch(matchId, updates)
  }

  return (
    <main className="min-h-screen pb-24 md:pb-8">
      <div className="container mx-auto px-4 py-8 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center">
              <List className="w-6 h-6 text-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Painel de Partidas</h1>
              <p className="text-sm text-muted-foreground">
                Veja os confrontos e acompanhe os jogos que ja aconteceram.
              </p>
            </div>
          </div>

          <Link href="/">
            <Button variant="outline">
              <Home className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 gap-4 md:grid-cols-3"
        >
          <div className="glass rounded-xl p-5">
            <p className="text-sm text-muted-foreground">Status do torneio</p>
            <p className="mt-2 text-xl font-semibold">
              {tournament.status === 'setup' && 'Em preparacao'}
              {tournament.status === 'active' && 'Em andamento'}
              {tournament.status === 'completed' && 'Finalizado'}
            </p>
          </div>

          <div className="glass rounded-xl p-5">
            <p className="text-sm text-muted-foreground">Partidas finalizadas</p>
            <p className="mt-2 text-xl font-semibold">{completedMatches}</p>
          </div>

          <div className="glass rounded-xl p-5">
            <p className="text-sm text-muted-foreground">Partidas ao vivo</p>
            <p className="mt-2 text-xl font-semibold">{liveMatches}</p>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          {roundNames.map((roundName, index) => {
            const round = index + 1
            const roundMatches = matches
              .filter((match) => match.round === round)
              .sort((a, b) => a.position - b.position)

            return (
              <div key={round} className="glass rounded-xl p-6">
                <div className="mb-4 flex items-center gap-2">
                  <Trophy className={`w-5 h-5 ${round === 4 ? 'text-gold' : 'text-neon-purple'}`} />
                  <h2 className="text-lg font-bold">{roundName}</h2>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Jogador 1</TableHead>
                      <TableHead>Placar</TableHead>
                      <TableHead>Jogador 2</TableHead>
                      <TableHead>Resultado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roundMatches.map((match) => {
                      const player1 = getPlayer(match.player1Id)
                      const player2 = getPlayer(match.player2Id)

                      return (
                        <TableRow key={match.id}>
                          <TableCell className="font-medium">
                            {player1?.name || 'A definir'}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <p>{getScoreLabel(match)}</p>
                              <p className="text-xs text-muted-foreground">
                                {getMatchStatusLabel(match.status)}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {player2?.name || 'A definir'}
                          </TableCell>
                          <TableCell>
                            <MatchResultDialog
                              match={match}
                              player1={player1}
                              player2={player2}
                              onSave={handleSaveMatchResult}
                            />
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )
          })}
        </motion.section>
      </div>
    </main>
  )
}
