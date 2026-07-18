import { useGameStore } from '../../stores/game-store'
import { PlayerSeat } from './player-seat'
import { PotDisplay } from './pot-display'
import { formatChips } from '../../utils/format'
import { motion } from 'framer-motion'

interface PokerTableProps {
  onPlayerTap: (playerId: string) => void
}

const positions: Array<'bottom' | 'left' | 'right' | 'top' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'> = [
  'bottom', 'bottom-left', 'left', 'top-left', 'top', 'top-right', 'right', 'bottom-right'
]

export function PokerTable({ onPlayerTap }: PokerTableProps) {
  const players = useGameStore((s) => s.players)
  const dealerIndex = useGameStore((s) => s.dealerIndex)
  const smallBlindIndex = useGameStore((s) => s.smallBlindIndex)
  const bigBlindIndex = useGameStore((s) => s.bigBlindIndex)
  const currentTurnIndex = useGameStore((s) => s.currentTurnIndex)
  const playerBets = useGameStore((s) => s.playerBets)
  const playerFolded = useGameStore((s) => s.playerFolded)
  const playerAllIn = useGameStore((s) => s.playerAllIn)
  const pot = useGameStore((s) => s.pot)
  const currentBet = useGameStore((s) => s.currentBet)
  const phase = useGameStore((s) => s.phase)

  return (
    <div className="relative w-full aspect-[4/3] max-w-lg mx-auto">
      {/* Felt table */}
      <div className="absolute inset-0 rounded-[60px] poker-table-felt overflow-hidden">
        {/* Inner felt ring */}
        <div className="absolute inset-[10px] rounded-[50px] border border-white/5" />
      </div>

      {/* Rail (wooden edge) */}
      <div className="absolute -inset-[3px] rounded-[63px] poker-table-rail pointer-events-none z-0" />

      {/* Center area - community cards and pot */}
      <div className="absolute inset-[20%] flex flex-col items-center justify-center gap-3 z-10">
        {/* Community cards area */}
        {phase !== 'idle' && phase !== 'preflop' && (
          <div className="flex gap-2 items-center justify-center">
            {useGameStore.getState().communityCards.map((card, i) => {
              const isRed = card.suit === 'hearts' || card.suit === 'diamonds'
              const suitSym: Record<string, string> = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' }
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`w-10 h-14 rounded-lg flex flex-col items-center justify-center font-bold shadow-sm ${
                    isRed ? 'bg-white text-red-500' : 'bg-white text-black'
                  }`}
                >
                  <span className="text-xs leading-none">{card.rank}</span>
                  <span className={`text-xs leading-none ${isRed ? 'text-red-500' : 'text-black'}`}>{suitSym[card.suit]}</span>
                </motion.div>
              )
            })}
          </div>
        )}

        <PotDisplay pot={pot} currentBet={currentBet} phase={phase} />
      </div>

      {/* Player seats */}
      {players.map((player, idx) => (
        <PlayerSeat
          key={player.id}
          player={player}
          position={positions[idx] || 'bottom'}
          isDealer={dealerIndex === idx}
          isSmallBlind={smallBlindIndex === idx}
          isBigBlind={bigBlindIndex === idx}
          isCurrentTurn={currentTurnIndex === idx}
          isFolded={playerFolded.includes(player.id)}
          isAllIn={playerAllIn.includes(player.id)}
          currentBet={playerBets[player.id] || 0}
          onTap={() => onPlayerTap(player.id)}
        />
      ))}

      {/* Bet chips on table surface — between each player and the center */}
      {players.map((player, idx) => {
        const bet = playerBets[player.id] || 0
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
          <motion.div
            key={`bet-${player.id}`}
            initial={{ opacity: 0, scale: 0.5, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className={`absolute ${chipPos[pos]} z-15 flex flex-col items-center gap-0.5 pointer-events-none`}
          >
            <div className="flex items-center justify-center -space-x-1">
              <div className="chip-red w-3 h-3 rounded-full border border-white/30 shadow-sm" />
              <div className="chip-blue w-3 h-3 rounded-full border border-white/30 shadow-sm" />
              <div className="chip-green w-3 h-3 rounded-full border border-white/30 shadow-sm" />
            </div>
            <span className="chip-gold text-[9px] font-bold px-1.5 py-[1px] rounded-full text-black shadow-sm">
              {formatChips(bet)}
            </span>
          </motion.div>
        )
      })}
    </div>
  )
}
