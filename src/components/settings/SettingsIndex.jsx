import { Link } from 'react-router-dom'
import { Building2, Tags, CreditCard, LogOut, ChevronRight } from 'lucide-react'

const items = [
  { to: '/settings/business', label: 'Business profile', icon: Building2 },
  { to: '/settings/pricing', label: 'Pricing library', icon: Tags },
  { to: '/settings/subscription', label: 'Subscription', icon: CreditCard }
]

export default function SettingsIndex() {
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Settings</h1>
      <div className="card p-0 divide-y divide-slate-100">
        {items.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="flex items-center gap-3 px-4 py-4 hover:bg-slate-50"
          >
            <Icon className="w-5 h-5 text-slate-500" />
            <span className="flex-1">{label}</span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </Link>
        ))}
      </div>
      <button className="btn-secondary w-full text-red-600 border-red-100">
        <LogOut className="w-4 h-4" />
        Sign out
      </button>
    </div>
  )
}
