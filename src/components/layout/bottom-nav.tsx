import { NavLink } from 'react-router-dom'
import { Home, Users, Settings } from 'lucide-react'

const links = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/players', icon: Users, label: 'Players' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export function BottomNav() {
  return (
    <nav
      className="glass border-t border-white/10 flex justify-around items-center py-2"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)' }}
    >
      {links.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-4 py-1 text-xs font-medium transition-colors ${
              isActive ? 'text-accent' : 'text-white/50'
            }`
          }
        >
          <Icon size={22} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
