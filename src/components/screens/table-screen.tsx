import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useGameStore } from '../../stores/game-store'
import { usePlayerStore } from '../../stores/player-store'
import { useSettingsStore } from '../../stores/settings-store'
import { useUIStore } from '../../stores/ui-store'
import { PokerTable } from '../table/poker-table'
import { WinnerSelector } from '../dealer/winner-selector'
import { HandHistory } from '../dealer/hand-history'
import { PlayerView } from '../player/player-view'
import { Button } from '../ui/button'
import { BottomSheet } from '../ui/bottom-sheet'
import { Modal } from '../ui/modal'
import { CardSelector } from '../ui/card-selector'
import { formatChips } from '../../utils/format'
import { ArrowLeft, RotateCcw, Trophy, Eye, EyeOff, Wifi, WifiOff, Square, ChevronsRight, Circle, Plus, Trash2 } from 'lucide-react'
import { wsService } from '../../services/websocket-service'

export function TableScreen() {
  const navigate = useNavigate()
  const { tableId } = useParams()
  const isDealerMode = useGameStore((s) => s.isDealerMode)
  const setDealerMode = useGameStore((s) => s.setDealerMode)
  const phase = useGameStore((s) => s.phase)
  const players = useGameStore((s) => s.players)
  const startNewHand = useGameStore((s) => s.startNewHand)
  const dealStreet = useGameStore((s) => s.dealStreet)
  const performAction = useGameStore((s) => s.performAction)
  const currentBet = useGameStore((s) => s.currentBet)
  const pot = useGameStore((s) => s.pot)
  const currentTurnIndex = useGameStore((s) => s.currentTurnIndex)
  const playerBets = useGameStore((s) => s.playerBets)
  const playerFolded = useGameStore((s) => s.playerFolded)
  const playerAllIn = useGameStore((s) => s.playerAllIn)
  const communityCards = useGameStore((s) => s.communityCards)
  const streetActionComplete = useGameStore((s) => s.streetActionComplete)
  const winnerId = useGameStore((s) => s.winnerId)
  const winnerAmount = useGameStore((s) => s.winnerAmount)
  const clearWinner = useGameStore((s) => s.clearWinner)
  const communityCardsStr = useGameStore((s) => s.communityCardsStr)
  const setCommunityCardsStr = useGameStore((s) => s.setCommunityCardsStr)

  const playerStorePlayers = usePlayerStore((s) => s.players)
  const addPlayer = usePlayerStore((s) => s.addPlayer)
  const removePlayer = usePlayerStore((s) => s.removePlayer)
  const rebuyPlayer = usePlayerStore((s) => s.rebuyPlayer)
  const toggleSitOut = usePlayerStore((s) => s.toggleSitOut)
  const defaultStack = useSettingsStore((s) => s.defaultStack)
  const showToast = useUIStore((s) => s.showToast)

  const [showWinnerSelect, setShowWinnerSelect] = useState(false)
  const [showPlayerMenu, setShowPlayerMenu] = useState(false)
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)
  const [connectedPlayerNames, setConnectedPlayerNames] = useState<string[]>([])
  const [showGiveChips, setShowGiveChips] = useState(false)
  const [giveChipsAmount, setGiveChipsAmount] = useState('')
  const [showCommunityCards, setShowCommunityCards] = useState(false)
  const [showAddPlayer, setShowAddPlayer] = useState(false)
  const [newPlayerName, setNewPlayerName] = useState('')
  const prevStateRef = useRef('')

  const roomId = tableId || ''

  useEffect(() => {
    if (!roomId) return
    const dealerId = 'dealer-' + roomId
    wsService.connect(roomId, 'dealer', dealerId)

    const unsubConnected = wsService.on('connected', () => {
      setConnected(true)
      showToast('Table is live!', 'success')
    })

    const unsubDisconnected = wsService.on('disconnected', () => {
      setConnected(false)
    })

    const unsubAction = wsService.on('player_action', (msg) => {
      performAction(msg.playerId, msg.actionType, msg.amount)
      showToast(`${msg.playerName}: ${msg.actionType}`, 'info')
    })

    const unsubPlayerJoined = wsService.on('player_joined', (msg) => {
      setConnectedPlayerNames((prev) => {
        if (prev.includes(msg.playerName)) return prev
        return [...prev, msg.playerName]
      })
      showToast(`${msg.playerName} connected`, 'success')
    })

    const unsubPlayerLeft = wsService.on('player_left', (msg) => {
      setConnectedPlayerNames((prev) => prev.filter(n => n !== msg.playerName))
      showToast(`${msg.playerName} disconnected`, 'info')
    })

    return () => {
      unsubConnected()
      unsubDisconnected()
      unsubAction()
      unsubPlayerJoined()
      unsubPlayerLeft()
      wsService.disconnect()
    }
  }, [roomId])

  // Broadcast state changes to players
  useEffect(() => {
    if (!connected) return

    const state = useGameStore.getState()
    const playerNames = Object.fromEntries(state.players.map(p => [p.id, p.name]))
    const stateForPlayers = {
      players: state.players.map(p => ({
        id: p.id,
        name: p.name,
        stack: p.stack,
        isActive: p.isActive,
        isSittingOut: p.isSittingOut,
      })),
      playerNames,
      communityCards: state.communityCards.length,
      pot: state.pot,
      currentBet: state.currentBet,
      phase: state.phase,
      currentTurnPlayerId: state.currentTurnIndex >= 0 ? state.players[state.currentTurnIndex]?.id : '',
      playerBets: state.playerBets,
      playerFolded: state.playerFolded,
      playerAllIn: state.playerAllIn,
      sbAmount: state.sbAmount,
      bbAmount: state.bbAmount,
      streetActionComplete: state.streetActionComplete,
      winnerId: state.winnerId,
      winnerAmount: state.winnerAmount,
      communityCardsStr: state.communityCards.length > 0
        ? state.communityCards.map(c => `${c.rank}${c.suit[0]}`)
        : state.communityCardsStr,
    }

    const stateJson = JSON.stringify(stateForPlayers)
    if (stateJson !== prevStateRef.current) {
      prevStateRef.current = stateJson
      wsService.send({ type: 'state_update', state: stateForPlayers })
    }
  }, [connected, phase, pot, currentBet, currentTurnIndex, playerBets, playerFolded, playerAllIn, communityCards, players, communityCardsStr])

  const handlePlayerTap = (playerId: string) => {
    setSelectedPlayerId(playerId)
    setShowPlayerMenu(true)
  }

  const handleRebuy = () => {
    if (!selectedPlayerId) return
    const player = playerStorePlayers.find((p) => p.id === selectedPlayerId)
    if (!player) return
    rebuyPlayer(selectedPlayerId, defaultStack)
    const gamePlayer = useGameStore.getState().players.find((p) => p.id === selectedPlayerId)
    if (gamePlayer) {
      useGameStore.setState({
        players: useGameStore.getState().players.map((p) =>
          p.id === selectedPlayerId ? { ...p, stack: p.stack + defaultStack } : p
        ),
      })
    }
    showToast('Rebuy successful', 'success')
    setShowPlayerMenu(false)
  }

  const handleSitOut = () => {
    if (selectedPlayerId) {
      toggleSitOut(selectedPlayerId)
      showToast('Sit out toggled', 'info')
      setShowPlayerMenu(false)
    }
  }

  const handleEditStack = () => {
    if (selectedPlayerId) {
      navigate(`/settings?playerId=${selectedPlayerId}`)
      setShowPlayerMenu(false)
    }
  }

  const handleRemovePlayer = () => {
    if (!selectedPlayerId) return
    removePlayer(selectedPlayerId)
    const game = useGameStore.getState()
    useGameStore.setState({
      players: game.players.filter(p => p.id !== selectedPlayerId),
    })
    showToast('Player removed', 'info')
    setShowPlayerMenu(false)
  }

  const handleAddPlayerFromTable = () => {
    const name = newPlayerName.trim()
    if (!name) return
    addPlayer(name, defaultStack)
    setNewPlayerName('')
    setShowAddPlayer(false)
    showToast(`${name} added`, 'success')
  }

  const handleGiveChips = () => {
    const amount = parseInt(giveChipsAmount, 10)
    if (isNaN(amount) || amount <= 0) return
    if (!selectedPlayerId) return

    rebuyPlayer(selectedPlayerId, amount)
    const gamePlayer = useGameStore.getState().players.find((p) => p.id === selectedPlayerId)
    if (gamePlayer) {
      useGameStore.setState({
        players: useGameStore.getState().players.map((p) =>
          p.id === selectedPlayerId ? { ...p, stack: p.stack + amount } : p
        ),
      })
    }
    showToast(`Gave ${formatChips(amount)} chips`, 'success')
    setShowGiveChips(false)
    setGiveChipsAmount('')
    setShowPlayerMenu(false)
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#0a3d18] to-black">
      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={() => navigate('/')} className="p-2 glass rounded-xl">
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-2">
          {connected ? (
            <span className="flex items-center gap-1 text-[10px] text-green-400">
              <Wifi size={12} /> {connectedPlayerNames.length} online
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] text-red-400">
              <WifiOff size={12} /> offline
            </span>
          )}
          <button
            onClick={() => setDealerMode(!isDealerMode)}
            className={`p-2 rounded-xl transition-colors ${isDealerMode ? 'glass text-yellow-400' : 'glass text-white/50'}`}
          >
            {isDealerMode ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
          <span className="text-xs text-white/50">{isDealerMode ? 'Dealer' : 'Player'}</span>
        </div>
      </div>

      <div className="flex-1 px-3">
        {phase === 'idle' ? (
          <div className="flex flex-col items-center justify-center min-h-full gap-6">
            <PokerTable onPlayerTap={handlePlayerTap} />
            <Button
              size="lg"
              className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold shadow-lg"
              onClick={() => startNewHand(playerStorePlayers.filter((p) => p.isActive && !p.isSittingOut))}
            >
              ♠ New Hand ♥
            </Button>
          </div>
        ) : isDealerMode ? (
          <div className="flex flex-col gap-4 pb-4">
            <PokerTable onPlayerTap={handlePlayerTap} />

            {/* Auto-winner banner */}
            {phase === 'showdown' && winnerId && (
              <div className="glass rounded-2xl p-4 text-center animate-fade-in border border-yellow-400/30">
                <div className="chip-gold w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-black mx-auto mb-2">♠</div>
                <div className="text-lg font-bold">
                  🏆 {players.find(p => p.id === winnerId)?.name || 'Unknown'} wins!
                </div>
                <div className="text-2xl font-bold text-yellow-400 mt-1 tabular-nums">
                  ${formatChips(winnerAmount)}
                </div>
                <div className="mt-3">
                  <Button fullWidth onClick={() => { clearWinner(); startNewHand(playerStorePlayers.filter((p) => p.isActive && !p.isSittingOut)) }}>
                    <RotateCcw size={16} className="mr-1" /> Next Hand
                  </Button>
                </div>
              </div>
            )}

            {/* Dealer controls — street buttons during play, New Hand also during manual showdown */}
            <div className="glass rounded-2xl p-3 space-y-2">
                {phase !== 'showdown' && (<>
                  <div className="grid grid-cols-2 gap-2">
                    {streetActionComplete && phase === 'preflop' && (
                      <Button variant="secondary" fullWidth onClick={() => dealStreet('flop')}>
                        <Square size={14} className="mr-1" /> Deal Flop
                      </Button>
                    )}
                    {streetActionComplete && phase === 'flop' && (
                      <Button variant="secondary" fullWidth onClick={() => dealStreet('turn')}>
                        <ChevronsRight size={14} className="mr-1" /> Deal Turn
                      </Button>
                    )}
                    {streetActionComplete && phase === 'turn' && (
                      <Button variant="secondary" fullWidth onClick={() => dealStreet('river')}>
                        <Circle size={14} className="mr-1" /> Deal River
                      </Button>
                    )}
                    {streetActionComplete && phase === 'river' && (
                      <Button variant="secondary" fullWidth onClick={() => setShowWinnerSelect(true)}>
                        <Trophy size={16} className="mr-1" /> Show Winners
                      </Button>
                    )}
                  {!streetActionComplete && currentTurnIndex < 0 && phase !== 'preflop' && (
                    <Button variant="secondary" fullWidth onClick={() => setShowWinnerSelect(true)}>
                      <Trophy size={16} className="mr-1" /> Show Winners
                    </Button>
                  )}
                </div>
                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => setShowAddPlayer(true)}
                    className="text-[10px] text-white/30 hover:text-white/60 transition-colors"
                  >
                    + Add Player
                  </button>
                  <button
                    onClick={() => setShowCommunityCards(true)}
                    className="text-[10px] text-white/30 hover:text-white/60 transition-colors"
                  >
                    {communityCardsStr.length > 0 ? `Set Cards (${communityCardsStr.length})` : 'Set Community Cards'}
                  </button>
                </div>
                </>)}
                <Button variant="ghost" fullWidth onClick={() => { clearWinner(); startNewHand(playerStorePlayers.filter((p) => p.isActive && !p.isSittingOut)) }}>
                  <RotateCcw size={16} className="mr-1" /> New Hand
                </Button>
              </div>

            <HandHistory />
          </div>
        ) : (
          <PlayerView />
        )}
      </div>

      <WinnerSelector isOpen={showWinnerSelect} onClose={() => setShowWinnerSelect(false)} />

      <CardSelector
        isOpen={showCommunityCards}
        onClose={() => setShowCommunityCards(false)}
        selectedCards={communityCardsStr}
        maxCards={5}
        onCardsChange={setCommunityCardsStr}
        title="Set Community Cards (Flop/Turn/River)"
      />

      <BottomSheet isOpen={showPlayerMenu} onClose={() => setShowPlayerMenu(false)} title="Player Actions">
        <div className="space-y-2">
          {selectedPlayerId && (() => {
            const p = playerStorePlayers.find(pl => pl.id === selectedPlayerId)
            const isOnline = p && connectedPlayerNames.includes(p.name)
            return isOnline ? <div className="text-center text-xs text-green-400 mb-1">● Connected</div> : null
          })()}
          <Button fullWidth variant="primary" onClick={handleRebuy}>Rebuy (${formatChips(defaultStack)})</Button>
          <Button fullWidth variant="secondary" onClick={() => { setGiveChipsAmount(''); setShowGiveChips(true); }}>
            + Give Chips
          </Button>
          <Button fullWidth variant="secondary" onClick={handleSitOut}>Sit Out / Return</Button>
          <Button fullWidth variant="secondary" onClick={handleEditStack}>Edit Stack</Button>
          <Button fullWidth variant="destructive" onClick={handleRemovePlayer}>
            <Trash2 size={14} className="mr-1" /> Remove Player
          </Button>
          <Button fullWidth variant="ghost" onClick={() => setShowPlayerMenu(false)}>Cancel</Button>
        </div>
      </BottomSheet>

      {/* Add Player Modal */}
      <Modal isOpen={showAddPlayer} onClose={() => setShowAddPlayer(false)} title="Add Player">
        <div className="space-y-4">
          <input
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            placeholder="Player name"
            className="w-full glass rounded-xl px-4 py-3 text-base outline-none placeholder:text-white/30 text-center"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleAddPlayerFromTable()}
          />
          <div className="flex gap-3">
            <Button variant="ghost" fullWidth onClick={() => setShowAddPlayer(false)}>Cancel</Button>
            <Button fullWidth disabled={!newPlayerName.trim()} onClick={handleAddPlayerFromTable}>
              <Plus size={16} className="mr-1" /> Add
            </Button>
          </div>
        </div>
      </Modal>

      {/* Give Chips Modal */}
      <Modal isOpen={showGiveChips} onClose={() => setShowGiveChips(false)} title="Give Chips">
        <div className="space-y-4">
          <input
            value={giveChipsAmount}
            onChange={(e) => setGiveChipsAmount(e.target.value)}
            placeholder="Amount"
            type="number"
            className="w-full glass rounded-xl px-4 py-3 text-base outline-none placeholder:text-white/30 text-center"
            autoFocus
            min={1}
            onKeyDown={(e) => e.key === 'Enter' && handleGiveChips()}
          />
          <div className="flex gap-3">
            <Button variant="ghost" fullWidth onClick={() => setShowGiveChips(false)}>Cancel</Button>
            <Button fullWidth disabled={!giveChipsAmount || parseInt(giveChipsAmount) <= 0} onClick={handleGiveChips}>
              Give ${formatChips(parseInt(giveChipsAmount) || 0)}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
