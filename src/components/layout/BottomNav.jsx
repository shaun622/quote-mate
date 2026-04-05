import { NavLink } from 'react-router-dom'
import { Home, FileText, Briefcase, Calendar, Settings } from 'lucide-react'
import { cn } from '../../lib/utils.js'

const tabs = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/quotes', label: 'Quotes', icon: FileText },
  { to: '/jobs', label: 'Jobs', icon: Briefcase },
  { to: '/calendar', label: 'Calendar', icon: Calendar },
  { to: '/settings', label: 'Settings', icon: Settings }
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 safe-bottom z-40">
      <ul className="grid grid-cols-5">
        {tabs.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center gap-1 py-2.5 min-h-[56px] text-xs font-medium transition',
                  isActive ? 'text-brand' : 'text-slate-500'
                )
              }
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
