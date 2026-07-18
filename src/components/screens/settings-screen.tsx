import { useNavigate, useSearchParams } from 'react-router-dom'
import { useSettingsStore } from '../../stores/settings-store'
import { useGameStore } from '../../stores/game-store'
import { usePlayerStore } from '../../stores/player-store'
import { useUIStore } from '../../stores/ui-store'
import { Button } from '../ui/button'
import { Modal } from '../ui/modal'
import { ArrowLeft } from 'lucide-react'
import { useState, useEffect } from 'react'

export function SettingsScreen() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const settings = useSettingsStore()
  const game = useGameStore()
  const players = usePlayerStore()
  const showToast = useUIStore((s) => s.showToast)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null)
  const [editStackValue, setEditStackValue] = useState('')

  const allPlayers = players.players

  useEffect(() => {
    const pid = searchParams.get('playerId')
    if (pid) {
      handleEditStack(pid)
    }
  }, [searchParams])

  const handleResetGame = () => {
    game.resetGame()
    showToast('Game reset', 'success')
    setShowResetConfirm(false)
  }

  const handleEditStack = (playerId: string) => {
    const p = allPlayers.find((pl) => pl.id === playerId)
    if (!p) return
    setEditingPlayerId(playerId)
    setEditStackValue(String(p.stack))
  }

  const handleSaveStack = () => {
    if (!editingPlayerId) return
    const val = parseInt(editStackValue, 10)
    if (isNaN(val) || val < 0) return
    players.updateStack(editingPlayerId, val)
    setEditingPlayerId(null)
    showToast('Stack updated', 'success')
  }

  return (
    <div className="flex flex-col min-h-screen p-4">
      <div className="flex items-center gap-3 mb-6 pt-4">
        <button onClick={() => navigate(-1)} className="p-2 glass rounded-xl">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <div className="space-y-6">
        <section>
          <h2 className="text-sm font-medium text-white/50 mb-3">Game Settings</h2>
          <div className="glass rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Small Blind</span>
              <input
                type="number"
                value={settings.defaultSb}
                onChange={(e) => settings.setDefaultSb(parseInt(e.target.value) || 5)}
                className="w-20 text-right bg-transparent outline-none tabular-nums"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Big Blind</span>
              <input
                type="number"
                value={settings.defaultBb}
                onChange={(e) => settings.setDefaultBb(parseInt(e.target.value) || 10)}
                className="w-20 text-right bg-transparent outline-none tabular-nums"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Starting Stack</span>
              <input
                type="number"
                value={settings.defaultStack}
                onChange={(e) => settings.setDefaultStack(parseInt(e.target.value) || 200)}
                className="w-20 text-right bg-transparent outline-none tabular-nums"
              />
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-sm font-medium text-white/50 mb-3">Player Stacks</h2>
          <div className="glass rounded-2xl p-4 space-y-3">
            {allPlayers.length === 0 ? (
              <p className="text-sm text-white/30 text-center">No players</p>
            ) : (
              allPlayers.map((p) => (
                <div key={p.id} className="flex items-center justify-between">
                  <span className="text-sm">{p.name}</span>
                  <button
                    onClick={() => handleEditStack(p.id)}
                    className="text-sm text-accent underline"
                  >
                    ${p.stack}
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        <section>
          <h2 className="text-sm font-medium text-white/50 mb-3">Preferences</h2>
          <div className="glass rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Dark Theme</span>
              <button
                onClick={() => settings.setTheme(settings.theme === 'dark' ? 'light' : 'dark')}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.theme === 'dark' ? 'bg-accent' : 'bg-white/20'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.theme === 'dark' ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Sound</span>
              <button
                onClick={settings.toggleSound}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.soundEnabled ? 'bg-accent' : 'bg-white/20'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.soundEnabled ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Haptic</span>
              <button
                onClick={settings.toggleHaptic}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.hapticEnabled ? 'bg-accent' : 'bg-white/20'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.hapticEnabled ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        <div className="space-y-2">
          <Button
            variant="destructive"
            fullWidth
            onClick={() => setShowResetConfirm(true)}
          >
            Reset All Game Data
          </Button>
        </div>

        <div className="text-center text-xs text-white/20 pb-[env(safe-area-inset-bottom,16px)]">
          Poker Companion v1.0.0
        </div>
      </div>

      <Modal isOpen={showResetConfirm} onClose={() => setShowResetConfirm(false)} title="Reset Game?">
        <div className="space-y-4">
          <p className="text-sm text-white/70 text-center">This will delete all game data and player info.</p>
          <div className="flex gap-3">
            <Button variant="ghost" fullWidth onClick={() => setShowResetConfirm(false)}>Cancel</Button>
            <Button variant="destructive" fullWidth onClick={handleResetGame}>Reset</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!editingPlayerId} onClose={() => setEditingPlayerId(null)} title="Edit Stack">
        <div className="space-y-4">
          <input
            type="number"
            value={editStackValue}
            onChange={(e) => setEditStackValue(e.target.value)}
            className="w-full text-center text-2xl font-bold bg-transparent border-b border-white/20 outline-none py-2"
            autoFocus
          />
          <div className="flex gap-3">
            <Button variant="ghost" fullWidth onClick={() => setEditingPlayerId(null)}>Cancel</Button>
            <Button fullWidth onClick={handleSaveStack}>Save</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
