import { Player } from '../types'
import { buildQualificationPlan, planGroupSizes } from './group-plan'
import { FormatGroup, FormatGroupMatch } from './types'
import { groupLetter, shuffle, toFormatPlayer } from './utils'

function buildRoundRobinMatches(groupId: string, playerIds: string[]): FormatGroupMatch[] {
  const matches: FormatGroupMatch[] = []
  let index = 0

  for (let i = 0; i < playerIds.length; i += 1) {
    for (let j = i + 1; j < playerIds.length; j += 1) {
      matches.push({
        id: `${groupId}-m${index}`,
        groupId,
        player1Id: playerIds[i],
        player2Id: playerIds[j],
        status: 'pending',
      })
      index += 1
    }
  }

  return matches
}

export function generateGroups(
  players: Player[],
  shufflePlayers = true
): { groups: FormatGroup[]; qualification: ReturnType<typeof buildQualificationPlan> } {
  const ordered = shufflePlayers ? shuffle(players) : [...players]
  const groupSizes = planGroupSizes(ordered.length)
  const qualification = buildQualificationPlan(ordered.length, groupSizes)

  const groups: FormatGroup[] = []
  let cursor = 0

  groupSizes.forEach((size, index) => {
    const groupPlayers = ordered.slice(cursor, cursor + size)
    cursor += size
    const groupId = `group-${groupLetter(index).toLowerCase()}`
    const playerIds = groupPlayers.map((player) => player.id)

    groups.push({
      id: groupId,
      name: `Grupo ${groupLetter(index)}`,
      players: groupPlayers.map(toFormatPlayer),
      matches: buildRoundRobinMatches(groupId, playerIds),
    })
  })

  return { groups, qualification }
}
