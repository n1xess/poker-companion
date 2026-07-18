import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { GameState, Action, Winner, Card, Snapshot, Player } from '../types'
import { createDeck, shuffleDeck, dealCards } from '../utils/deck'
import {
  calculatePot,
  calculateCallAmount,
  calculateMinRaise,
  findNextActivePlayer,
  countActivePlayers,
  countPlayersInHand,
  isHandComplete,
  takeSnapshot,
  determineNextPhase,
  splitPot,
  rotatePosition,
} from '../utils/game-logic'

function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

interface GameActions {
  setDealerMode: (v: boolean) => void
  startNewHand: (players: Player[]) => void
  performAction: (playerId: string, type: Action['type'], amount: number) => void
  dealStreet: (street: 'flop' | 'turn' | 'river') => void
  finishHand: (winners: Winner[]) => void
  clearWinner: () => void
  setCommunityCardsStr: (cards: string[]) => void
  undo: () => void
  resetGame: () => void
  setTableName: (name: string) => void
}

type GameStore = GameState & GameActions

const initialState: GameState = {
  tableId: generateId(),
  tableName: 'Table 1',
  createdAt: Date.now(),
  handsPlayed: 0,
  players: [],
  dealerIndex: 0,
  smallBlindIndex: 0,
  bigBlindIndex: 1,
  currentTurnIndex: 0,
  sbAmount: 10,
  bbAmount: 20,
  pot: 0,
  currentBet: 0,
  phase: 'idle',
  communityCards: [],
  deck: [],
  playerBets: {},
  playerFolded: [],
  playerAllIn: [],
  checkedThisRound: [],
  actionHistory: [],
  undoStack: [],
  isDealerMode: true,
  streetActionComplete: false,
  winnerId: '',
  winnerAmount: 0,
  communityCardsStr: [] as string[],
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setDealerMode: (v) => set({ isDealerMode: v }),

      setTableName: (name) => set({ tableName: name }),

      startNewHand: (players) => {
        const state = get()
        const activePlayers = players.filter((p) => p.isActive && !p.isSittingOut && p.stack > 0)
        if (activePlayers.length < 2) return

        const deck = shuffleDeck(createDeck())
        const { hands } = dealCards(deck, 2, activePlayers.length)

        const playersWithCards = activePlayers.map((p, i) => {
          const existing = state.players.find(ep => ep.id === p.id)
          return {
            ...p,
            stack: existing ? existing.stack : p.stack,
            cards: hands[i],
            hasCards: true,
          }
        })

        const playerIds = playersWithCards.map((p) => p.id)
        const dealerIdx = state.handsPlayed === 0
          ? 0
          : rotatePosition(state.dealerIndex, playerIds.length)
        const sbIdx = rotatePosition(dealerIdx, playerIds.length)
        const bbIdx = rotatePosition(sbIdx, playerIds.length)

        const sbPlayer = playersWithCards[sbIdx]
        const bbPlayer = playersWithCards[bbIdx]
        const sbAmount = Math.min(state.sbAmount, sbPlayer.stack)
        const bbAmount = Math.min(state.bbAmount, bbPlayer.stack)

        const playerBets: Record<string, number> = {}
        playerBets[sbPlayer.id] = sbAmount
        playerBets[bbPlayer.id] = bbAmount

        const updatedPlayers = playersWithCards.map((p) => {
          if (p.id === sbPlayer.id) return { ...p, stack: p.stack - sbAmount }
          if (p.id === bbPlayer.id) return { ...p, stack: p.stack - bbAmount }
          return p
        })

        const allInPlayers: string[] = []
        if (sbPlayer.stack - sbAmount <= 0) allInPlayers.push(sbPlayer.id)
        if (bbPlayer.stack - bbAmount <= 0) allInPlayers.push(bbPlayer.id)

        const utgIdx = rotatePosition(bbIdx, playerIds.length)
        const firstTurnIdx = findNextActivePlayer(utgIdx, updatedPlayers, [], allInPlayers)

        const actions: Action[] = [
          { id: generateId(), type: 'bet', playerId: sbPlayer.id, amount: sbAmount, timestamp: Date.now(), street: 'preflop' },
          { id: generateId(), type: 'bet', playerId: bbPlayer.id, amount: bbAmount, timestamp: Date.now(), street: 'preflop' },
        ]

        set({
          players: updatedPlayers,
          dealerIndex: dealerIdx,
          smallBlindIndex: sbIdx,
          bigBlindIndex: bbIdx,
          currentTurnIndex: firstTurnIdx,
          pot: sbAmount + bbAmount,
          currentBet: bbAmount,
          phase: 'preflop',
          communityCards: [],
          deck,
          playerBets,
          playerFolded: [],
          playerAllIn: allInPlayers,
          checkedThisRound: [],
          actionHistory: actions,
          undoStack: [],
          handsPlayed: state.handsPlayed + 1,
          streetActionComplete: false,
          winnerId: '',
          winnerAmount: 0,
          communityCardsStr: [],
        })
      },

      performAction: (playerId, type, amount) => {
        const state = get()
        const snapshot = takeSnapshot(
          state.players,
          state.pot,
          state.currentBet,
          state.playerBets,
          state.playerFolded,
          state.playerAllIn,
          state.checkedThisRound,
          state.currentTurnIndex,
          state.phase,
          state.communityCards
        )

        let newPot = state.pot
        const newBets = { ...state.playerBets }
        const newFolded = [...state.playerFolded]
        const newAllIn = [...state.playerAllIn]
        const newChecked = [...state.checkedThisRound]
        let newPlayers = state.players.map((p) => ({ ...p }))
        let newCurrentBet = state.currentBet

        switch (type) {
          case 'fold':
            newFolded.push(playerId)
            break
          case 'check':
            newChecked.push(playerId)
            break
          case 'call': {
            const callAmt = calculateCallAmount(state.currentBet, state.playerBets[playerId] || 0)
            const originalStack = newPlayers.find((p) => p.id === playerId)!.stack
            const actualCall = Math.min(callAmt, originalStack)
            newBets[playerId] = (newBets[playerId] || 0) + actualCall
            newPot += actualCall
            newPlayers = newPlayers.map((p) =>
              p.id === playerId ? { ...p, stack: p.stack - actualCall } : p
            )
            newChecked.push(playerId)
            if (actualCall >= originalStack && originalStack > 0) {
              newAllIn.push(playerId)
            }
            break
          }
          case 'bet':
          case 'raise': {
            const incr = amount
            const totalBet = (newBets[playerId] || 0) + incr
            const p = newPlayers.find((pl) => pl.id === playerId)!
            const actualAmount = Math.min(totalBet, p.stack)
            const diff = actualAmount - (newBets[playerId] || 0)
            newBets[playerId] = actualAmount
            newPot += diff
            newCurrentBet = actualAmount
            newPlayers = newPlayers.map((pl) =>
              pl.id === playerId ? { ...pl, stack: pl.stack - diff } : pl
            )
            newChecked.length = 0
            newChecked.push(playerId)
            if (diff >= p.stack && p.stack > 0) {
              newAllIn.push(playerId)
            }
            break
          }
          case 'all-in': {
            const p = newPlayers.find((pl) => pl.id === playerId)!
            const allInAmount = p.stack
            newBets[playerId] = (newBets[playerId] || 0) + allInAmount
            newPot += allInAmount
            newCurrentBet = Math.max(newCurrentBet, newBets[playerId])
            newPlayers = newPlayers.map((pl) =>
              pl.id === playerId ? { ...pl, stack: 0 } : pl
            )
            newAllIn.push(playerId)
            newChecked.push(playerId)
            break
          }
        }

        const action: Action = {
          id: generateId(),
          type,
          playerId,
          amount,
          timestamp: Date.now(),
          street: state.phase,
        }

        const nextIdx = findNextActivePlayer(
          rotatePosition(state.currentTurnIndex, newPlayers.length),
          newPlayers,
          newFolded,
          newAllIn
        )

        const handDone = isHandComplete(newFolded, newAllIn, newPlayers)
        const nonFolded = newPlayers.filter(
          p => p.isActive && !p.isSittingOut && !newFolded.includes(p.id)
        )

        let newPhase = state.phase
        let newTurnIdx = nextIdx
        let newStreetComplete = false
        let newWinnerId = ''
        let newWinnerAmount = 0

        if (handDone) {
          newTurnIdx = -1
          if (nonFolded.length === 1) {
            newPhase = 'showdown'
            newWinnerId = nonFolded[0].id
            newWinnerAmount = newPot
            newPlayers = newPlayers.map(p =>
              p.id === newWinnerId ? { ...p, stack: p.stack + newPot } : p
            )
            newPot = 0
          } else {
            newStreetComplete = true
          }
        } else if (nonFolded.length > 0) {
          const nonFoldedNonAllIn = nonFolded.filter(p => !newAllIn.includes(p.id))
          const betsEqual = nonFoldedNonAllIn.every(
            p => (newBets[p.id] || 0) === newCurrentBet
          )
          const allActed = nonFoldedNonAllIn.every(
            p => newChecked.includes(p.id)
          )
          if (nonFoldedNonAllIn.length > 0 && betsEqual && allActed) {
            newTurnIdx = -1
            newStreetComplete = true
          }
        }

        set({
          players: newPlayers,
          pot: newPot,
          currentBet: newCurrentBet,
          playerBets: newBets,
          playerFolded: newFolded,
          playerAllIn: newAllIn,
          checkedThisRound: newChecked,
          currentTurnIndex: newTurnIdx,
          phase: newPhase,
          streetActionComplete: newStreetComplete,
          winnerId: newWinnerId,
          winnerAmount: newWinnerAmount,
          actionHistory: [...state.actionHistory, action],
          undoStack: [...state.undoStack.slice(-49), snapshot],
        })
      },

      dealStreet: (street) => {
        const state = get()
        const snapshot = takeSnapshot(
          state.players,
          state.pot,
          state.currentBet,
          state.playerBets,
          state.playerFolded,
          state.playerAllIn,
          state.checkedThisRound,
          state.currentTurnIndex,
          state.phase,
          state.communityCards
        )

        let newCommunity = [...state.communityCards]
        if (street === 'flop') {
          newCommunity = state.deck.slice(0, 3)
        } else {
          const remainingDeck = state.deck.filter(
            (c) => !state.communityCards.some((cc) => cc.suit === c.suit && cc.rank === c.rank)
          )
          if (remainingDeck.length > 0) newCommunity.push(remainingDeck[0])
        }

        const firstActorIdx = findNextActivePlayer(
          rotatePosition(state.dealerIndex, state.players.length),
          state.players,
          state.playerFolded,
          state.playerAllIn
        )

        const allAllIn = state.players.filter(
          p => p.isActive && !p.isSittingOut && !state.playerFolded.includes(p.id)
        ).every(p => state.playerAllIn.includes(p.id))

        set({
          phase: street,
          communityCards: newCommunity,
          playerBets: {},
          currentBet: 0,
          checkedThisRound: [],
          currentTurnIndex: firstActorIdx,
          streetActionComplete: allAllIn,
          undoStack: [...state.undoStack.slice(-49), snapshot],
        })
      },

      finishHand: (winners) => {
        const state = get()
        const split = splitPot(state.pot, winners)
        const newPlayers = state.players.map((p) => {
          const win = split.find((w) => w.playerId === p.id)
          return win ? { ...p, stack: p.stack + win.amount } : p
        })

        set({
          players: newPlayers,
          phase: 'showdown',
          currentTurnIndex: -1,
          streetActionComplete: false,
          winnerId: winners.length === 1 ? winners[0].playerId : '',
          winnerAmount: split[0]?.amount || state.pot,
          actionHistory: [
            ...state.actionHistory,
            ...split.map((w) => ({
              id: generateId(),
              type: 'call' as const,
              playerId: w.playerId,
              amount: w.amount,
              timestamp: Date.now(),
              street: 'showdown' as const,
            })),
          ],
        })
      },

      undo: () => {
        const state = get()
        if (state.undoStack.length === 0) return
        const snap = state.undoStack[state.undoStack.length - 1]
        set({
          ...snap,
          undoStack: state.undoStack.slice(0, -1),
          actionHistory: state.actionHistory.slice(0, -1),
        })
      },

      clearWinner: () => set({ winnerId: '', winnerAmount: 0 }),
      setCommunityCardsStr: (cards) => {
        const suitMap: Record<string, 'spades' | 'hearts' | 'diamonds' | 'clubs'> = {
          s: 'spades', h: 'hearts', d: 'diamonds', c: 'clubs',
        }
        set({
          communityCardsStr: cards,
          communityCards: cards.map(s => ({
            rank: s[0] as Card['rank'],
            suit: suitMap[s[1]] || 'spades',
          })),
        })
      },

      resetGame: () => set({ ...initialState, tableId: generateId() }),
    }),
    {
      name: 'poker-game',
      partialize: (state) => ({
        tableId: state.tableId,
        tableName: state.tableName,
        handsPlayed: state.handsPlayed,
        players: state.players,
        dealerIndex: state.dealerIndex,
        smallBlindIndex: state.smallBlindIndex,
        bigBlindIndex: state.bigBlindIndex,
        currentTurnIndex: state.currentTurnIndex,
        sbAmount: state.sbAmount,
        bbAmount: state.bbAmount,
        pot: state.pot,
        currentBet: state.currentBet,
        phase: state.phase,
        communityCards: state.communityCards,
        playerBets: state.playerBets,
        playerFolded: state.playerFolded,
        playerAllIn: state.playerAllIn,
        checkedThisRound: state.checkedThisRound,
        actionHistory: state.actionHistory,
        isDealerMode: state.isDealerMode,
        communityCardsStr: state.communityCardsStr,
      }),
    }
  )
)
