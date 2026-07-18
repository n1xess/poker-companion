import { useState, useRef, useEffect } from 'react'
import { BottomSheet } from '../ui/bottom-sheet'
import { Button } from '../ui/button'
import { useGameStore } from '../../stores/game-store'
import { formatChips } from '../../utils/format'

interface BetInputSheetProps {
  isOpen: boolean
  onClose: () => void
  type: 'bet' | 'raise'
}

export function BetInputSheet({ isOpen, onClose, type }: BetInputSheetProps) {
  const [amount, setAmount] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const currentTurnIndex = useGameStore((s) => s.currentTurnIndex)
  const players = useGameStore((s) => s.players)
  const currentBet = useGameStore((s) => s.currentBet)
  const playerBets = useGameStore((s) => s.playerBets)
  const performAction = useGameStore((s) => s.performAction)
  const bbAmount = useGameStore((s) => s.bbAmount)

  const player = players[currentTurnIndex]
  const maxBet = player?.stack || 0
  const minBet = type === 'bet'
    ? bbAmount
    : Math.min(currentBet + currentBet, maxBet)

  useEffect(() => {
    if (isOpen) {
      setAmount(String(minBet))
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen, minBet])

  const numAmount = parseInt(amount, 10) || 0
  const isValid = numAmount >= minBet && numAmount <= maxBet

  const quickAmounts = [
    Math.floor(maxBet * 0.25),
    Math.floor(maxBet * 0.5),
    Math.floor(maxBet * 0.75),
    maxBet,
  ].filter((v) => v >= minBet && v > 0)

  const handleConfirm = () => {
    if (!isValid || !player) return
    performAction(player.id, type === 'bet' ? 'bet' : 'raise', numAmount)
    onClose()
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={type === 'bet' ? 'Place Bet' : 'Raise'}>
      <div className="space-y-4">
        <div className="text-center">
          <div className="text-sm text-white/50 mb-1">
            {type === 'bet' ? 'Min bet' : 'Min raise'}: ${formatChips(minBet)} — Max: ${formatChips(maxBet)}
          </div>
          <input
            ref={inputRef}
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full text-center text-3xl font-bold bg-transparent border-b border-white/20 outline-none py-2 tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            min={minBet}
            max={maxBet}
            inputMode="numeric"
          />
        </div>

        <div className="flex gap-2 justify-center">
          {quickAmounts.map((v) => (
            <button
              key={v}
              onClick={() => setAmount(String(v))}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                numAmount === v ? 'bg-accent text-white' : 'glass text-white/80'
              }`}
            >
              ${formatChips(v)}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <Button variant="ghost" fullWidth onClick={onClose}>Cancel</Button>
          <Button fullWidth disabled={!isValid} onClick={handleConfirm}>
            Confirm {type === 'bet' ? 'Bet' : 'Raise'}
          </Button>
        </div>
      </div>
    </BottomSheet>
  )
}
