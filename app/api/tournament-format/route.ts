import { NextRequest, NextResponse } from 'next/server'
import { generateTournamentFormat } from '@/lib/tournament-format'
import { TournamentMode } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const mode = (body.mode as TournamentMode) ?? 'knockout'
    const shuffle = body.shuffle !== false
    const players = Array.isArray(body.players) ? body.players : []

    if (players.length < 2) {
      return NextResponse.json(
        { error: 'Informe pelo menos 2 jogadores.' },
        { status: 400 }
      )
    }

    const format = generateTournamentFormat({
      players: players.map(
        (
          player: { id?: string; name: string; team?: string },
          index: number
        ) => ({
          id: player.id ?? String(index + 1),
          name: player.name,
          team: player.team ?? '',
          avatar: '',
          overall: 80,
          createdAt: new Date().toISOString(),
        })
      ),
      mode,
      shuffle,
    })

    return NextResponse.json(format)
  } catch {
    return NextResponse.json({ error: 'Payload invalido.' }, { status: 400 })
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const count = Number.parseInt(searchParams.get('count') ?? '0', 10)
  const mode = (searchParams.get('mode') as TournamentMode) ?? 'knockout'

  if (count < 2) {
    return NextResponse.json(
      { error: 'Use count>=2 para simular o formato.' },
      { status: 400 }
    )
  }

  const players = Array.from({ length: count }, (_, index) => ({
    id: String(index + 1),
    name: `Jogador ${index + 1}`,
    team: `Time ${index + 1}`,
    avatar: '',
    overall: 80,
    createdAt: new Date().toISOString(),
  }))

  const format = generateTournamentFormat({ players, mode, shuffle: true })
  return NextResponse.json(format)
}
