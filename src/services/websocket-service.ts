type MessageHandler = (data: any) => void

class WebSocketService {
  private ws: WebSocket | null = null
  private handlers = new Map<string, MessageHandler[]>()
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private serverUrl: string
  private roomId: string = ''
  private role: string = ''
  private playerId: string = ''
  private playerName: string = ''

  constructor() {
    this.serverUrl = import.meta.env.VITE_WS_URL || `ws://${window.location.hostname}:3001`
  }

  connect(roomId: string, role: string, playerId: string, playerName?: string) {
    this.roomId = roomId
    this.role = role
    this.playerId = playerId
    this.playerName = playerName || ''

    this.ws = new WebSocket(this.serverUrl)

    this.ws.onopen = () => {
      this.ws!.send(JSON.stringify({ type: 'join', roomId, role, playerId, playerName: this.playerName }))
      this.emit('connected', { roomId, role })
    }

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        this.emit(msg.type, msg)
      } catch (e) {
        console.error('WS parse error:', e)
      }
    }

    this.ws.onclose = () => {
      this.emit('disconnected', {})
      this.reconnectTimer = setTimeout(() => {
        if (this.roomId) this.connect(this.roomId, this.role, this.playerId, this.playerName)
      }, 3000)
    }

    this.ws.onerror = () => {
      this.ws?.close()
    }
  }

  send(data: object) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    }
  }

  on(event: string, handler: MessageHandler) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, [])
    }
    this.handlers.get(event)!.push(handler)
    return () => this.off(event, handler)
  }

  off(event: string, handler: MessageHandler) {
    const handlers = this.handlers.get(event)
    if (handlers) {
      const idx = handlers.indexOf(handler)
      if (idx >= 0) handlers.splice(idx, 1)
    }
  }

  private emit(event: string, data: any) {
    this.handlers.get(event)?.forEach((h) => h(data))
  }

  disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    this.ws?.close()
    this.ws = null
    this.handlers.clear()
  }

  isConnected() {
    return this.ws?.readyState === WebSocket.OPEN
  }
}

export const wsService = new WebSocketService()
