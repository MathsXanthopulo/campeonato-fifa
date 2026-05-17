'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArchiveDetailView } from '@/components/tournament/archive-match-list'
import { Loading } from '@/components/tournament/loading'
import { Navigation } from '@/components/tournament/navigation'
import { Button } from '@/components/ui/button'
import { fetchTournamentArchiveById } from '@/lib/tournament-archive-repository'
import { TournamentArchive } from '@/lib/types'
import { ArrowLeft } from 'lucide-react'

export default function HistoryDetailPage() {
  const params = useParams()
  const id = typeof params.id === 'string' ? params.id : ''
  const [archive, setArchive] = useState<TournamentArchive | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    let active = true
    fetchTournamentArchiveById(id)
      .then((data) => {
        if (!active) return
        if (!data) setError('Campeonato não encontrado.')
        else setArchive(data)
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof Error ? err.message : 'Erro ao carregar campeonato.')
        }
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })
    return () => {
      active = false
    }
  }, [id])

  return (
    <>
      <Navigation />
      <main className="min-h-screen pb-24 md:pt-24 md:pb-8">
        <div className="container mx-auto px-4 py-8 space-y-6">
          <Link href="/history">
            <Button variant="ghost" size="sm" className="mb-2">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao histórico
            </Button>
          </Link>

          {isLoading && <Loading />}

          {error && (
            <p className="text-sm text-red-400 rounded-lg border border-red-500/30 px-4 py-3">
              {error}
            </p>
          )}

          {archive && <ArchiveDetailView archive={archive} />}
        </div>
      </main>
    </>
  )
}
