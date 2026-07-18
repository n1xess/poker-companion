const { WebSocketServer } = require('ws')

const PORT = process.env.PORT || 3001
const wss = new WebSocketServer({ port: PORT })

const rooms = {}

wss.on('connection', (ws) => {
  let roomId = null
  let role = null
  let playerId = null
  let playerName = null

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString())

      switch (msg.type) {
        case 'join': {
          roomId = msg.roomId
          role = msg.role
          playerId = msg.playerId
          playerName = msg.playerName || ''

          if (!rooms[roomId]) {
            rooms[roomId] = { dealer: null, players: {} }
          }

          if (role === 'dealer') {
            rooms[roomId].dealer = ws
            console.log(`[+] dealer joined room ${roomId}`)
          } else if (role === 'player') {
            rooms[roomId].players[playerId] = { ws, name: playerName }
            console.log(`[+] player ${playerName} (${playerId}) joined room ${roomId}`)
            const dealer = rooms[roomId].dealer
            if (dealer && dealer.readyState === ws.OPEN) {
              dealer.send(JSON.stringify({
                type: 'player_joined',
                playerId,
                playerName
              }))
            }
          }
          break
        }

        case 'action': {
          if (role === 'player' && rooms[roomId]) {
            const dealer = rooms[roomId].dealer
            if (dealer && dealer.readyState === ws.OPEN) {
              dealer.send(JSON.stringify({
                type: 'player_action',
                playerId: msg.playerId,
                playerName,
                actionType: msg.actionType,
                amount: msg.amount
              }))
            }
          }
          break
        }

        case 'state_update': {
          if (role === 'dealer' && rooms[roomId]) {
            const entries = Object.entries(rooms[roomId].players)
            entries.forEach(([pid, pdata]) => {
              if (pdata.ws.readyState === ws.OPEN) {
                pdata.ws.send(JSON.stringify({
                  type: 'game_state',
                  state: {
                    ...msg.state,
                    playerNames: msg.state.playerNames || {},
                    yourPlayerName: pdata.name
                  }
                }))
              }
            })
          }
          break
        }

        case 'player_list': {
          if (role === 'dealer' && rooms[roomId]) {
            const playerData = Object.values(rooms[roomId].players).map(p => ({
              playerId: p.name,
              name: p.name
            }))
            ws.send(JSON.stringify({
              type: 'player_list',
              players: playerData
            }))
          }
          break
        }
      }
    } catch (e) {
      console.error('WS message error:', e.message)
    }
  })

  ws.on('close', () => {
    if (roomId && rooms[roomId]) {
      if (role === 'dealer') {
        rooms[roomId].dealer = null
        console.log(`[-] dealer left room ${roomId}`)
      } else if (role === 'player' && playerId) {
        console.log(`[-] player ${playerName} (${playerId}) left room ${roomId}`)
        delete rooms[roomId].players[playerId]
        const dealer = rooms[roomId].dealer
        if (dealer && dealer.readyState === ws.OPEN) {
          dealer.send(JSON.stringify({ type: 'player_left', playerId, playerName }))
        }
      }
      const pCount = Object.keys(rooms[roomId]?.players || {}).length
      if (!rooms[roomId]?.dealer && pCount === 0) {
        delete rooms[roomId]
        console.log(`[X] room ${roomId} deleted`)
      }
    }
  })
})

console.log(`WS relay server running on port ${PORT}`)
