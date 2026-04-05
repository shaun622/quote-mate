const STYLES = {
  scheduled: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-800',
  on_hold: 'bg-slate-100 text-slate-600',
  completed: 'bg-emerald-100 text-emerald-700',
  invoiced: 'bg-indigo-100 text-indigo-700',
  cancelled: 'bg-red-100 text-red-700'
}

const LABELS = {
  scheduled: 'Scheduled',
  in_progress: 'In progress',
  on_hold: 'On hold',
  completed: 'Completed',
  invoiced: 'Invoiced',
  cancelled: 'Cancelled'
}

export default function JobStatusBadge({ status }) {
  const cls = STYLES[status] || 'bg-slate-100 text-slate-600'
  const label = LABELS[status] || status
  return (
    <span
      className={`inline-block text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded ${cls}`}
    >
      {label}
    </span>
  )
}

export { LABELS as JOB_STATUS_LABELS }
