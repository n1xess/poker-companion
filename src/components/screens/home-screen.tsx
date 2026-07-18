import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePlayerStore } from '../../stores/player-store'
import { useGameStore } from '../../stores/game-store'
import { useSettingsStore } from '../../stores/settings-store'
import { useUIStore } from '../../stores/ui-store'
import { Button } from '../ui/button'
import { Modal } from '../ui/modal'
import { formatChips } from '../../utils/format'
import { Plus, Trash2, Play, Users, Settings, QrCode } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'

export function HomeScreen() {
  const navigate = useNavigate()
  const players = usePlayerStore((s) => s.players)
  const addPlayer = usePlayerStore((s) => s.addPlayer)
  const removePlayer = usePlayerStore((s) => s.removePlayer)
  const clearPlayers = usePlayerStore((s) => s.clearPlayers)
  const defaultStack = useSettingsStore((s) => s.defaultStack)
  const showToast = useUIStore((s) => s.showToast)

  const [showAddPlayer, setShowAddPlayer] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [roomId, setRoomId] = useState('')
  const [newName, setNewName] = useState('')

  const handleAddPlayer = () => {
    const name = newName.trim()
    if (!name) return
    addPlayer(name, defaultStack)
    setNewName('')
    setShowAddPlayer(false)
    showToast(`${name} added`, 'success')
  }

  const handleStart = () => {
    const active = players.filter((p) => p.isActive && !p.isSittingOut)
    if (active.length < 2) {
      showToast('Need at least 2 active players', 'error')
      return
    }
    const id = Math.random().toString(36).substring(2, 8).toUpperCase()
    setRoomId(id)
    setShowQR(true)
  }

  const enterTable = () => {
    useGameStore.getState().resetGame()
    players.forEach(p => usePlayerStore.getState().updateStack(p.id, defaultStack))
    navigate(`/table/${roomId}`)
  }

  const playerUrl = `${window.location.origin}/player?room=${roomId}`

  return (
    <div className="flex flex-col min-h-screen p-4">
      <div className="flex items-center justify-between mb-6 pt-4">
        <h1 className="text-2xl font-bold">Poker</h1>
        <div className="flex gap-2">
          <button onClick={() => navigate('/settings')} className="p-2 glass rounded-xl">
            <Settings size={20} />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-white/50">
          Players ({players.length})
        </h2>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={clearPlayers}>Clear</Button>
          <Button size="sm" onClick={() => setShowAddPlayer(true)}>
            <Plus size={16} className="mr-1" /> Add
          </Button>
        </div>
      </div>

      <AnimatePresence mode="popLayout">
        {players.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col items-center justify-center text-white/30 gap-2"
          >
            <Users size={48} />
            <p className="text-sm">No players yet. Add some to get started!</p>
          </motion.div>
        ) : (
          <div className="flex-1 space-y-2">
            {players.map((p) => (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center justify-between glass rounded-2xl px-4 py-3"
              >
                <div>
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-white/50">${formatChips(p.stack)}</div>
                </div>
                <button
                  onClick={() => removePlayer(p.id)}
                  className="p-2 rounded-xl hover:bg-white/10 text-white/30 hover:text-accent-red transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {players.length >= 2 && (
        <div className="pt-4 pb-[env(safe-area-inset-bottom,16px)]">
          <Button fullWidth size="lg" onClick={handleStart} className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black shadow-lg">
            <QrCode size={18} className="mr-2" /> Create Table
          </Button>
        </div>
      )}

      {/* QR Code Modal */}
      <Modal isOpen={showQR} onClose={() => setShowQR(false)} title="Players Scan to Join">
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="bg-white p-4 rounded-2xl">
              <QRCodeSVG value={playerUrl} size={180} />
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-white/50 mb-1">Room Code</div>
            <div className="text-2xl font-bold tracking-widest">{roomId}</div>
          </div>
          <div className="text-center text-xs text-white/30">
            Players scan this QR or enter the room code at<br />
            <span className="text-yellow-400">{playerUrl}</span>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" fullWidth onClick={() => setShowQR(false)}>Back</Button>
            <Button fullWidth onClick={enterTable}>
              Enter Table as Dealer
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showAddPlayer} onClose={() => setShowAddPlayer(false)} title="Add Player">
        <div className="space-y-4">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Player name"
            className="w-full glass rounded-xl px-4 py-3 text-base outline-none placeholder:text-white/30"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleAddPlayer()}
          />
          <div className="flex gap-3">
            <Button variant="ghost" fullWidth onClick={() => setShowAddPlayer(false)}>Cancel</Button>
            <Button fullWidth disabled={!newName.trim()} onClick={handleAddPlayer}>Add</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
