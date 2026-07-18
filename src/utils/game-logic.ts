import type { Player, Action, GamePhase, Snapshot, Winner, Card } from '../types'

export function calculatePot(bets: Record<string, number>): number {
  return Object.values(bets).reduce((sum, b) => sum + b, 0)
}

export function calculateCallAmount(currentBet: number, playerBet: number): number {
  const diff = currentBet - playerBet
  return Math.max(0, diff)
}

export function calculateMinRaise(currentBet: number, lastRaiseAmount: number, bbAmount: number): number {
  const minIncrement = Math.max(lastRaiseAmount, bbAmount)
  return currentBet + minIncrement
}

export function canCheck(currentBet: number, playerBet: number): boolean {
  return currentBet <= playerBet
}

export function rotatePosition(current: number, totalPlayers: number): number {
  return (current + 1) % totalPlayers
}

export function findNextActivePlayer(
  startIndex: number,
  players: Player[],
  folded: string[],
  allIn: string[]
): number {
  const total = players.length
  let idx = startIndex
  for (let i = 0; i < total; i++) {
    const player = players[idx]
    if (player.isActive && !player.isSittingOut && !folded.includes(player.id) && !allIn.includes(player.id)) {
      if (player.stack > 0) return idx
    }
    idx = rotatePosition(idx, total)
  }
  return -1
}

export function countActivePlayers(players: Player[], folded: string[], allIn: string[]): number {
  return players.filter(p => 
    p.isActive && !p.isSittingOut && !folded.includes(p.id) && !allIn.includes(p.id)
  ).length
}

export function countPlayersInHand(players: Player[], folded: string[], allIn: string[]): number {
  return players.filter(p =>
    p.isActive && !p.isSittingOut && !folded.includes(p.id)
  ).length
}

export function isHandComplete(folded: string[], allIn: string[], players: Player[]): boolean {
  const inHand = players.filter(p =>
    p.isActive && !p.isSittingOut && !folded.includes(p.id)
  )
  if (inHand.length <= 1) return true
  // Hand is complete only when ALL remaining players are all-in
  // (if even one player can still act, hand is not complete)
  return inHand.every(p => allIn.includes(p.id))
}

export function takeSnapshot(
  players: Player[],
  pot: number,
  currentBet: number,
  playerBets: Record<string, number>,
  playerFolded: string[],
  playerAllIn: string[],
  checkedThisRound: string[],
  currentTurnIndex: number,
  phase: GamePhase,
  communityCards: Card[]
): Snapshot {
  return {
    players: JSON.parse(JSON.stringify(players)),
    pot,
    currentBet,
    playerBets: { ...playerBets },
    playerFolded: [...playerFolded],
    playerAllIn: [...playerAllIn],
    checkedThisRound: [...checkedThisRound],
    currentTurnIndex,
    phase,
    communityCards: [...communityCards]
  }
}

export function determineNextPhase(phase: GamePhase): GamePhase {
  const order: GamePhase[] = ['preflop', 'flop', 'turn', 'river', 'showdown']
  const idx = order.indexOf(phase)
  if (idx >= 0 && idx < order.length - 1) return order[idx + 1]
  return 'showdown'
}

export function splitPot(pot: number, winners: Winner[]): Winner[] {
  if (winners.length === 0) return []
  if (winners.length === 1) return [{ ...winners[0], amount: pot }]
  const share = Math.floor(pot / winners.length)
  const remainder = pot - share * winners.length
  return winners.map((w, i) => ({
    ...w,
    amount: share + (i === 0 ? remainder : 0)
  }))
}
