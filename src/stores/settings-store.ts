import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { GameSettings } from '../types'

interface SettingsState extends GameSettings {
  setDefaultSb: (v: number) => void
  setDefaultBb: (v: number) => void
  setDefaultStack: (v: number) => void
  setTheme: (t: 'dark' | 'light') => void
  toggleSound: () => void
  toggleHaptic: () => void
  setPlayerMode: (m: 'dealer' | 'player') => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      defaultSb: 10,
      defaultBb: 20,
      defaultStack: 1000,
      theme: 'dark',
      soundEnabled: true,
      hapticEnabled: true,
      playerMode: 'dealer',
      setDefaultSb: (v) => set({ defaultSb: v }),
      setDefaultBb: (v) => set({ defaultBb: v }),
      setDefaultStack: (v) => set({ defaultStack: v }),
      setTheme: (t) => set({ theme: t }),
      toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
      toggleHaptic: () => set((s) => ({ hapticEnabled: !s.hapticEnabled })),
      setPlayerMode: (m) => set({ playerMode: m }),
    }),
    { name: 'poker-settings' }
  )
)
