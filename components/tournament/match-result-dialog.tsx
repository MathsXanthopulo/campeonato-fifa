'use client'

import { FormEvent, useEffect, useState } from 'react'
import { Match, Player } from '@/lib/types'
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
import { PencilLine } from 'lucide-react'

interface MatchResultDialogProps {
  match: Match
  player1?: Player
  player2?: Player
  onSave: (matchId: string, updates: Partial<Match>) => void
}

export function MatchResultDialog({ match, player1, player2, onSave }: MatchResultDialogProps) {
  const [open, setOpen] = useState(false)
  const [score1, setScore1] = useState('')
  const [score2, setScore2] = useState('')
  const [hadPenalties, setHadPenalties] = useState(false)
  const [penaltyScore1, setPenaltyScore1] = useState('')
  const [penaltyScore2, setPenaltyScore2] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const isGroupMatch = match.phase === 'groups'
  const canPlay = Boolean(player1 && player2)

  useEffect(() => {
    if (!open) return

    setScore1(match.score1?.toString() ?? '')
    setScore2(match.score2?.toString() ?? '')
    setHadPenalties(match.wentToPenalties)
    setPenaltyScore1(match.penaltyScore1?.toString() ?? '')
    setPenaltyScore2(match.penaltyScore2?.toString() ?? '')
    setErrorMessage('')
  }, [match, open])

  const finishMatch = (updates: Partial<Match>) => {
    onSave(match.id, { ...updates, status: 'completed' })
    setOpen(false)
  }

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

      finishMatch({
        score1: parsedScore1,
        score2: parsedScore2,
        wentToPenalties: true,
        penaltyScore1: parsedPenalty1,
        penaltyScore2: parsedPenalty2,
        winnerId: parsedPenalty1 > parsedPenalty2 ? player1.id : player2.id,
      })
      return
    }

    if (parsedScore1 === parsedScore2) {
      if (isGroupMatch) {
        finishMatch({
          score1: parsedScore1,
          score2: parsedScore2,
          wentToPenalties: false,
          penaltyScore1: null,
          penaltyScore2: null,
          winnerId: null,
        })
        return
      }

      setErrorMessage('Em mata-mata nao pode terminar empatado sem penaltis.')
      return
    }

    finishMatch({
      score1: parsedScore1,
      score2: parsedScore2,
      wentToPenalties: false,
      penaltyScore1: null,
      penaltyScore2: null,
      winnerId: parsedScore1 > parsedScore2 ? player1.id : player2.id,
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant={match.status === 'completed' ? 'outline' : 'default'}
          disabled={!canPlay}
          className="w-full sm:w-auto"
        >
          <PencilLine className="w-4 h-4 mr-2" />
          {match.status === 'completed' ? 'Editar placar' : 'Finalizar partida'}
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resultado da partida</DialogTitle>
          <DialogDescription>
            Ao salvar, a partida sera marcada como <strong>Finalizada</strong>.
            {isGroupMatch && ' Empates sao permitidos na fase de grupos.'}
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

          {!isGroupMatch && (
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
                    <AccordionTrigger className="py-2">Informar gols nos penaltis</AccordionTrigger>
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
                          />
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}
            </div>
          )}

          {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}

          <DialogFooter>
            <Button type="submit">Salvar e finalizar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
