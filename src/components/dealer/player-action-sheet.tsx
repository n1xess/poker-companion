import { useState, useRef } from 'react'
import { useGameStore } from '../../stores/game-store'
import { calculateCallAmount, canCheck, calculateMinRaise } from '../../utils/game-logic'
import { BottomSheet } from '../ui/bottom-sheet'
import { Button } from '../ui/button'
import { formatChips } from '../../utils/format'
import { motion } from 'framer-motion'

interface PlayerActionSheetProps {
  isOpen: boolean
  onClose: () => void
  playerId: string
}

export function PlayerActionSheet({ isOpen, onClose, playerId }: PlayerActionSheetProps) {
  const players = useGameStore((s) => s.players)
  const currentBet = useGameStore((s) => s.currentBet)
  const playerBets = useGameStore((s) => s.playerBets)
  const phase = useGameStore((s) => s.phase)
  const currentTurnIndex = useGameStore((s) => s.currentTurnIndex)
  const performAction = useGameStore((s) => s.performAction)
  const bbAmount = useGameStore((s) => s.bbAmount)

  const [betAmount, setBetAmount] = useState('')
  const [showBetInput, setShowBetInput] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const player = players.find(p => p.id === playerId)
  if (!player) return null

  const playerBet = playerBets[playerId] || 0
  const callAmount = calculateCallAmount(currentBet, playerBet)
  const canCheckAction = canCheck(currentBet, playerBet)
  const maxBet = player.stack
  const minRaise = phase === 'preflop'
    ? currentBet + currentBet
    : calculateMinRaise(currentBet, bbAmount, bbAmount)

  const isActiveTurn = currentTurnIndex >= 0 && players[currentTurnIndex]?.id === playerId

  const handleAction = (type: 'fold' | 'check' | 'call' | 'all-in') => {
    let amount = 0
    if (type === 'call') amount = callAmount
    if (type === 'all-in') amount = maxBet
    performAction(playerId, type, amount)
    onClose()
  }

  const handleBetConfirm = () => {
    const amount = parseInt(betAmount, 10)
    if (isNaN(amount) || amount < bbAmount || amount > maxBet) return
    const actionType = currentBet > 0 ? 'raise' : 'bet'
    performAction(playerId, actionType, amount)
    setShowBetInput(false)
    onClose()
  }

  if (showBetInput) {
    const numAmount = parseInt(betAmount, 10) || 0
    const isValid = numAmount >= bbAmount && numAmount <= maxBet
    const quickAmounts = [
      Math.floor(maxBet * 0.25),
      Math.floor(maxBet * 0.5),
      Math.floor(maxBet * 0.75),
      maxBet,
    ].filter(v => v >= bbAmount && v > 0)

    return (
      <BottomSheet isOpen={isOpen} onClose={onClose} title={currentBet > 0 ? 'Raise to' : 'Place Bet'}>
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-sm text-white/50 mb-1">
              Min: ${formatChips(bbAmount)} — Max: ${formatChips(maxBet)}
            </div>
            <input
              ref={inputRef}
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              className="w-full text-center text-3xl font-bold bg-transparent border-b border-white/20 outline-none py-2 tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              min={bbAmount}
              max={maxBet}
              inputMode="numeric"
              autoFocus
            />
          </div>
          <div className="flex gap-2 justify-center">
            {quickAmounts.map((v) => (
              <button
                key={v}
                onClick={() => setBetAmount(String(v))}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                  numAmount === v ? 'bg-yellow-500 text-black' : 'glass text-white/80'
                }`}
              >
                ${formatChips(v)}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" fullWidth onClick={() => setShowBetInput(false)}>Back</Button>
            <Button fullWidth disabled={!isValid} onClick={handleBetConfirm}>Confirm</Button>
          </div>
        </div>
      </BottomSheet>
    )
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={`${player.name}'s Turn`}>
      <div className="space-y-3">
        <div className="text-center text-sm text-white/50 mb-2">
          Stack: ${formatChips(maxBet)}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {canCheckAction ? (
            <motion.div whileTap={{ scale: 0.95 }}>
              <Button variant="secondary" fullWidth onClick={() => handleAction('check')}>
                ✓ Check
              </Button>
            </motion.div>
          ) : (
            <motion.div whileTap={{ scale: 0.95 }}>
              <Button variant="secondary" fullWidth onClick={() => handleAction('call')}>
                Call ${formatChips(callAmount)}
              </Button>
            </motion.div>
          )}

          <motion.div whileTap={{ scale: 0.95 }}>
            <Button
              variant="primary"
              fullWidth
              onClick={() => {
                setBetAmount(String(bbAmount))
                setShowBetInput(true)
                setTimeout(() => inputRef.current?.focus(), 300)
              }}
            >
              {currentBet > 0 ? 'Raise' : 'Bet'}
            </Button>
          </motion.div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <motion.div whileTap={{ scale: 0.95 }}>
            <Button variant="destructive" fullWidth onClick={() => handleAction('fold')}>
              ✗ Fold
            </Button>
          </motion.div>
          <motion.div whileTap={{ scale: 0.95 }}>
            <Button variant="ghost" fullWidth onClick={() => handleAction('all-in')}>
              All-in ${formatChips(maxBet)}
            </Button>
          </motion.div>
        </div>

        <Button variant="ghost" fullWidth onClick={onClose}>Cancel</Button>
      </div>
    </BottomSheet>
  )
}
