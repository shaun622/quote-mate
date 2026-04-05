import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { supabase } from '../../lib/supabase.js'
import { useBusiness } from '../../hooks/useBusiness.jsx'
import { ACTIVE_STATUSES } from '../../hooks/useJobs.js'
import { formatAUD, formatDateAEST } from '../../lib/utils.js'

export default function Dashboard() {
  const { business } = useBusiness()
  const [stats, setStats] = useState({
    quotesThisMonth: 0,
    acceptanceRate: null,
    activeJobs: 0,
    quotedValue: 0
  })
  const [activity, setActivity] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!business) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

      const [quotesRes, jobsRes, recentRes] = await Promise.all([
        supabase
          .from('quotes')
          .select('id,status,total,created_at')
          .eq('business_id', business.id)
          .gte('created_at', monthStart),
        supabase
          .from('jobs')
          .select('id,status')
          .eq('business_id', business.id)
          .in('status', ACTIVE_STATUSES),
        supabase
          .from('quotes')
          .select('id,quote_number,customer_name,status,total,created_at,responded_at,sent_at')
          .eq('business_id', business.id)
          .order('created_at', { ascending: false })
          .limit(6)
      ])

      if (cancelled) return

      const quotes = quotesRes.data || []
      const responded = quotes.filter((q) =>
        ['accepted', 'declined'].includes(q.status)
      )
      const accepted = quotes.filter((q) => q.status === 'accepted')
      const acceptanceRate = responded.length > 0
        ? Math.round((accepted.length / responded.length) * 100)
        : null
      const quotedValue = quotes.reduce((s, q) => s + Number(q.total || 0), 0)

      setStats({
        quotesThisMonth: quotes.length,
        acceptanceRate,
        activeJobs: (jobsRes.data || []).length,
        quotedValue
      })
      setActivity(recentRes.data || [])
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [business])

  const quotedValueDisplay = useMemo(
    () => (loading ? '—' : formatAUD(stats.quotedValue)),
    [loading, stats.quotedValue]
  )

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
        <StatCard
          label="Quotes this month"
          value={loading ? '—' : String(stats.quotesThisMonth)}
        />
        <StatCard
          label="Acceptance rate"
          value={
            loading
              ? '—'
              : stats.acceptanceRate == null
              ? '—'
              : `${stats.acceptanceRate}%`
          }
        />
        <StatCard
          label="Active jobs"
          value={loading ? '—' : String(stats.activeJobs)}
        />
        <StatCard label="Quoted value" value={quotedValueDisplay} small />
      </section>

      <section className="card">
        <h2 className="font-semibold mb-2">Recent activity</h2>
        {loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : activity.length === 0 ? (
          <p className="text-sm text-slate-500">No activity yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100 -mx-1">
            {activity.map((q) => (
              <li key={q.id}>
                <Link
                  to={`/quotes/${q.id}`}
                  className="flex items-center justify-between gap-3 px-1 py-2.5 hover:bg-slate-50 active:bg-slate-100 rounded"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">
                      {q.customer_name}
                    </div>
                    <div className="text-xs text-slate-500">
                      {q.quote_number} · {labelFor(q)}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-semibold text-brand">
                      {formatAUD(q.total)}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {formatDateAEST(q.responded_at || q.sent_at || q.created_at)}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function labelFor(q) {
  switch (q.status) {
    case 'accepted': return 'Accepted'
    case 'declined': return 'Declined'
    case 'viewed': return 'Viewed'
    case 'sent': return 'Sent'
    case 'expired': return 'Expired'
    default: return 'Draft'
  }
}

function StatCard({ label, value, small }) {
  return (
    <div className="card">
      <div className="text-xs text-slate-500">{label}</div>
      <div
        className={`font-bold text-brand mt-1 ${
          small ? 'text-lg' : 'text-2xl'
        }`}
      >
        {value}
      </div>
    </div>
  )
}
