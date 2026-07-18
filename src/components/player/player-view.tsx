import { useGameStore } from '../../stores/game-store'
import { formatChips } from '../../utils/format'

export function PlayerView() {
  const players = useGameStore((s) => s.players)
  const pot = useGameStore((s) => s.pot)
  const currentBet = useGameStore((s) => s.currentBet)

  if (players.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-white/30 text-sm">
        Waiting for dealer to set up the game...
      </div>
    )
  }

  const me = players[0]

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 p-4">
      <div className="text-center">
        <div className="text-sm text-white/50">Your stack</div>
        <div className="text-3xl font-bold">${formatChips(me.stack)}</div>
      </div>

      <div className="glass rounded-2xl px-6 py-3 text-center">
        <div className="text-xs text-white/50 mb-1">Pot</div>
        <div className="text-xl font-bold">${formatChips(pot)}</div>
        {currentBet > 0 && (
          <div className="text-xs text-yellow-400 mt-1">Current bet: ${formatChips(currentBet)}</div>
        )}
      </div>
    </div>
  )
}
