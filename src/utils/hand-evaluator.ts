const RANK_ORDER: Record<string, number> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
  '9': 9, 'T': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14,
}

const HAND_NAMES = [
  'High Card', 'Pair', 'Two Pair', 'Three of a Kind',
  'Straight', 'Flush', 'Full House', 'Four of a Kind',
  'Straight Flush', 'Royal Flush',
]

const HAND_STRENGTH_PCT = [10, 25, 35, 45, 55, 65, 75, 85, 95, 100]

interface Card {
  rank: string
  suit: string
}

interface HandResult {
  rank: number // 0-9
  name: string
  score: number // detailed score for comparison
  cards: Card[]
  strengthPct: number
}

function parseCard(s: string): Card {
  const rank = s.length === 3 ? 'T' : s[0].toUpperCase()
  const suit = s.length === 3 ? s[2] : s[1]
  return { rank, suit: suit.toLowerCase() }
}

function rankValue(r: string): number {
  return RANK_ORDER[r] || 0
}

function isFlush(cards: Card[]): boolean {
  return cards.every(c => c.suit === cards[0].suit)
}

function isStraight(vals: number[]): { is: boolean; high: number } {
  const sorted = [...new Set(vals)].sort((a, b) => b - a)
  if (sorted.length < 5) return { is: false, high: 0 }
  // Normal straight
  for (let i = 0; i <= sorted.length - 5; i++) {
    if (sorted[i] - sorted[i + 4] === 4) {
      return { is: true, high: sorted[i] }
    }
  }
  // Ace-low straight (A-2-3-4-5)
  if (sorted.includes(14) && sorted.includes(2) && sorted.includes(3) && sorted.includes(4) && sorted.includes(5)) {
    return { is: true, high: 5 }
  }
  return { is: false, high: 0 }
}

function evaluate5(cards: Card[]): HandResult {
  const vals = cards.map(c => rankValue(c.rank)).sort((a, b) => b - a)
  const counts: Record<number, number[]> = {}
  for (const v of vals) {
    if (!counts[v]) counts[v] = []
    counts[v].push(v)
  }
  const groups = Object.entries(counts)
    .map(([v, arr]) => ({ val: parseInt(v), count: arr.length }))
    .sort((a, b) => b.count - a.count || b.val - a.val)

  const flush = isFlush(cards)
  const straight = isStraight(vals)
  const isAceLowStraight = straight.is && straight.high === 5

  const kickers = groups.map(g => g.val)
  const scoreBase = (idx: number, kickers: number[]) => {
    let s = idx * 1000000
    for (let i = 0; i < kickers.length; i++) {
      s += kickers[i] * Math.pow(15, 4 - i)
    }
    return s
  }

  if (flush && straight.is) {
    if (straight.high === 14 && !isAceLowStraight) {
      return { rank: 9, name: 'Royal Flush', score: scoreBase(9, []), cards, strengthPct: 100 }
    }
    return { rank: 8, name: 'Straight Flush', score: scoreBase(8, [straight.high]), cards, strengthPct: 95 }
  }
  if (groups[0].count === 4) {
    return { rank: 7, name: `Four of a Kind (${groups[0].val})`, score: scoreBase(7, [groups[0].val, ...kickers.filter(k => k !== groups[0].val)]), cards, strengthPct: 85 }
  }
  if (groups[0].count === 3 && groups[1]?.count === 2) {
    return { rank: 6, name: `Full House (${groups[0].val} over ${groups[1].val})`, score: scoreBase(6, [groups[0].val, groups[1].val]), cards, strengthPct: 75 }
  }
  if (flush) {
    return { rank: 5, name: 'Flush', score: scoreBase(5, vals), cards, strengthPct: 65 }
  }
  if (straight.is) {
    const high = straight.high
    const name = high === 14 && !isAceLowStraight ? 'Royal Flush' : 'Straight'
    return { rank: 4, name: `Straight (${high} high)`, score: scoreBase(4, [high]), cards, strengthPct: 55 }
  }
  if (groups[0].count === 3) {
    return { rank: 3, name: `Three of a Kind (${groups[0].val})`, score: scoreBase(3, [groups[0].val, ...kickers.filter(k => k !== groups[0].val)]), cards, strengthPct: 45 }
  }
  if (groups[0].count === 2 && groups[1]?.count === 2) {
    const pairs = [groups[0].val, groups[1].val].sort((a, b) => b - a)
    return { rank: 2, name: `Two Pair (${pairs[0]} & ${pairs[1]})`, score: scoreBase(2, [...pairs, ...kickers.filter(k => k !== pairs[0] && k !== pairs[1])]), cards, strengthPct: 35 }
  }
  if (groups[0].count === 2) {
    return { rank: 1, name: `Pair of ${groups[0].val}`, score: scoreBase(1, [groups[0].val, ...kickers.filter(k => k !== groups[0].val)]), cards, strengthPct: 25 }
  }
  return { rank: 0, name: `High Card (${vals[0]})`, score: scoreBase(0, vals), cards, strengthPct: 10 }
}

