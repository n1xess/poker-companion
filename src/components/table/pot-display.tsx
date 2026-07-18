import { formatChips } from '../../utils/format'
import { motion } from 'framer-motion'

interface PotDisplayProps {
  pot: number
  currentBet: number
  phase: string
}

export function PotDisplay({ pot, currentBet, phase }: PotDisplayProps) {
  if (phase === 'idle') return null

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-1">
        <span className="chip-red w-3 h-3 rounded-full inline-block" />
        <span className="chip-blue w-3 h-3 rounded-full inline-block" />
        <span className="chip-gold w-3 h-3 rounded-full inline-block" />
      </div>
      <motion.div
        key={pot}
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        className="text-2xl font-bold tabular-nums drop-shadow-lg"
      >
        ${formatChips(pot)}
      </motion.div>
      <div className="text-[10px] text-white/40 uppercase tracking-widest">Pot</div>
      {currentBet > 0 && (
        <div className="text-xs text-yellow-400 font-medium">To call: ${formatChips(currentBet)}</div>
      )}
    </div>
  )
}
