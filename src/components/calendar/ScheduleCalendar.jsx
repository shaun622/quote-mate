import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '../../lib/supabase.js'
import { useBusiness } from '../../hooks/useBusiness.jsx'
import { formatAUD } from '../../lib/utils.js'
import JobStatusBadge from '../jobs/JobStatusBadge.jsx'

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}
function endOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0)
}
function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}
function toDateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function ScheduleCalendar() {
  const { business } = useBusiness()
  const [month, setMonth] = useState(startOfMonth(new Date()))
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(toDateKey(new Date()))

  const loadJobs = useCallback(async () => {
    if (!business) return
    setLoading(true)
    const start = startOfMonth(month).toISOString().slice(0, 10)
    const end = endOfMonth(month).toISOString().slice(0, 10)
    const { data } = await supabase
      .from('jobs')
      .select('id,job_number,status,customer_name,job_site_address,scheduled_start,quotes(total)')
      .eq('business_id', business.id)
      .gte('scheduled_start', start)
      .lte('scheduled_start', end)
      .order('scheduled_start')
    setJobs(data || [])
    setLoading(false)
  }, [business, month])

  useEffect(() => { loadJobs() }, [loadJobs])

  const jobsByDate = useMemo(() => {
    const map = {}
    for (const j of jobs) {
      if (!j.scheduled_start) continue
      const key = j.scheduled_start.slice(0, 10)
      if (!map[key]) map[key] = []
      map[key].push(j)
    }
    return map
  }, [jobs])

  const monthLabel = month.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })

  // Build calendar grid
  const grid = useMemo(() => {
    const first = startOfMonth(month)
    const last = endOfMonth(month)
    const startDay = first.getDay() // 0=Sun
    const days = []
    // Fill blanks before
    for (let i = 0; i < startDay; i++) days.push(null)
    for (let d = 1; d <= last.getDate(); d++) {
      days.push(new Date(month.getFullYear(), month.getMonth(), d))
    }
    return days
  }, [month])

  const today = new Date()
  const selectedJobs = jobsByDate[selectedDate] || []

  return (
    <div className="p-4 pb-24 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Calendar</h1>
      </header>

      <div className="card !p-3">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
            className="btn-ghost !min-h-0 !p-2"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="font-semibold text-sm">{monthLabel}</h2>
          <button
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
            className="btn-ghost !min-h-0 !p-2"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 text-center text-[11px] text-slate-400 font-semibold mb-1">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <div key={i} className="py-1">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-px">
          {grid.map((d, i) => {
            if (!d) return <div key={`blank-${i}`} />
            const key = toDateKey(d)
            const hasJobs = Boolean(jobsByDate[key])
            const isToday = isSameDay(d, today)
            const isSelected = key === selectedDate
            return (
              <button
                key={key}
                onClick={() => setSelectedDate(key)}
                className={`relative flex flex-col items-center py-1.5 rounded-lg text-sm transition
                  ${isSelected ? 'bg-brand text-white' : isToday ? 'bg-brand/10 font-bold text-brand' : 'hover:bg-slate-100'}
                `}
              >
                {d.getDate()}
                {hasJobs && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                      isSelected ? 'bg-white' : 'bg-brand'
                    }`}
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>

      <section className="space-y-2">
        <h2 className="text-xs uppercase tracking-wider text-slate-500 font-semibold px-1">
          {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-AU', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
          })}
        </h2>
        {loading ? (
          <p className="text-sm text-slate-500 text-center py-4">Loading…</p>
        ) : selectedJobs.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">No jobs scheduled.</p>
        ) : (
          selectedJobs.map((j) => (
            <Link
              key={j.id}
              to={`/jobs/${j.id}`}
              className="card block hover:bg-slate-50 active:bg-slate-100 !p-3"
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="font-mono text-xs text-slate-500">{j.job_number}</span>
                <JobStatusBadge status={j.status} />
              </div>
              <div className="font-medium truncate">{j.customer_name}</div>
              <div className="text-sm text-slate-500 truncate">{j.job_site_address}</div>
              {j.quotes?.total != null && (
                <div className="text-sm font-semibold text-brand mt-1">
                  {formatAUD(j.quotes.total)}
                </div>
              )}
            </Link>
          ))
        )}
      </section>
    </div>
  )
}
