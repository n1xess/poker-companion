import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Player } from '../types'

function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}

interface PlayerState {
  players: Player[]
  addPlayer: (name: string, initialStack: number) => void
  removePlayer: (id: string) => void
  updateStack: (id: string, amount: number) => void
  rebuyPlayer: (id: string, amount?: number) => void
  toggleSitOut: (id: string) => void
  setPlayerOrder: (ids: string[]) => void
  clearPlayers: () => void
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set) => ({
      players: [],
      addPlayer: (name, initialStack) =>
        set((s) => ({
          players: [
            ...s.players,
            {
              id: generateId(),
              name,
              stack: initialStack,
              initialStack,
              isActive: true,
              isSittingOut: false,
              cards: [],
              hasCards: false,
              order: s.players.length,
            },
          ],
        })),
      removePlayer: (id) =>
        set((s) => ({
          players: s.players.filter((p) => p.id !== id),
        })),
      updateStack: (id, amount) =>
        set((s) => ({
          players: s.players.map((p) =>
            p.id === id ? { ...p, stack: Math.max(0, amount) } : p
          ),
        })),
      rebuyPlayer: (id, amount) =>
        set((s) => {
          const player = s.players.find((p) => p.id === id)
          if (!player) return s
          return {
            players: s.players.map((p) =>
              p.id === id
                ? { ...p, stack: p.stack + (amount ?? p.initialStack) }
                : p
            ),
          }
        }),
      toggleSitOut: (id) =>
        set((s) => ({
          players: s.players.map((p) =>
            p.id === id ? { ...p, isSittingOut: !p.isSittingOut } : p
          ),
        })),
      setPlayerOrder: (ids) =>
        set((s) => ({
          players: ids
            .map((id, idx) => {
              const p = s.players.find((pl) => pl.id === id)
              return p ? { ...p, order: idx } : null
            })
            .filter(Boolean) as Player[],
        })),
      clearPlayers: () => set({ players: [] }),
    }),
    { name: 'poker-players' }
  )
)
