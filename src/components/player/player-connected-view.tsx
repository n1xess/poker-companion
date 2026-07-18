import { useState, useRef, useEffect } from 'react'
import { formatChips } from '../../utils/format'
import { Button } from '../ui/button'
import { CardSelector } from '../ui/card-selector'
import { motion } from 'framer-motion'
import { calculateCallAmount } from '../../utils/game-logic'
import { getHandSummary } from '../../utils/hand-evaluator'

interface PlayerData {
  id: string
  name: string
  stack: number
  isActive: boolean
  isSittingOut: boolean
}

interface GameState {
  players: PlayerData[]
  yourId: string
  communityCards: number
  pot: number
  currentBet: number
  phase: string
  currentTurnPlayerId: string
  playerBets: Record<string, number>
  playerFolded: string[]
  playerAllIn: string[]
  sbAmount: number
  bbAmount: number
  winnerId?: string
  winnerAmount?: number
  communityCardsStr?: string[]
}

interface PlayerConnectedViewProps {
  gameState: GameState | null
  onAction: (type: string, amount: number) => void
  playerName: string
}

export function PlayerConnectedView({ gameState, onAction, playerName }: PlayerConnectedViewProps) {
  const [showActions, setShowActions] = useState(false)
  const [showBetInput, setShowBetInput] = useState(false)
  const [betAmount, setBetAmount] = useState('')
  const [showCardSelector, setShowCardSelector] = useState(false)
  const [holeCards, setHoleCards] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const handSummary = gameState ? getHandSummary(holeCards, gameState.communityCardsStr || []) : null

  useEffect(() => {
    if (!gameState || gameState.phase === 'idle' || gameState.phase === 'showdown') {
      setShowActions(false)
      setShowBetInput(false)
      return
    }
    const isMyTurn = gameState.currentTurnPlayerId === gameState.yourId
    const isFolded = gameState.playerFolded.includes(gameState.yourId)
    const isAllIn = gameState.playerAllIn.includes(gameState.yourId)
    if (isMyTurn && !isFolded && !isAllIn) {
      setShowActions(true)
    } else {
      setShowActions(false)
    }
  }, [gameState?.currentTurnPlayerId, gameState?.yourId, gameState?.phase])

  if (!gameState || gameState.phase === 'idle') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-white/50">
        <div className="chip-gold w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-black">
          ♠
        </div>
        <p className="text-sm">Waiting for dealer to start...</p>
        <p className="text-xs text-white/30">Connected as {playerName}</p>
      </div>
    )
  }

  const me = gameState.players.find(p => p.id === gameState.yourId)

  const isFolded = gameState.playerFolded.includes(gameState.yourId)
  const isAllIn = gameState.playerAllIn.includes(gameState.yourId)
  const callAmount = calculateCallAmount(gameState.currentBet, gameState.playerBets[gameState.yourId] || 0)
  const canCheckAction = gameState.currentBet <= (gameState.playerBets[gameState.yourId] || 0)
  const maxBet = me?.stack || 0
  const bbAmount = gameState.bbAmount || 20

  const handleAction = (type: string, amount: number = 0) => {
    onAction(type, amount)
    setShowActions(false)
  }

  const handleBetConfirm = () => {
    const amount = parseInt(betAmount, 10)
    if (isNaN(amount) || amount < bbAmount || amount > maxBet) return
    const actionType = gameState.currentBet > 0 ? 'raise' : 'bet'
    handleAction(actionType, amount)
    setShowBetInput(false)
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
      <div className="fixed inset-0 z-50 flex items-end bg-black/60">
        <div className="w-full glass rounded-t-2xl pb-[env(safe-area-inset-bottom,16px)] animate-slide-up"
          style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
        >
          <div className="flex items-center justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-white/30" />
          </div>
          <div className="px-5 pb-3 text-center text-lg font-semibold">
            {gameState.currentBet > 0 ? 'Raise to' : 'Place Bet'}
          </div>
          <div className="px-5 pb-4 space-y-4">
            <div className="text-center">
              <div className="text-sm text-white/50 mb-1">
                Min: ${formatChips(bbAmount)} — Max: ${formatChips(maxBet)}
              </div>
              <input
                ref={inputRef}
                autoFocus
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                className="w-full text-center text-3xl font-bold bg-transparent border-b border-white/20 outline-none py-2 tabular-nums"
                min={bbAmount}
                max={maxBet}
                inputMode="numeric"
              />
            </div>
            <div className="flex gap-2 justify-center flex-wrap">
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
        </div>
      </div>
    )
  }

  const positions = ['bottom', 'bottom-left', 'left', 'top-left', 'top', 'top-right', 'right', 'bottom-right']

  return (
    <div className="flex-1 flex flex-col min-h-0 px-2 pb-2"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      {/* Winner banner */}
      {gameState.phase === 'showdown' && gameState.winnerId && (
        <div className="glass rounded-2xl p-2 mb-1 text-center border border-yellow-400/30 z-30 flex-shrink-0">
          <div className="chip-gold w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-black mx-auto mb-0.5">♠</div>
          <div className="text-sm font-bold">
            🏆 {gameState.players.find(p => p.id === gameState.winnerId)?.name || 'Unknown'} wins!
          </div>
          <div className="text-lg font-bold text-yellow-400 tabular-nums">
            ${formatChips(gameState.winnerAmount || 0)}
          </div>
        </div>
      )}

      {/* Poker Table */}
      <div className="relative w-full mx-auto flex-shrink-0" style={{ minHeight: '240px', maxHeight: '50vh', height: '60vw' }}>
        <div className="absolute inset-0 rounded-[40px] poker-table-felt overflow-hidden">
          <div className="absolute inset-[8px] rounded-[32px] border border-white/5" />
        </div>
        <div className="absolute -inset-[2px] rounded-[42px] poker-table-rail pointer-events-none z-0" />

        {/* Center - community cards + pot */}
        <div className="absolute inset-[18%] flex flex-col items-center justify-center gap-1 z-10 pointer-events-none">
          {gameState.phase !== 'preflop' && gameState.communityCards > 0 && (
            <div className="flex gap-1">
              {(gameState.communityCardsStr || []).length >= gameState.communityCards
                ? (gameState.communityCardsStr || []).slice(0, gameState.communityCards).map((card, i) => {
                    const isRed = card[1] === 'h' || card[1] === 'd'
                    return (
                      <div key={i} className={`w-6 h-9 rounded-lg flex flex-col items-center justify-center font-bold shadow-sm text-[9px] ${
                        isRed ? 'bg-white text-red-500' : 'bg-white text-black'
                      }`}>
                        <span className="leading-none">{card[0]}</span>
                        <span className={`leading-none text-[9px] ${isRed ? 'text-red-500' : 'text-black'}`}>
                          {['♠', '♥', '♦', '♣'][['s', 'h', 'd', 'c'].indexOf(card[1])]}
                        </span>
                      </div>
                    )
                  })
                : Array.from({ length: gameState.communityCards }).map((_, i) => (
                    <div key={i} className="w-6 h-9 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center">
                      <span className="text-white/20 text-[8px]">♠</span>
                    </div>
                  ))
              }
            </div>
          )}
          <div className="flex items-center gap-1">
            <span className="chip-red w-2 h-2 rounded-full inline-block" />
            <span className="chip-blue w-2 h-2 rounded-full inline-block" />
          </div>
          <div className="text-base font-bold tabular-nums">${formatChips(gameState.pot)}</div>
          <div className="text-[8px] text-white/40 uppercase tracking-widest">Pot</div>
        </div>

        {/* All player seats */}
        {gameState.players.map((p, idx) => {
          const isCurrentTurn = gameState.currentTurnPlayerId === p.id
          const playerFolded = gameState.playerFolded.includes(p.id)
          const playerAllIn = gameState.playerAllIn.includes(p.id)
          const isMe = p.id === gameState.yourId

          const pos = positions[idx] || 'bottom'
          const posClass = pos === 'bottom' ? 'absolute bottom-1 left-1/2 -translate-x-1/2' :
            pos === 'left' ? 'absolute left-0 top-1/2 -translate-y-1/2' :
            pos === 'right' ? 'absolute right-0 top-1/2 -translate-y-1/2' :
            pos === 'bottom-left' ? 'absolute bottom-12 left-0' :
            pos === 'bottom-right' ? 'absolute bottom-12 right-0' :
            pos === 'top' ? 'absolute top-0 left-1/2 -translate-x-1/2' :
            pos === 'top-left' ? 'absolute top-0 left-0' :
            pos === 'top-right' ? 'absolute top-0 right-0' :
            'absolute bottom-1 left-1/2 -translate-x-1/2'

          return (
            <div
              key={p.id}
              className={`${posClass} flex flex-col items-center gap-0.5 px-2 py-1 rounded-2xl min-w-[70px] z-20 transition-all duration-300 ${
                playerFolded ? 'opacity-30' :
                isCurrentTurn ? 'bg-white/15 backdrop-blur-md border-2 border-yellow-400 pulse-glow scale-110' :
                isMe ? 'border border-yellow-400/30 bg-black/40 backdrop-blur-sm' :
                'bg-black/40 backdrop-blur-sm border border-white/10'
              }`}
            >
              <div className="flex items-center gap-0.5">
                <span className="text-[10px] font-bold truncate max-w-[55px]">{p.name}</span>
                {isMe && <span className="text-[8px] text-yellow-400">(you)</span>}
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-bold tabular-nums">${formatChips(p.stack)}</span>
                {playerAllIn && <span className="text-[8px] text-yellow-400 font-bold">AI</span>}
              </div>
              {isCurrentTurn && !playerFolded && (
                <span className="text-[8px] text-yellow-400 font-semibold">TURN</span>
              )}
            </div>
          )
        })}

        {/* Bet chips - use original player index for correct positions */}
        {gameState.players.map((p, idx) => {
          const bet = gameState.playerBets[p.id] || 0
          if (bet <= 0) return null
          const pos = positions[idx] || 'bottom'
          const chipPos: Record<string, string> = {
            bottom: 'bottom-[20%] left-1/2 -translate-x-1/2',
            'bottom-left': 'bottom-[30%] left-[16%]',
            left: 'top-1/2 left-[18%] -translate-y-1/2',
            'top-left': 'top-[28%] left-[16%]',
            top: 'top-[20%] left-1/2 -translate-x-1/2',
            'top-right': 'top-[28%] right-[16%]',
            right: 'top-1/2 right-[18%] -translate-y-1/2',
            'bottom-right': 'bottom-[30%] right-[16%]',
          }
          return (
            <div
              key={`bet-${p.id}`}
              className={`absolute ${chipPos[pos]} z-15 flex flex-col items-center gap-[1px] pointer-events-none`}
            >
              <div className="flex items-center justify-center -space-x-1">
                <div className="chip-red w-2 h-2 rounded-full border border-white/20" />
                <div className="chip-blue w-2 h-2 rounded-full border border-white/20" />
                <div className="chip-green w-2 h-2 rounded-full border border-white/20" />
              </div>
              <span className="chip-gold text-[7px] font-bold px-1 py-[1px] rounded-full text-black shadow-sm">
                ${formatChips(bet)}
              </span>
            </div>
          )
        })}
      </div>

      {/* Bottom section — cards + actions */}
      <div className="flex-shrink-0 pt-2 space-y-2">
        {/* Cards row */}
        {!isFolded && !isAllIn && (
          <div className="flex items-center gap-2">
            <button onClick={() => setShowCardSelector(true)} className="px-2.5 py-1 rounded-lg glass text-[11px]">
              {holeCards.length === 2 ? holeCards.map(c => {
                const isRed = c[1] === 'h' || c[1] === 'd'
                return <span key={c} className={`font-bold ${isRed ? 'text-red-400' : 'text-white'}`}>{c[0]}{['♠', '♥', '♦', '♣'][['s', 'h', 'd', 'c'].indexOf(c[1])]} </span>
              }) : '🂠 Select Cards'}
            </button>
            {holeCards.length === 2 && handSummary && (
              <>
                <span className="text-[11px] font-bold text-white/70">{handSummary.name}</span>
                <div className="flex items-center gap-1 ml-auto">
                  <div className="w-14 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full" style={{ width: `${handSummary.pct}%` }} />
                  </div>
                  <span className="text-[10px] font-bold text-yellow-400">{handSummary.pct}%</span>
                </div>
              </>
            )}
          </div>
        )}

        <CardSelector
          isOpen={showCardSelector}
          onClose={() => setShowCardSelector(false)}
          selectedCards={holeCards}
          maxCards={2}
          onCardsChange={setHoleCards}
          title="Select Your 2 Cards"
        />

        {/* Action buttons */}
        {showActions && !isFolded && !isAllIn && (
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="space-y-1.5"
          >
            <div className="grid grid-cols-3 gap-1.5">
              {canCheckAction ? (
                <Button variant="secondary" size="sm" fullWidth onClick={() => handleAction('check')}>✓ Check</Button>
              ) : callAmount >= (me?.stack || 0) ? (
                <Button variant="secondary" size="sm" fullWidth onClick={() => handleAction('all-in', maxBet)}>All-in</Button>
              ) : (
                <Button variant="secondary" size="sm" fullWidth onClick={() => handleAction('call', callAmount)}>Call ${formatChips(callAmount)}</Button>
              )}
              <Button variant="primary" size="sm" fullWidth onClick={() => { setBetAmount(String(bbAmount)); setShowBetInput(true); }}>
                {gameState.currentBet > 0 ? 'Raise' : 'Bet'}
              </Button>
              <Button variant="destructive" size="sm" fullWidth onClick={() => handleAction('fold')}>✗ Fold</Button>
            </div>
            <Button variant="ghost" size="sm" fullWidth onClick={() => handleAction('all-in', maxBet)}>
              All-in ${formatChips(maxBet)}
            </Button>
          </motion.div>
        )}

        {gameState.phase !== 'idle' && !isFolded && !isAllIn && !showActions && (
          <div className="text-center text-[10px] text-white/30">Waiting for other players...</div>
        )}
      </div>
    </div>
  )
}
