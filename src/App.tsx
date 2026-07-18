import { Routes, Route, Navigate } from 'react-router-dom'
import { SafeAreaWrapper } from './components/layout/safe-area-wrapper'
import { Toaster } from './components/ui/toast'
import { HomeScreen } from './components/screens/home-screen'
import { TableScreen } from './components/screens/table-screen'
import { SettingsScreen } from './components/screens/settings-screen'
import { PlayerScreen } from './components/screens/player-screen'

export default function App() {
  return (
    <SafeAreaWrapper>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/table/:tableId" element={<TableScreen />} />
        <Route path="/player" element={<PlayerScreen />} />
        <Route path="/settings" element={<SettingsScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </SafeAreaWrapper>
  )
}
