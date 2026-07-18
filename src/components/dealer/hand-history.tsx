import { useState } from 'react'
import { useGameStore } from '../../stores/game-store'
import { usePlayerStore } from '../../stores/player-store'
import { Button } from '../ui/button'
import { formatChips, formatTimestamp, formatActionType } from '../../utils/format'
import { ChevronDown, ChevronUp, Undo2 } from 'lucide-react'

export function HandHistory() {
  const [expanded, setExpanded] = useState(false)
  const actionHistory = useGameStore((s) => s.actionHistory)
  const undo = useGameStore((s) => s.undo)
  const players = usePlayerStore((s) => s.players)

  const getPlayerName = (id: string) => players.find((p) => p.id === id)?.name || id

  if (actionHistory.length === 0) return null

  return (
    <div className="glass rounded-2xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium"
      >
        <span>History ({actionHistory.length})</span>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); undo() }}
            className="p-1 rounded-lg hover:bg-white/10"
          >
            <Undo2 size={16} />
          </button>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {expanded && (
        <div className="max-h-40 overflow-y-auto no-scrollbar px-4 pb-3 space-y-1">
          {[...actionHistory].reverse().map((action) => (
            <div key={action.id} className="flex justify-between text-xs py-1">
              <span>
                <span className="font-medium">{getPlayerName(action.playerId)}</span>{' '}
                <span className={action.type === 'fold' ? 'text-accent-red' : 'text-white/70'}>
                  {formatActionType(action.type)}
                </span>
                {action.amount > 0 && ` $${formatChips(action.amount)}`}
              </span>
              <span className="text-white/30">{formatTimestamp(action.timestamp)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
