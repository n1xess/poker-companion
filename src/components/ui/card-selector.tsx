import { useState } from 'react'
import { Modal } from './modal'
import { Button } from './button'

const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A']
const SUITS: { sym: string; key: string; color: string }[] = [
  { sym: '♠', key: 's', color: 'text-white' },
  { sym: '♥', key: 'h', color: 'text-red-400' },
  { sym: '♦', key: 'd', color: 'text-red-400' },
  { sym: '♣', key: 'c', color: 'text-white' },
]

interface CardSelectorProps {
  isOpen: boolean
  onClose: () => void
  selectedCards: string[]
  maxCards: number
  onCardsChange: (cards: string[]) => void
  title?: string
}

export function CardSelector({ isOpen, onClose, selectedCards, maxCards, onCardsChange, title }: CardSelectorProps) {
  const [currentRank, setCurrentRank] = useState('')
  const [currentSuit, setCurrentSuit] = useState('')
  const [localCards, setLocalCards] = useState<string[]>(selectedCards)

  const handleRank = (r: string) => {
    setCurrentRank(r)
    if (currentSuit) {
      tryAdd(r, currentSuit)
    }
  }

  const handleSuit = (s: string) => {
    setCurrentSuit(s)
    if (currentRank) {
      tryAdd(currentRank, s)
    }
  }

  const tryAdd = (r: string, s: string) => {
    const card = r + s
    if (localCards.includes(card)) return
    if (localCards.length >= maxCards) return
    const next = [...localCards, card]
    setLocalCards(next)
    onCardsChange(next)
    setCurrentRank('')
    setCurrentSuit('')
  }

  const removeCard = (idx: number) => {
    const next = localCards.filter((_, i) => i !== idx)
    setLocalCards(next)
    onCardsChange(next)
  }

  const handleClear = () => {
    setLocalCards([])
    onCardsChange([])
    setCurrentRank('')
    setCurrentSuit('')
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title || (maxCards === 2 ? 'Select Your Cards' : 'Select Cards')}>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-1.5 justify-center">
          {RANKS.map((r) => (
            <button
              key={r}
              onClick={() => handleRank(r)}
              className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                currentRank === r ? 'bg-yellow-500 text-black scale-110' : 'glass text-white/70 hover:bg-white/20'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        <div className="flex gap-2 justify-center">
          {SUITS.map((s) => (
            <button
              key={s.key}
              onClick={() => handleSuit(s.key)}
              className={`w-10 h-10 rounded-xl text-lg transition-all ${
                currentSuit === s.key ? 'bg-yellow-500 scale-110' : 'glass hover:bg-white/20'
              } ${s.color}`}
            >
              {s.sym}
            </button>
          ))}
        </div>

        <div className="text-center text-xs text-white/30">
          Tap rank then suit to add a card ({localCards.length}/{maxCards})
        </div>

        {localCards.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center">
            {localCards.map((card, idx) => {
              const isRed = card[1] === 'h' || card[1] === 'd'
              return (
                <button
                  key={idx}
                  onClick={() => removeCard(idx)}
                  className={`glass px-3 py-1.5 rounded-lg text-sm font-bold transition-all hover:bg-white/20 ${isRed ? 'text-red-400' : 'text-white'}`}
                  title="Tap to remove"
                >
                  {card[0]}{['♠', '♥', '♦', '♣'][['s', 'h', 'd', 'c'].indexOf(card[1])]}
                </button>
              )
            })}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button variant="ghost" fullWidth onClick={handleClear}>Clear</Button>
          <Button fullWidth onClick={onClose}>Done</Button>
        </div>
      </div>
    </Modal>
  )
}
