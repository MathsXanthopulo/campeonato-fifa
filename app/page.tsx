"use client"

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useTournament } from '@/lib/tournament-context'
import { getBracketSize } from '@/lib/bracket'
import { generateTournamentFormat } from '@/lib/tournament-format'
import { Player } from '@/lib/types'
import { Navigation } from '@/components/tournament/navigation'
import { TournamentBanner } from '@/components/tournament/tournament-banner'
import { ChampionSection } from '@/components/tournament/champion-section'
import { PlayerCard } from '@/components/tournament/player-card'
import { Loading } from '@/components/tournament/loading'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Trophy, ChevronRight, Pencil, Trash2, UserPlus } from 'lucide-react'

interface RegisteredPlayerCardProps {
  player: Player
  players: Player[]
  isChampion: boolean
  canDeletePlayer: boolean
  onUpdatePlayer: (playerId: string, updates: Partial<Player>) => void
  onDeletePlayer: (playerId: string) => void
  onFeedback: (message: string) => void
}

function RegisteredPlayerCard({
  player,
  players,
  isChampion,
  canDeletePlayer,
  onUpdatePlayer,
  onDeletePlayer,
  onFeedback,
}: RegisteredPlayerCardProps) {
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editName, setEditName] = useState(player.name)
  const [editTeam, setEditTeam] = useState(player.team)
  const [editError, setEditError] = useState('')

  useEffect(() => {
    if (!isEditOpen) {
      return
    }

    setEditName(player.name)
    setEditTeam(player.team)
    setEditError('')
  }, [isEditOpen, player])

  const handleEditPlayer = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedName = editName.trim()
    const trimmedTeam = editTeam.trim()

    if (!trimmedName || !trimmedTeam) {
      setEditError('Preencha o nome da pessoa e o nome do time.')
      return
    }

    const duplicatedPlayer = players.some(
      (existingPlayer) =>
        existingPlayer.id !== player.id &&
        existingPlayer.name.trim().toLocaleLowerCase() === trimmedName.toLocaleLowerCase()
    )

    if (duplicatedPlayer) {
      setEditError('Ja existe outro inscrito com esse nome.')
      return
    }

    onUpdatePlayer(player.id, {
      name: trimmedName,
      team: trimmedTeam,
    })

    setIsEditOpen(false)
    onFeedback(`${trimmedName} foi atualizado com sucesso.`)
  }

  const handleDeletePlayer = () => {
    if (!canDeletePlayer) {
      return
    }

    const hasConfirmedDelete = window.confirm(`Deseja apagar o player ${player.name}?`)
    if (!hasConfirmedDelete) {
      return
    }

    onDeletePlayer(player.id)
    onFeedback(`${player.name} foi removido da lista de inscritos.`)
  }

  return (
    <PlayerCard
      player={player}
      size="md"
      showOverall={false}
      isChampion={isChampion}
      actionSlot={
        <>
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogTrigger asChild>
              <Button
                type="button"
                size="icon-sm"
                variant="secondary"
                className="h-7 w-7 rounded-full bg-black/60 text-white hover:bg-black/80"
              >
                <Pencil className="w-3.5 h-3.5" />
              </Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar inscrito</DialogTitle>
                <DialogDescription>
                  Atualize o nome da pessoa e o time desse player.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleEditPlayer} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor={`edit-player-name-${player.id}`}>Nome/Apelido</Label>
                  <Input
                    id={`edit-player-name-${player.id}`}
                    value={editName}
                    onChange={(event) => setEditName(event.target.value)}
                    placeholder="Ex.: Mateus"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`edit-player-team-${player.id}`}>Nome do time</Label>
                  <Input
                    id={`edit-player-team-${player.id}`}
                    value={editTeam}
                    onChange={(event) => setEditTeam(event.target.value)}
                    placeholder="Ex.: Real Madrid"
                  />
                </div>

                {editError && (
                  <p className="text-sm text-destructive">{editError}</p>
                )}

                <DialogFooter>
                  <Button type="submit">Salvar alteracoes</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Button
            type="button"
            size="icon-sm"
            variant="destructive"
            disabled={!canDeletePlayer}
            onClick={handleDeletePlayer}
            className="h-7 w-7 rounded-full"
            title={
              canDeletePlayer
                ? 'Apagar inscrito'
                : 'A exclusao fica disponivel somente antes do torneio iniciar'
            }
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </>
      }
    />
  )
}

