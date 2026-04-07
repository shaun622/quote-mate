import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Play, Pause, CheckCircle2, XCircle, FileText, Phone, Mail, MapPin } from 'lucide-react'
import JobPhotos from './JobPhotos.jsx'
import { supabase } from '../../lib/supabase.js'
import { formatDateAEST, formatAUD } from '../../lib/utils.js'
import { updateJobStatus } from '../../hooks/useJobs.js'
import JobStatusBadge, { JOB_STATUS_LABELS } from './JobStatusBadge.jsx'

export default function JobDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [job, setJob] = useState(null)
  const [quote, setQuote] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState({ type: '', text: '' })
  const [transition, setTransition] = useState(null) // {status, label}
  const [note, setNote] = useState('')
  const [notify, setNotify] = useState(true)

  async function load() {
    setLoading(true)
    const { data: j } = await supabase
      .from('jobs')
      .select('*, quotes(quote_number, total, public_token)')
      .eq('id', id)
      .maybeSingle()
    setJob(j)
    setQuote(j?.quotes || null)
    if (j) {
      const { data: h } = await supabase
        .from('job_status_history')
        .select('*')
        .eq('job_id', id)
        .order('changed_at', { ascending: false })
      setHistory(h || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [id])

  function openTransition(status, label) {
    setTransition({ status, label })
    setNote('')
    setNotify(Boolean(job?.customer_email))
    setMsg({ type: '', text: '' })
  }

  async function confirmTransition() {
    if (!transition) return
    setBusy(true)
    setMsg({ type: '', text: '' })
    try {
      const result = await updateJobStatus({
        jobId: id,
        newStatus: transition.status,
        note: note.trim() || undefined,
        notify
      })
      if (result?.email_error) {
        setMsg({
          type: 'ok',
          text: `Status updated. Email failed: ${result.email_error}`
        })
      } else {
        setMsg({
          type: 'ok',
          text: notify && job.customer_email
            ? 'Status updated and customer notified.'
            : 'Status updated.'
        })
      }
      setTransition(null)
      await load()
    } catch (e) {
      setMsg({ type: 'err', text: e.message })
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <div className="p-4 text-slate-500">Loading…</div>
  if (!job)
    return (
      <div className="p-4">
        <p className="text-slate-500">Job not found.</p>
        <Link to="/jobs" className="btn-secondary mt-4 inline-flex">
          Back to jobs
        </Link>
      </div>
    )

  const transitions = availableTransitions(job.status)

  return (
    <div className="p-4 pb-24 space-y-4">
      <header className="flex items-center gap-2">
        <button
          onClick={() => navigate('/jobs')}
          className="btn-ghost -ml-2 !min-h-0 !py-2 !px-2"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="font-mono text-xs text-slate-500">{job.job_number}</div>
          <h1 className="text-xl font-bold truncate">{job.customer_name}</h1>
        </div>
        <JobStatusBadge status={job.status} />
      </header>

      {msg.text && (
        <div
          className={`text-sm rounded-lg px-3 py-2 ${
            msg.type === 'ok'
              ? 'bg-emerald-50 text-emerald-800'
              : 'bg-red-50 text-red-700'
          }`}
        >
          {msg.text}
        </div>
      )}

      <section className="card space-y-2 text-sm">
        {job.customer_phone && (
          <a href={`tel:${job.customer_phone}`} className="flex items-center gap-2 text-slate-700">
            <Phone className="w-4 h-4 text-slate-400" />
            {job.customer_phone}
          </a>
        )}
        {job.customer_email && (
          <a href={`mailto:${job.customer_email}`} className="flex items-center gap-2 text-slate-700 break-all">
            <Mail className="w-4 h-4 text-slate-400 shrink-0" />
            {job.customer_email}
          </a>
        )}
        <div className="flex items-start gap-2 text-slate-700">
          <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
          <span>{job.job_site_address}</span>
        </div>
      </section>

      <section className="card text-sm space-y-2">
        {job.scheduled_start && (
          <Row label="Scheduled start" value={formatDateAEST(job.scheduled_start, { dateStyle: 'medium' })} />
        )}
        {job.started_at && (
          <Row label="Started" value={formatDateAEST(job.started_at, { dateStyle: 'medium' })} />
        )}
        {job.completed_at && (
          <Row label="Completed" value={formatDateAEST(job.completed_at, { dateStyle: 'medium' })} />
        )}
        {quote && (
          <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between">
            <Link
              to={`/quotes/${job.quote_id}`}
              className="text-sm text-brand font-medium inline-flex items-center gap-1.5"
            >
              <FileText className="w-4 h-4" />
              {quote.quote_number}
            </Link>
            {quote.total != null && (
              <span className="text-sm font-semibold text-brand">
                {formatAUD(quote.total)}
              </span>
            )}
          </div>
        )}
      </section>

      {transitions.length > 0 && (
        <section className="card space-y-2">
          <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">
            Update status
          </div>
          <div className="grid grid-cols-1 gap-2">
            {transitions.map((t) => (
              <button
                key={t.status}
                onClick={() => openTransition(t.status, t.label)}
                className={`${t.variant} w-full justify-start`}
              >
                <t.icon className="w-4 h-4" />
                {t.label}
              </button>
            ))}
          </div>
        </section>
      )}

      <JobPhotos jobId={id} />

      <section className="card">
        <h2 className="font-semibold mb-2">History</h2>
        {history.length === 0 ? (
          <p className="text-sm text-slate-500">No history yet.</p>
        ) : (
          <ol className="space-y-3">
            {history.map((h) => (
              <li key={h.id} className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-brand mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm">
                    <span className="font-medium">
                      {JOB_STATUS_LABELS[h.new_status] || h.new_status}
                    </span>
                    {h.old_status && (
                      <span className="text-slate-400 text-xs ml-1.5">
                        from {JOB_STATUS_LABELS[h.old_status] || h.old_status}
                      </span>
                    )}
                  </div>
                  {h.note && (
                    <div className="text-xs text-slate-600 mt-0.5 whitespace-pre-wrap">
                      {h.note}
                    </div>
                  )}
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {formatDateAEST(h.changed_at, { dateStyle: 'medium', timeStyle: 'short' })}
                    {h.notification_sent && <> · email sent</>}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      {transition && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl p-4 space-y-4 safe-bottom">
            <h2 className="text-lg font-bold">{transition.label}</h2>
            <div>
              <label className="label">Note (optional)</label>
              <textarea
                rows={3}
                className="input"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add context for the customer or your records"
              />
            </div>
            {job.customer_email ? (
              <label className="flex items-center gap-2 text-sm text-slate-700 select-none">
                <input
                  type="checkbox"
                  checked={notify}
                  onChange={(e) => setNotify(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
                />
                Email the customer about this update
              </label>
            ) : (
              <p className="text-xs text-slate-500">
                No customer email on file — no notification will be sent.
              </p>
            )}
            <div className="flex gap-2">
              <button
                onClick={confirmTransition}
                disabled={busy}
                className="btn-primary flex-1"
              >
                {busy ? 'Updating…' : 'Confirm'}
              </button>
              <button
                onClick={() => setTransition(null)}
                disabled={busy}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function availableTransitions(status) {
  switch (status) {
    case 'scheduled':
      return [
        { status: 'in_progress', label: 'Start job', icon: Play, variant: 'btn-primary' },
        { status: 'on_hold', label: 'Put on hold', icon: Pause, variant: 'btn-secondary' },
        { status: 'cancelled', label: 'Cancel job', icon: XCircle, variant: 'btn-secondary !text-red-600' }
      ]
    case 'in_progress':
      return [
        { status: 'completed', label: 'Mark complete', icon: CheckCircle2, variant: 'btn-primary' },
        { status: 'on_hold', label: 'Pause job', icon: Pause, variant: 'btn-secondary' },
        { status: 'cancelled', label: 'Cancel job', icon: XCircle, variant: 'btn-secondary !text-red-600' }
      ]
    case 'on_hold':
      return [
        { status: 'in_progress', label: 'Resume job', icon: Play, variant: 'btn-primary' },
        { status: 'scheduled', label: 'Back to scheduled', icon: Play, variant: 'btn-secondary' },
        { status: 'cancelled', label: 'Cancel job', icon: XCircle, variant: 'btn-secondary !text-red-600' }
      ]
    case 'completed':
      return [
        { status: 'invoiced', label: 'Mark invoiced', icon: CheckCircle2, variant: 'btn-secondary' }
      ]
    default:
      return []
  }
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span>{value}</span>
    </div>
  )
}
