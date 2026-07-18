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
  if (!me) return null

  const isFolded = gameState.playerFolded.includes(gameState.yourId)
  const isAllIn = gameState.playerAllIn.includes(gameState.yourId)
  const callAmount = calculateCallAmount(gameState.currentBet, gameState.playerBets[gameState.yourId] || 0)
  const canCheckAction = gameState.currentBet <= (gameState.playerBets[gameState.yourId] || 0)
  const maxBet = me.stack
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

  // Player's position index for highlighting
  const myIndex = gameState.players.findIndex(p => p.id === gameState.yourId)
  const positions = ['bottom', 'bottom-left', 'left', 'top-left', 'top', 'top-right', 'right', 'bottom-right']

  return (
    <div className="flex-1 flex flex-col px-2 pt-2 pb-4"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      {/* Winner banner */}
      {gameState.phase === 'showdown' && gameState.winnerId && (
        <div className="glass rounded-2xl p-3 mx-2 mb-2 text-center border border-yellow-400/30">
          <div className="chip-gold w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-black mx-auto mb-1">♠</div>
          <div className="text-base font-bold">
            🏆 {gameState.players.find(p => p.id === gameState.winnerId)?.name || 'Unknown'} wins!
          </div>
          <div className="text-xl font-bold text-yellow-400 tabular-nums">
            ${formatChips(gameState.winnerAmount || 0)}
          </div>
        </div>
      )}

      {/* Poker Table */}
      <div className="relative w-full aspect-[4/3] max-w-lg mx-auto">
        <div className="absolute inset-0 rounded-[60px] poker-table-felt overflow-hidden">
          <div className="absolute inset-[10px] rounded-[50px] border border-white/5" />
        </div>
        <div className="absolute -inset-[3px] rounded-[63px] poker-table-rail pointer-events-none z-0" />

        {/* Center - community cards + pot */}
        <div className="absolute inset-[20%] flex flex-col items-center justify-center gap-2 z-10">
          {gameState.phase !== 'preflop' && gameState.communityCards > 0 && (
            <div className="flex gap-1.5">
              {(gameState.communityCardsStr || []).length >= gameState.communityCards
                ? (gameState.communityCardsStr || []).slice(0, gameState.communityCards).map((card, i) => {
                    const isRed = card[1] === 'h' || card[1] === 'd'
                    return (
                      <div key={i} className={`w-7 h-10 rounded-lg flex flex-col items-center justify-center font-bold shadow-sm text-[10px] ${
                        isRed ? 'bg-white text-red-500' : 'bg-white text-black'
                      }`}>
                        <span className="leading-none">{card[0]}</span>
                        <span className={`leading-none text-[10px] ${isRed ? 'text-red-500' : 'text-black'}`}>
                          {['♠', '♥', '♦', '♣'][['s', 'h', 'd', 'c'].indexOf(card[1])]}
                        </span>
                      </div>
                    )
                  })
                : Array.from({ length: gameState.communityCards }).map((_, i) => (
                    <div key={i} className="w-7 h-10 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center">
                      <span className="text-white/20 text-[9px]">♠</span>
                    </div>
                  ))
              }
            </div>
          )}
          <div className="flex items-center gap-1">
            <span className="chip-red w-2.5 h-2.5 rounded-full inline-block" />
            <span className="chip-blue w-2.5 h-2.5 rounded-full inline-block" />
          </div>
          <div className="text-lg font-bold tabular-nums">${formatChips(gameState.pot)}</div>
          <div className="text-[9px] text-white/40 uppercase tracking-widest">Pot</div>
        </div>

        {/* Player seats */}
        {gameState.players.map((p, idx) => {
          const isCurrentTurn = gameState.currentTurnPlayerId === p.id
          const playerFolded = gameState.playerFolded.includes(p.id)
          const playerAllIn = gameState.playerAllIn.includes(p.id)
          const playerBet = gameState.playerBets[p.id] || 0
          const isMe = p.id === gameState.yourId

          const pos = positions[idx] || 'bottom'
          const posClass = pos === 'bottom' ? 'absolute bottom-2 left-1/2 -translate-x-1/2' :
            pos === 'left' ? 'absolute left-1 top-1/2 -translate-y-1/2' :
            pos === 'right' ? 'absolute right-1 top-1/2 -translate-y-1/2' :
            pos === 'bottom-left' ? 'absolute bottom-16 left-2' :
            pos === 'bottom-right' ? 'absolute bottom-16 right-2' :
            pos === 'top' ? 'absolute top-2 left-1/2 -translate-x-1/2' :
            pos === 'top-left' ? 'absolute top-2 left-2' :
            pos === 'top-right' ? 'absolute top-2 right-2' :
            'absolute bottom-2 left-1/2 -translate-x-1/2'

          return (
            <div
              key={p.id}
              className={`${posClass} flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-2xl min-w-[75px] z-20 transition-all duration-300 ${
                playerFolded ? 'opacity-30' :
                isCurrentTurn ? 'bg-white/15 backdrop-blur-md border-2 border-yellow-400 pulse-glow scale-110' :
                isMe ? 'border border-yellow-400/30 bg-black/40 backdrop-blur-sm' :
                'bg-black/40 backdrop-blur-sm border border-white/10'
              }`}
            >
              <div className="flex items-center gap-0.5">
                <span className="text-[10px] font-bold truncate max-w-[60px]">{p.name}</span>
                {isMe && <span className="text-[8px] text-yellow-400">(you)</span>}
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold tabular-nums">${formatChips(p.stack)}</span>
                {playerAllIn && <span className="text-[9px] text-yellow-400 font-bold">AI</span>}
              </div>
              {isCurrentTurn && !playerFolded && (
                <span className="text-[9px] text-yellow-400 font-semibold">TURN</span>
              )}
            </div>
          )
        })}

        {/* Bet chips on table surface */}
        {gameState.players.map((p, idx) => {
          const bet = gameState.playerBets[p.id] || 0
          if (bet <= 0) return null
          const pos = positions[idx] || 'bottom'
          const chipPos: Record<string, string> = {
            bottom: 'bottom-[22%] left-1/2 -translate-x-1/2',
            'bottom-left': 'bottom-[28%] left-[18%]',
            left: 'top-1/2 left-[22%] -translate-y-1/2',
            'top-left': 'top-[28%] left-[18%]',
            top: 'top-[22%] left-1/2 -translate-x-1/2',
            'top-right': 'top-[28%] right-[18%]',
            right: 'top-1/2 right-[22%] -translate-y-1/2',
            'bottom-right': 'bottom-[28%] right-[18%]',
          }
          return (
            <div
              key={`bet-${p.id}`}
              className={`absolute ${chipPos[pos]} z-15 flex flex-col items-center gap-0.5 pointer-events-none`}
            >
              <div className="flex items-center justify-center -space-x-1">
                <div className="chip-red w-2.5 h-2.5 rounded-full border border-white/30 shadow-sm" />
                <div className="chip-blue w-2.5 h-2.5 rounded-full border border-white/30 shadow-sm" />
                <div className="chip-green w-2.5 h-2.5 rounded-full border border-white/30 shadow-sm" />
              </div>
              <span className="chip-gold text-[8px] font-bold px-1 py-[1px] rounded-full text-black shadow-sm">
                ${formatChips(bet)}
              </span>
            </div>
          )
        })}
      </div>

      {/* Player info + action trigger */}
      <div className="mt-auto pt-3 px-2">
        <div className="glass rounded-2xl p-3 text-center">
          <div className="text-xs text-white/50 mb-1">{me.name}</div>
          <div className="text-2xl font-bold">${formatChips(me.stack)}</div>
          {gameState.currentBet > 0 && (
            <div className="text-xs text-yellow-400 mt-1">
              To call: ${formatChips(gameState.currentBet)}
            </div>
          )}
          {isFolded && <div className="text-xs text-red-400 mt-1">You folded</div>}
          {isAllIn && <div className="text-xs text-yellow-400 mt-1 font-bold">ALL-IN!</div>}

          {/* Hand strength */}
          {holeCards.length === 2 && handSummary && (
            <div className="mt-2 pt-2 border-t border-white/10">
              <div className="flex items-center justify-center gap-1 text-xs text-white/50 mb-0.5">
                {holeCards.map((c, i) => {
                  const isRed = c[1] === 'h' || c[1] === 'd'
                  return <span key={i} className={`font-bold ${isRed ? 'text-red-400' : 'text-white'}`}>{c[0]}{['♠', '♥', '♦', '♣'][['s', 'h', 'd', 'c'].indexOf(c[1])]}</span>
                })}
              </div>
              <div className="text-sm font-bold">{handSummary.name}</div>
              <div className="flex items-center justify-center gap-1 mt-1">
                <div className="w-full max-w-[120px] h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full transition-all" style={{ width: `${handSummary.pct}%` }} />
                </div>
                <span className="text-xs font-bold text-yellow-400">{handSummary.pct}%</span>
              </div>
            </div>
          )}

          <button
            onClick={() => setShowCardSelector(true)}
            className="mt-2 text-[10px] text-white/30 hover:text-white/60 transition-colors"
          >
            {holeCards.length === 2 ? 'Change Cards' : '+ Show My Cards'}
          </button>
        </div>

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
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mt-3 space-y-2"
          >
            <div className="grid grid-cols-2 gap-2">
              {canCheckAction ? (
                <motion.div whileTap={{ scale: 0.95 }}>
                  <Button variant="secondary" fullWidth onClick={() => handleAction('check')}>
                    ✓ Check
                  </Button>
                </motion.div>
              ) : callAmount >= me.stack ? (
                <motion.div whileTap={{ scale: 0.95 }}>
                  <Button variant="secondary" fullWidth onClick={() => handleAction('all-in', maxBet)}>
                    All-in ${formatChips(maxBet)}
                  </Button>
                </motion.div>
              ) : (
                <motion.div whileTap={{ scale: 0.95 }}>
                  <Button variant="secondary" fullWidth onClick={() => handleAction('call', callAmount)}>
                    Call ${formatChips(callAmount)}
                  </Button>
                </motion.div>
              )}
              <motion.div whileTap={{ scale: 0.95 }}>
                <Button
                  variant="primary"
                  fullWidth
                  onClick={() => { setBetAmount(String(bbAmount)); setShowBetInput(true); }}
                >
                  {gameState.currentBet > 0 ? 'Raise' : 'Bet'}
                </Button>
              </motion.div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <motion.div whileTap={{ scale: 0.95 }}>
                <Button variant="destructive" fullWidth onClick={() => handleAction('fold')}>
                  ✗ Fold
                </Button>
              </motion.div>
              <motion.div whileTap={{ scale: 0.95 }}>
                <Button variant="ghost" fullWidth onClick={() => handleAction('all-in', maxBet)}>
                  All-in ${formatChips(maxBet)}
                </Button>
              </motion.div>
            </div>
          </motion.div>
        )}

        {gameState.phase !== 'idle' && !isFolded && !isAllIn && !showActions && (
          <div className="text-center text-xs text-white/30 mt-3">Waiting for other players...</div>
        )}
      </div>
    </div>
  )
}
