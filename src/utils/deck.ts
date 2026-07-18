import type { Card, Suit, Rank } from '../types'

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades']
const RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']

export function createDeck(): Card[] {
  const deck: Card[] = []
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank })
    }
  }
  return deck
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export function dealCards(deck: Card[], count: number, handsCount: number): { hands: Card[][]; remainingDeck: Card[] } {
  const hands: Card[][] = Array.from({ length: handsCount }, () => [])
  let idx = 0
  for (let i = 0; i < count; i++) {
    for (let h = 0; h < handsCount; h++) {
      hands[h].push(deck[idx++])
    }
  }
  return { hands, remainingDeck: deck.slice(idx) }
}

export function getSuitSymbol(suit: Suit): string {
  const map: Record<Suit, string> = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' }
  return map[suit]
}

export function getSuitColor(suit: Suit): string {
  return suit === 'hearts' || suit === 'diamonds' ? 'text-red-500' : 'text-white'
}

export function cardToString(card: Card): string {
  return `${card.rank}${getSuitSymbol(card.suit)}`
}
