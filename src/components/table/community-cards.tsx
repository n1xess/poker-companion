import type { Card } from '../../types'
import { motion } from 'framer-motion'

interface CommunityCardsProps {
  cards: Card[]
  phase: string
}

export function CommunityCards({ cards, phase }: CommunityCardsProps) {
  if (phase === 'idle' || phase === 'preflop') {
    return null
  }

  return (
    <div className="flex gap-1.5 items-center justify-center">
      {cards.map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.1, duration: 0.3 }}
          className="w-10 h-14 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center"
        >
          <span className="text-white/15 text-lg">♠</span>
        </motion.div>
      ))}
    </div>
  )
}
