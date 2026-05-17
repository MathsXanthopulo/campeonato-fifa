import { Match } from '../types'
import { QualificationPlan } from './types'

export interface GroupStanding {
  playerId: string
  played: number
  wins: number
  draws: number
  losses: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  points: number
}

export function computeGroupStandings(
  playerIds: string[],
  groupMatches: Match[]
): GroupStanding[] {
  const standings = new Map<string, GroupStanding>()

  for (const playerId of playerIds) {
    standings.set(playerId, {
      playerId,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
    })
  }

  for (const match of groupMatches) {
    if (match.status !== 'completed' || match.score1 === null || match.score2 === null) {
      continue
    }
    if (!match.player1Id || !match.player2Id) continue

    const p1 = standings.get(match.player1Id)
    const p2 = standings.get(match.player2Id)
    if (!p1 || !p2) continue

    p1.played += 1
    p2.played += 1
    p1.goalsFor += match.score1
    p1.goalsAgainst += match.score2
    p2.goalsFor += match.score2
    p2.goalsAgainst += match.score1

    if (match.score1 > match.score2) {
      p1.wins += 1
      p1.points += 3
      p2.losses += 1
    } else if (match.score2 > match.score1) {
      p2.wins += 1
      p2.points += 3
      p1.losses += 1
    } else {
      p1.draws += 1
      p2.draws += 1
      p1.points += 1
      p2.points += 1
    }
  }

  return [...standings.values()].map((row) => ({
    ...row,
    goalDifference: row.goalsFor - row.goalsAgainst,
  }))
}

/** Desempate: pontos → saldo de gols → gols marcados. */
function compareStandings(a: GroupStanding, b: GroupStanding): number {
  if (b.points !== a.points) return b.points - a.points
  if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference
  if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor
  return a.playerId.localeCompare(b.playerId)
}

export function rankGroup(
  playerIds: string[],
  groupMatches: Match[]
): GroupStanding[] {
  const standings = computeGroupStandings(playerIds, groupMatches)
  return standings.sort((a, b) => compareStandings(a, b))
}

export interface QualificationResult {
  groupWinners: string[]
  others: string[]
  all: string[]
}

export function computeQualificationResult(
  groups: { id: string; playerIds: string[] }[],
  matches: Match[],
  plan: QualificationPlan
): QualificationResult {
  const groupWinners: string[] = []
  const others: string[] = []
  const runnersUp: { playerId: string; standing: GroupStanding }[] = []
  const thirdPlaces: { playerId: string; standing: GroupStanding }[] = []

  groups.forEach((group) => {
    const groupMatches = matches.filter(
      (match) => match.phase === 'groups' && match.groupId === group.id
    )
    const ranking = rankGroup(group.playerIds, groupMatches)

    if (ranking[0]) {
      groupWinners.push(ranking[0].playerId)
    }

    ranking.slice(1, plan.qualifyPerGroup).forEach((row) => others.push(row.playerId))

    if (plan.qualifyPerGroup < ranking.length) {
      runnersUp.push({
        playerId: ranking[plan.qualifyPerGroup].playerId,
        standing: ranking[plan.qualifyPerGroup],
      })
    }

    if (plan.bestThirdPlaces > 0 && ranking.length > 2) {
      thirdPlaces.push({
        playerId: ranking[2].playerId,
        standing: ranking[2],
      })
    }
  })

  if (plan.bestSecondPlaces > 0) {
    runnersUp
      .sort((a, b) => compareStandings(a.standing, b.standing))
      .slice(0, plan.bestSecondPlaces)
      .forEach((entry) => others.push(entry.playerId))
  }

  if (plan.bestThirdPlaces > 0) {
    thirdPlaces
      .sort((a, b) => compareStandings(a.standing, b.standing))
      .slice(0, plan.bestThirdPlaces)
      .forEach((entry) => others.push(entry.playerId))
  }

  return {
    groupWinners,
    others,
    all: [...groupWinners, ...others],
  }
}

export function computeQualifiedPlayers(
  groups: { id: string; playerIds: string[] }[],
  matches: Match[],
  plan: QualificationPlan
): string[] {
  return computeQualificationResult(groups, matches, plan).all
}

/** Líderes de grupo têm bye nas quartas quando há preliminar para completar o mata-mata. */
export function groupWinnersGetQuarterByes(
  qualifiedCount: number,
  targetKnockoutSize: number,
  groupWinnerCount: number
): boolean {
  if (groupWinnerCount === 0 || targetKnockoutSize < 8) return false

  const surplus = qualifiedCount - targetKnockoutSize
  if (surplus <= 0) return false

  const playInMatches = surplus
  const byeCount = qualifiedCount - playInMatches * 2

  return byeCount > 0
}

export function areGroupMatchesComplete(
  groups: { id: string; playerIds: string[] }[],
  matches: Match[]
): boolean {
  return groups.every((group) => {
    const groupMatches = matches.filter(
      (match) => match.phase === 'groups' && match.groupId === group.id
    )
    return (
      groupMatches.length > 0 &&
      groupMatches.every((match) => match.status === 'completed')
    )
  })
}