function combinations(arr: Card[], k: number): Card[][] {
  if (k === 0) return [[]]
  if (arr.length < k) return []
  const [first, ...rest] = arr
  const withFirst = combinations(rest, k - 1).map(c => [first, ...c])
  const withoutFirst = combinations(rest, k)
  return [...withFirst, ...withoutFirst]
}

export function evaluateHand(holeCards: string[], communityCards: string[]): HandResult | null {
  if (holeCards.length !== 2) return null
  const all = [...holeCards, ...communityCards].map(parseCard)
  if (all.length < 5) return null
  const combos = combinations(all, 5)
  let best: HandResult | null = null
  for (const combo of combos) {
    const result = evaluate5(combo)
    if (!best || result.score > best.score) {
      best = result
    }
  }
  return best
}

export function preflopStrength(holeCards: string[]): HandResult | null {
  if (holeCards.length !== 2) return null
  const cards = holeCards.map(parseCard)
  const vals = cards.map(c => rankValue(c.rank)).sort((a, b) => b - a)
  const suited = cards[0].suit === cards[1].suit
  const pair = vals[0] === vals[1]

  if (pair) {
    const pct = vals[0] === 14 ? 85 : vals[0] === 13 ? 75 : vals[0] === 12 ? 70 : vals[0] === 11 ? 65 : vals[0] === 10 ? 60 : 55
    return { rank: 1, name: `Pair of ${vals[0]}`, score: pct, cards, strengthPct: pct }
  }

  // Simple preflop estimate based on card ranks and suitedness
  const high = vals[0]
  const low = vals[1]
  let pct = 10
  if (high === 14 && low === 13) pct = suited ? 45 : 40
  else if (high === 14 && low === 12) pct = suited ? 42 : 37
  else if (high === 14 && low >= 11) pct = suited ? 38 : 33
  else if (high === 14) pct = suited ? 33 : 28
  else if (high === 13 && low >= 11) pct = suited ? 32 : 27
  else if (high === 13 && low >= 10) pct = suited ? 28 : 23
  else if (high >= 11 && low >= 11) pct = suited ? 27 : 22
  else if (high >= 10 && low >= 10) pct = suited ? 22 : 18
  else if (high - low <= 2 && suited) pct = 20
  else if (high - low <= 2) pct = 16
  else if (suited) pct = 15

  const name = suited ? `${vals[0]}${vals[1]}s` : `${vals[0]}${vals[1]}o`
  return { rank: 0, name, score: pct, cards, strengthPct: pct }
}

export function getHandSummary(holeCards: string[], communityCards: string[]): { name: string; pct: number } | null {
  const full = communityCards.length >= 3 ? evaluateHand(holeCards, communityCards) : null
  if (full) return { name: full.name, pct: full.strengthPct }

  const pre = preflopStrength(holeCards)
  if (pre) return { name: pre.name, pct: pre.strengthPct }

  return null
}
