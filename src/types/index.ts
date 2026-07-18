export type GamePhase = 'idle' | 'preflop' | 'flop' | 'turn' | 'river' | 'showdown'

export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades'
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A'

export interface Card {
  suit: Suit
  rank: Rank
}

export type ActionType = 'fold' | 'check' | 'call' | 'bet' | 'raise' | 'all-in' | 'rebuy' | 'sit_out' | 'return'

export interface Action {
  id: string
  type: ActionType
  playerId: string
  amount: number
  timestamp: number
  street: GamePhase
}

export interface Player {
  id: string
  name: string
  stack: number
  initialStack: number
  isActive: boolean
  isSittingOut: boolean
  cards: Card[]
  hasCards: boolean
  order: number
}

export interface PlayerPosition {
  seatIndex: number
  isDealer: boolean
  isSmallBlind: boolean
  isBigBlind: boolean
  isCurrentTurn: boolean
}

export interface Snapshot {
  players: Player[]
  pot: number
  currentBet: number
  playerBets: Record<string, number>
  playerFolded: string[]
  playerAllIn: string[]
  checkedThisRound: string[]
  currentTurnIndex: number
  phase: GamePhase
  communityCards: Card[]
}

export interface GameState {
  tableId: string
  tableName: string
  createdAt: number
  handsPlayed: number
  players: Player[]
  dealerIndex: number
  smallBlindIndex: number
  bigBlindIndex: number
  currentTurnIndex: number
  sbAmount: number
  bbAmount: number
  pot: number
  currentBet: number
  phase: GamePhase
  communityCards: Card[]
  deck: Card[]
  playerBets: Record<string, number>
  playerFolded: string[]
  playerAllIn: string[]
  checkedThisRound: string[]
  actionHistory: Action[]
  undoStack: Snapshot[]
  isDealerMode: boolean
  streetActionComplete: boolean
  winnerId: string
  winnerAmount: number
  communityCardsStr: string[]
}

export interface Winner {
  playerId: string
  amount: number
}

export interface TableConfig {
  id: string
  name: string
  sbAmount: number
  bbAmount: number
}

export interface GameSettings {
  defaultSb: number
  defaultBb: number
  defaultStack: number
  theme: 'dark' | 'light'
  soundEnabled: boolean
  hapticEnabled: boolean
  playerMode: 'dealer' | 'player'
}
