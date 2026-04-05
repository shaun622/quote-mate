import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Briefcase } from 'lucide-react'
import { useJobs, ACTIVE_STATUSES } from '../../hooks/useJobs.js'
import { formatAUD, formatDateAEST } from '../../lib/utils.js'
import JobStatusBadge, { JOB_STATUS_LABELS } from './JobStatusBadge.jsx'

const GROUP_ORDER = [
  { key: 'active', label: 'Active', statuses: ACTIVE_STATUSES },
  { key: 'completed', label: 'Completed', statuses: ['completed', 'invoiced'] },
  { key: 'cancelled', label: 'Cancelled', statuses: ['cancelled'] }
]

export default function JobList() {
  const { jobs, loading } = useJobs()

  const grouped = useMemo(() => {
    const map = { active: [], completed: [], cancelled: [] }
    for (const j of jobs) {
      if (ACTIVE_STATUSES.includes(j.status)) map.active.push(j)
      else if (j.status === 'cancelled') map.cancelled.push(j)
      else map.completed.push(j)
    }
    return map
  }, [jobs])

  return (
    <div className="p-4 pb-24 space-y-4">
      <header>
        <h1 className="text-xl font-bold">Jobs</h1>
      </header>

      {loading ? (
        <p className="text-slate-500 text-center py-8">Loading…</p>
      ) : jobs.length === 0 ? (
        <div className="card text-center py-12">
          <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No jobs yet.</p>
          <p className="text-xs text-slate-400 mt-1">
            Accepted quotes turn into jobs automatically.
          </p>
        </div>
      ) : (
        GROUP_ORDER.map((g) => {
          const list = grouped[g.key]
          if (!list || list.length === 0) return null
          return (
            <section key={g.key} className="space-y-2">
              <h2 className="text-xs uppercase tracking-wider text-slate-500 font-semibold px-1">
                {g.label} ({list.length})
              </h2>
              <div className="space-y-2">
                {list.map((j) => (
                  <JobCard key={j.id} job={j} />
                ))}
              </div>
            </section>
          )
        })
      )}
    </div>
  )
}

function JobCard({ job }) {
  const total = job.quotes?.total ?? null
  return (
    <Link
      to={`/jobs/${job.id}`}
      className="card block hover:bg-slate-50 active:bg-slate-100 !p-3"
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="font-mono text-xs text-slate-500">{job.job_number}</div>
        <JobStatusBadge status={job.status} />
      </div>
      <div className="font-medium truncate">{job.customer_name}</div>
      <div className="text-sm text-slate-500 truncate">{job.job_site_address}</div>
      <div className="flex items-center justify-between mt-2">
        <div className="text-xs text-slate-400">
          {job.scheduled_start
            ? `Start ${formatDateAEST(job.scheduled_start, { dateStyle: 'medium' })}`
            : JOB_STATUS_LABELS[job.status]}
        </div>
        {total != null && (
          <div className="text-sm font-semibold text-brand">{formatAUD(total)}</div>
        )}
      </div>
    </Link>
  )
}
