'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArchiveSummaryCard } from '@/components/tournament/archive-match-list'
import { Loading } from '@/components/tournament/loading'
import { Navigation } from '@/components/tournament/navigation'
import { Button } from '@/components/ui/button'
import { fetchTournamentArchiveSummaries } from '@/lib/tournament-archive-repository'
import { TournamentArchiveSummary } from '@/lib/types'
import { Archive, Home } from 'lucide-react'

export default function HistoryPage() {
  const [archives, setArchives] = useState<TournamentArchiveSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    fetchTournamentArchiveSummaries()
      .then((data) => {
        if (active) setArchives(data)
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof Error ? err.message : 'Erro ao carregar histórico.')
        }
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <>
      <Navigation />
      <main className="min-h-screen pb-24 md:pt-24 md:pb-8">
        <motion.div className="container mx-auto px-4 py-8 space-y-6">
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-4 mb-2">
              <motion.div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#d8a844] to-[#6c4d15] flex items-center justify-center">
                <Archive className="w-6 h-6 text-foreground" />
              </motion.div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">Histórico</h1>
                <p className="text-sm text-muted-foreground">
                  Campeonatos finalizados e salvos
                </p>
              </div>
            </div>
          </motion.div>

          {isLoading && <Loading />}

          {error && (
            <p className="text-sm text-red-400 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
              {error}
              <span className="block mt-1 text-muted-foreground">
                Rode a migration 009_tournament_archives.sql no Supabase se a tabela ainda não existir.
              </span>
            </p>
          )}

          {!isLoading && !error && archives.length === 0 && (
            <motion.div className="glass rounded-xl p-8 text-center space-y-4">
              <p className="text-muted-foreground">Nenhum campeonato salvo ainda.</p>
              <p className="text-sm text-muted-foreground">
                Quando terminar um torneio, use Salvar no histórico no painel do operador.
              </p>
              <Link href="/">
                <Button variant="outline">
                  <Home className="w-4 h-4 mr-2" />
                  Voltar ao início
                </Button>
              </Link>
            </motion.div>
          )}

          {!isLoading && archives.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {archives.map((summary) => (
                <ArchiveSummaryCard key={summary.id} summary={summary} />
              ))}
            </motion.div>
          )}
        </motion.div>
      </main>
    </>
  )
}
