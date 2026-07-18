import { type Player } from '../../types'
import { formatChips } from '../../utils/format'
import { motion } from 'framer-motion'

interface PlayerSeatProps {
  player: Player
  position: 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  isDealer: boolean
  isSmallBlind: boolean
  isBigBlind: boolean
  isCurrentTurn: boolean
  isFolded: boolean
  isAllIn: boolean
  currentBet: number
  onTap: () => void
}

const positionClasses: Record<string, string> = {
  bottom: 'absolute bottom-2 left-1/2 -translate-x-1/2',
  left: 'absolute left-1 top-1/2 -translate-y-1/2',
  right: 'absolute right-1 top-1/2 -translate-y-1/2',
  'bottom-left': 'absolute bottom-16 left-2',
  'bottom-right': 'absolute bottom-16 right-2',
  top: 'absolute top-2 left-1/2 -translate-x-1/2',
  'top-left': 'absolute top-2 left-2',
  'top-right': 'absolute top-2 right-2',
}

export function PlayerSeat({
  player,
  position,
  isDealer,
  isSmallBlind,
  isBigBlind,
  isCurrentTurn,
  isFolded,
  isAllIn,
  currentBet,
  onTap,
}: PlayerSeatProps) {
  return (
    <motion.button
      onClick={onTap}
      whileTap={{ scale: 0.95 }}
      className={`${positionClasses[position]} flex flex-col items-center gap-1 px-3 py-2 rounded-2xl min-w-[90px] transition-all duration-300 z-20 ${
        isFolded
          ? 'opacity-30'
          : isCurrentTurn
          ? 'bg-white/15 backdrop-blur-md border-2 border-yellow-400 pulse-glow'
          : 'bg-black/40 backdrop-blur-sm border border-white/10'
      } ${isCurrentTurn ? 'scale-110' : 'hover:scale-105'}`}
    >
      {/* Player name + badges */}
      <div className="flex items-center gap-1">
        <span className="text-xs font-bold truncate max-w-[70px]">{player.name}</span>
        {isDealer && (
          <span className="chip-gold text-[9px] w-5 h-5 rounded-full flex items-center justify-center font-bold text-black shadow-sm">
            D
          </span>
        )}
        {isSmallBlind && (
          <span className="bg-white/20 text-[9px] px-1.5 py-0.5 rounded-full text-white/80">SB</span>
        )}
        {isBigBlind && (
          <span className="bg-white/20 text-[9px] px-1.5 py-0.5 rounded-full text-white/80">BB</span>
        )}
      </div>

      {/* Chip stack */}
      <div className="flex items-center gap-1">
        <span className="text-sm font-bold tabular-nums">${formatChips(player.stack)}</span>
        {isAllIn && <span className="text-[10px] text-yellow-400 font-bold ml-1">ALL-IN</span>}
      </div>

      {/* Active turn indicator */}
      {isCurrentTurn && !isFolded && (
        <span className="text-[10px] text-yellow-400 font-semibold">YOUR TURN</span>
      )}
    </motion.button>
  )
}
