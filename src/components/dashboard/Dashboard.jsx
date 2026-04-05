import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'

export default function Dashboard() {
  return (
    <div className="p-4 space-y-4">
      <header className="pt-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-brand">QuoteMate</h1>
          <p className="text-sm text-slate-500">Quote it. Send it. Track it. Done.</p>
        </div>
        <Link
          to="/quotes/new"
          className="btn-primary !py-2.5 !px-3.5 whitespace-nowrap shrink-0 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New quote
        </Link>
      </header>

      <section className="grid grid-cols-2 gap-3">
        <StatCard label="Quotes this month" value="—" />
        <StatCard label="Acceptance rate" value="—" />
        <StatCard label="Active jobs" value="—" />
        <StatCard label="Quoted value" value="—" />
      </section>

      <section className="card">
        <h2 className="font-semibold mb-2">Recent activity</h2>
        <p className="text-sm text-slate-500">No activity yet.</p>
      </section>
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <div className="card">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-2xl font-bold text-brand mt-1">{value}</div>
    </div>
  )
}