export default function HomePage() {
  const {
    state,
    isLoading,
    getPlayer,
    addPlayer,
    updatePlayer,
    deletePlayer,
    setTournamentMode,
  } = useTournament()
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)
  const [playerName, setPlayerName] = useState('')
  const [teamName, setTeamName] = useState('')
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [formError, setFormError] = useState('')
  const sortedPlayers = useMemo(
    () => (state ? [...state.players].sort((a, b) => a.createdAt.localeCompare(b.createdAt)) : []),
    [state]
  )

  const formatPreview = useMemo(() => {
    if (!state || state.players.length < 2) return null
    return generateTournamentFormat({
      players: state.players,
      mode: state.tournament.mode,
      shuffle: false,
    })
  }, [state])
  
  if (isLoading || !state) {
    return (
      <main className="min-h-screen pb-20 md:pt-24">
        <Loading />
      </main>
    )
  }
  
  const { tournament, players, matches } = state
  const champion = getPlayer(tournament.championId)
  const completedMatches = matches.filter((match) => match.status === 'completed')
  const isRegistrationClosed = tournament.status !== 'setup'
  const canRegister = !isRegistrationClosed
  const bracketSlots = getBracketSize(players.length)
  const canDeletePlayer = tournament.status === 'setup'

  const registerButtonLabel = isRegistrationClosed
    ? 'Inscricoes fechadas'
    : 'Cadastrar agora'

  const handleRegisterPlayer = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFeedbackMessage('')
    setFormError('')

    const trimmedPlayerName = playerName.trim()
    const trimmedTeamName = teamName.trim()

    if (!trimmedPlayerName || !trimmedTeamName) {
      setFormError('Preencha o nome da pessoa e o nome do time.')
      return
    }

    if (!canRegister) {
      setFormError('As inscricoes nao estao disponiveis no momento.')
      return
    }

    const playerAlreadyExists = players.some(
      (player) => player.name.trim().toLocaleLowerCase() === trimmedPlayerName.toLocaleLowerCase()
    )

    if (playerAlreadyExists) {
      setFormError('Ja existe um inscrito com esse nome.')
      return
    }

    addPlayer({
      name: trimmedPlayerName,
      team: trimmedTeamName,
      avatar: '',
      overall: 80,
    })

    setPlayerName('')
    setTeamName('')
    setIsRegisterOpen(false)
    setFeedbackMessage(`${trimmedPlayerName} foi inscrito com sucesso.`)
  }
  
  return (
    <>
      <Navigation />
      <main className="min-h-screen pb-24 md:pt-24 md:pb-8">
        <div className="container mx-auto px-4 py-8 space-y-8">
          <TournamentBanner
            title={tournament.name}
            status={tournament.status}
            playerCount={players.length}
          />
          
          {champion && (
            <ChampionSection champion={champion} />
          )}

          {tournament.status === 'setup' && (
            <motion.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-xl p-6 space-y-4"
            >
              <motion.div>
                <h3 className="font-semibold">Modalidade do campeonato</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  O formato da chave e dos grupos e montado automaticamente conforme os inscritos.
                </p>
              </motion.div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={tournament.mode === 'knockout' ? 'default' : 'outline'}
                  onClick={() => setTournamentMode('knockout')}
                >
                  Apenas mata-mata
                </Button>
                <Button
                  type="button"
                  variant={tournament.mode === 'groups_knockout' ? 'default' : 'outline'}
                  onClick={() => setTournamentMode('groups_knockout')}
                >
                  Grupos + mata-mata
                </Button>
              </div>

              {formatPreview && (
                <p className="text-xs text-muted-foreground rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
                  {formatPreview.mode === 'knockout' ? (
                    <>
                      Mata-mata com {formatPreview.knockout.bracketSize} vagas
                      {formatPreview.knockout.preliminaryMatches.length > 0 &&
                        ` (${formatPreview.knockout.preliminaryMatches.length} preliminar(es))`}
                      .
                    </>
                  ) : (
                    formatPreview.qualification?.description ??
                    'Fase de grupos seguida de mata-mata.'
                  )}
                </p>
              )}
            </motion.section>
          )}

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="glass rounded-xl p-6 hover:glow-blue transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-cyan to-neon-blue flex items-center justify-center">
                    <UserPlus className="w-6 h-6 text-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Cadastro para o campeonato</h3>
                    <p className="text-sm text-muted-foreground">
                      Informe o nome da pessoa e o time para entrar na chave.
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {players.length} inscrito{players.length === 1 ? '' : 's'}
                      {players.length >= 2 && (
                        <span className="ml-1 text-muted-foreground/80">
                          · chave de {bracketSlots} vagas
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <Dialog
                  open={isRegisterOpen}
                  onOpenChange={(open) => {
                    setIsRegisterOpen(open)
                    if (!open) {
                      setFormError('')
                    }
                  }}
                >
                  <DialogTrigger asChild>
                    <Button disabled={!canRegister}>
                      <UserPlus className="w-4 h-4 mr-2" />
                      {registerButtonLabel}
                    </Button>
                  </DialogTrigger>

                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Cadastro de player</DialogTitle>
                      <DialogDescription>
                        Preencha os dados para entrar no torneio. A chave se ajusta automaticamente a quantidade de inscritos.
                      </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleRegisterPlayer} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="player-name">Nome/Apelido</Label>
                        <Input
                          id="player-name"
                          value={playerName}
                          onChange={(event) => setPlayerName(event.target.value)}
                          placeholder="Ex.: Mateus"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="team-name">Nome do time</Label>
                        <Input
                          id="team-name"
                          value={teamName}
                          onChange={(event) => setTeamName(event.target.value)}
                          placeholder="Ex.: Real Madrid"
                        />
                      </div>

                      {formError && (
                        <p className="text-sm text-destructive">{formError}</p>
                      )}

                      <DialogFooter>
                        <Button type="submit" disabled={!canRegister}>
                          Confirmar cadastro
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {!canRegister && (
                <p className="mt-4 text-sm text-muted-foreground">
                  {isRegistrationFull
                    ? 'As vagas desta chave ja foram preenchidas.'
                    : 'As inscricoes ficam disponiveis somente antes do inicio do torneio.'}
                </p>
              )}
            </motion.div>

            <Link href="/bracket">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="glass rounded-xl p-6 flex items-center justify-between group cursor-pointer hover:glow-blue transition-shadow h-full"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Ver Chaveamento</h3>
                    <p className="text-sm text-muted-foreground">Acompanhe todas as partidas</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </motion.div>
            </Link>
          </section>

          {feedbackMessage && (
            <div className="glass rounded-xl px-4 py-3 text-sm text-green-400">
              {feedbackMessage}
            </div>
          )}
          
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Inscritos</h2>
              <span className="text-sm text-muted-foreground">{players.length} participantes</span>
            </div>

            {!canDeletePlayer && sortedPlayers.length > 0 && (
              <p className="mb-4 text-sm text-muted-foreground">
                A edicao continua liberada, mas apagar player fica disponivel somente antes do torneio iniciar.
              </p>
            )}

            {sortedPlayers.length === 0 ? (
              <div className="glass rounded-xl p-8 text-center text-muted-foreground">
                <p>Ninguem se cadastrou ainda.</p>
              </div>
            ) : (
              <motion.div
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
                initial="hidden"
                animate="visible"
                variants={{
                  visible: {
                    transition: {
                      staggerChildren: 0.05,
                    },
                  },
                }}
              >
                {sortedPlayers.map((player) => (
                  <motion.div
                    key={player.id}
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0 },
                    }}
                  >
                    <RegisteredPlayerCard
                      player={player}
                      isChampion={player.id === tournament.championId}
                      players={players}
                      canDeletePlayer={canDeletePlayer}
                      onUpdatePlayer={updatePlayer}
                      onDeletePlayer={deletePlayer}
                      onFeedback={setFeedbackMessage}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </section>
          
          <section>
            <h2 className="text-xl font-bold mb-6">Partidas Recentes</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedMatches.slice(0, 6).map((match) => {
                const player1 = getPlayer(match.player1Id)
                const player2 = getPlayer(match.player2Id)
                
                return (
                  <motion.div
                    key={match.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass rounded-xl p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-gradient-to-br from-neon-blue to-neon-purple ${match.winnerId === player1?.id ? 'ring-2 ring-gold' : ''}`}>
                          {player1?.name.charAt(0) || '?'}
                        </div>
                        <span className={`text-sm font-medium ${match.winnerId === player1?.id ? 'text-gold' : ''}`}>
                          {player1?.name || 'TBD'}
                        </span>
                      </div>
                      <span className="font-bold">
                        <span className={match.winnerId === player1?.id ? 'text-gold' : ''}>{match.score1}</span>
                        {' - '}
                        <span className={match.winnerId === player2?.id ? 'text-gold' : ''}>{match.score2}</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${match.winnerId === player2?.id ? 'text-gold' : ''}`}>
                          {player2?.name || 'TBD'}
                        </span>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-gradient-to-br from-neon-purple to-neon-cyan ${match.winnerId === player2?.id ? 'ring-2 ring-gold' : ''}`}>
                          {player2?.name.charAt(0) || '?'}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
            
            {completedMatches.length === 0 && (
              <div className="glass rounded-xl p-8 text-center text-muted-foreground">
                <p>Nenhuma partida finalizada ainda</p>
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  )
}
