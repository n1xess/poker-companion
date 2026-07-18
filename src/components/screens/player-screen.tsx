import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { PlayerConnectedView } from '../player/player-connected-view'
import { wsService } from '../../services/websocket-service'
import { Button } from '../ui/button'
import { ArrowLeft, Wifi, WifiOff } from 'lucide-react'

interface PlayerData {
  id: string
  name: string
  stack: number
  isActive: boolean
  isSittingOut: boolean
}

interface GameState {
  players: PlayerData[]
  yourId: string
  communityCards: number
  pot: number
  currentBet: number
  phase: string
  currentTurnPlayerId: string
  playerBets: Record<string, number>
  playerFolded: string[]
  playerAllIn: string[]
  sbAmount: number
  bbAmount: number
  playerNames: Record<string, string>
}

export function PlayerScreen() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const roomId = searchParams.get('room') || ''
  const [name, setName] = useState('')
  const [playerId, setPlayerId] = useState('')
  const [joined, setJoined] = useState(false)
  const [connected, setConnected] = useState(false)
  const [gameState, setGameState] = useState<GameState | null>(null)

  const handleJoin = () => {
    if (!name.trim()) return
    const id = 'player-' + Math.random().toString(36).substring(2, 8)
    setPlayerId(id)
    wsService.connect(roomId, 'player', id, name.trim())
    setJoined(true)
  }

  useEffect(() => {
    if (!joined) return

    const unsubConnected = wsService.on('connected', () => {
      setConnected(true)
    })

    const unsubDisconnected = wsService.on('disconnected', () => {
      setConnected(false)
    })

    const unsubState = wsService.on('game_state', (msg) => {
      const playerNames = msg.state.playerNames || {}
      const myStoreId = Object.entries(playerNames).find(
        ([, n]) => n === msg.state.yourPlayerName
      )?.[0] || ''

      setGameState({
        ...msg.state,
        yourId: myStoreId,
      })
    })

    return () => {
      unsubConnected()
      unsubDisconnected()
      unsubState()
    }
  }, [joined])

  const handleAction = useCallback((type: string, amount: number) => {
    const storeId = gameState?.yourId || playerId
    wsService.send({
      type: 'action',
      playerId: storeId,
      actionType: type,
      amount,
    })
  }, [playerId, gameState?.yourId])

  if (!roomId) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center p-4 gap-4">
        <p className="text-white/50 text-sm">No room code provided.</p>
        <p className="text-white/30 text-xs">Scan the dealer's QR code or enter a room code.</p>
        <Button variant="ghost" onClick={() => navigate('/')}>Go Home</Button>
      </div>
    )
  }

  if (!joined) {
    return (
      <div className="flex flex-col min-h-screen p-4"
        style={{ paddingTop: 'env(safe-area-inset-top, 20px)' }}
      >
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => navigate('/')} className="p-2 glass rounded-xl">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold">Join Game</h1>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          <div className="chip-gold w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-black">
            ♠
          </div>

          <div className="text-center">
            <div className="text-sm text-white/50 mb-1">Room Code</div>
            <div className="text-3xl font-bold tracking-widest">{roomId}</div>
          </div>

          <div className="w-full max-w-xs space-y-4">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full glass rounded-xl px-4 py-3 text-base outline-none placeholder:text-white/30 text-center"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            />
            <Button fullWidth size="lg" disabled={!name.trim()} onClick={handleJoin}>
              Join Table
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#0a3d18] to-black"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <div className="flex items-center justify-center px-4 py-2">
        {connected ? (
          <span className="flex items-center gap-1 text-[10px] text-green-400">
            <Wifi size={10} /> Connected to table
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[10px] text-red-400">
            <WifiOff size={10} /> Reconnecting...
          </span>
        )}
      </div>

      <PlayerConnectedView
        gameState={gameState}
        onAction={handleAction}
        playerName={name}
      />
    </div>
  )
}
