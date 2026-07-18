import { useState } from 'react'
import { Modal } from '../ui/modal'
import { Button } from '../ui/button'
import { useGameStore } from '../../stores/game-store'
import { useUIStore } from '../../stores/ui-store'
import { formatChips } from '../../utils/format'

interface WinnerSelectorProps {
  isOpen: boolean
  onClose: () => void
}

export function WinnerSelector({ isOpen, onClose }: WinnerSelectorProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const players = useGameStore((s) => s.players)
  const playerFolded = useGameStore((s) => s.playerFolded)
  const pot = useGameStore((s) => s.pot)
  const finishHand = useGameStore((s) => s.finishHand)
  const showToast = useUIStore((s) => s.showToast)

  const activePlayers = players.filter((p) => !playerFolded.includes(p.id) && p.isActive && !p.isSittingOut)

  const togglePlayer = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  const handleFinish = () => {
    if (selectedIds.length === 0) {
      showToast('Select at least one winner', 'error')
      return
    }
    finishHand(selectedIds.map((id) => ({ playerId: id, amount: 0 })))
    setSelectedIds([])
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select Winner(s)">
      <div className="space-y-3">
        <div className="text-center text-sm text-white/50">Pot: ${formatChips(pot)}</div>
        <div className="space-y-2">
          {activePlayers.map((p) => (
            <button
              key={p.id}
              onClick={() => togglePlayer(p.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                selectedIds.includes(p.id) ? 'bg-accent text-white' : 'glass text-white/80'
              }`}
            >
              <span className="font-medium">{p.name}</span>
              <span>${formatChips(p.stack)}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-3 pt-2">
          <Button variant="ghost" fullWidth onClick={onClose}>Cancel</Button>
          <Button fullWidth onClick={handleFinish}>
            Give Pot (${formatChips(pot)})
          </Button>
        </div>
      </div>
    </Modal>
  )
}
