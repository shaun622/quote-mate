const STYLES = {
  draft: 'bg-slate-100 text-slate-600',
  sent: 'bg-blue-100 text-blue-700',
  viewed: 'bg-indigo-100 text-indigo-700',
  accepted: 'bg-emerald-100 text-emerald-700',
  declined: 'bg-red-100 text-red-700',
  expired: 'bg-amber-100 text-amber-700'
}

export default function QuoteStatusBadge({ status }) {
  const cls = STYLES[status] || 'bg-slate-100 text-slate-600'
  return (
    <span
      className={`inline-block text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded ${cls}`}
    >
      {status}
    </span>
  )
}
