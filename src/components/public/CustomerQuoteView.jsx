import { useEffect, useState, useMemo } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { Check, X } from 'lucide-react'
import { formatAUD, formatDateAEST } from '../../lib/utils.js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
const API_HEADERS = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json'
}

export default function CustomerQuoteView() {
  const { token } = useParams()
  const [searchParams] = useSearchParams()
  const isPrint = searchParams.get('print') === '1'
  const [state, setState] = useState({ loading: true, data: null, error: '' })
  const [busy, setBusy] = useState(false)
  const [declining, setDeclining] = useState(false)
  const [reason, setReason] = useState('')
  const [resultMsg, setResultMsg] = useState('')

  async function loadQuote() {
    setState({ loading: true, data: null, error: '' })
    try {
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/view-quote?token=${encodeURIComponent(token)}`,
        { headers: API_HEADERS }
      )
      const json = await res.json()
      if (!res.ok) {
        setState({ loading: false, data: null, error: json.error || 'Error' })
        return
      }
      setState({ loading: false, data: json, error: '' })
    } catch (e) {
      setState({ loading: false, data: null, error: e.message })
    }
  }

  useEffect(() => {
    loadQuote()
  }, [token])

  // Auto-print when opened with ?print=1
  useEffect(() => {
    if (isPrint && state.data && !state.loading) {
      const timer = setTimeout(() => window.print(), 500)
      return () => clearTimeout(timer)
    }
  }, [isPrint, state.data, state.loading])

  async function respond(action) {
    setBusy(true)
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/respond-to-quote`, {
        method: 'POST',
        headers: API_HEADERS,
        body: JSON.stringify({
          token,
          response: action,
          reason: action === 'decline' ? reason : undefined
        })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed')
      setResultMsg(
        action === 'accept'
          ? 'Thanks! Quote accepted. The tradesperson will be in touch.'
          : 'Quote declined. Thanks for letting us know.'
      )
      setDeclining(false)
      await loadQuote()
    } catch (e) {
      setResultMsg(e.message)
    } finally {
      setBusy(false)
    }
  }

  if (state.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Loading quote…
      </div>
    )
  }
  if (state.error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-bold text-slate-900">Couldn't load quote</h1>
          <p className="text-slate-600 mt-2">{state.error}</p>
        </div>
      </div>
    )
  }

  const { quote, items, business } = state.data
  const brand = business?.brand_color || '#1E3A5F'
  const canRespond = quote.status === 'sent' || quote.status === 'viewed'

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Branded header */}
      <header style={{ background: brand }} className="text-white p-6 safe-top">
        <div className="max-w-2xl mx-auto">
          {business?.logo_url ? (
            <img
              src={business.logo_url}
              alt={business.name}
              className="h-12 mb-2 object-contain"
            />
          ) : (
            <div className="text-2xl font-bold">{business?.name}</div>
          )}
          <div className="text-sm opacity-90">Quote {quote.quote_number}</div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-4 -mt-4">
        {/* Customer + site */}
        <section className="card">
          <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">
            For
          </div>
          <div className="font-semibold">{quote.customer_name}</div>
          <div className="text-sm text-slate-600">{quote.job_site_address}</div>
          <div className="text-xs text-slate-400 mt-2">
            Issued {formatDateAEST(quote.created_at)}
            {quote.valid_until && (
              <> · Valid until {formatDateAEST(quote.valid_until, { dateStyle: 'medium' })}</>
            )}
          </div>
        </section>

        {/* Items */}
        <section className="card">
          <h2 className="font-semibold mb-2">Itemised breakdown</h2>
          <ItemsByCategory items={items} />
          <div className="border-t border-slate-200 mt-3 pt-3 space-y-1">
            <Row label="Subtotal (ex GST)" value={quote.subtotal} />
            <Row label="GST (10%)" value={quote.gst} />
            <Row label="Total inc GST" value={quote.total} bold brand={brand} />
          </div>
        </section>

        {quote.scope_of_work && (
          <section className="card">
            <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">
              Scope of work
            </div>
            <p className="text-sm whitespace-pre-wrap">{quote.scope_of_work}</p>
          </section>
        )}
        {quote.exclusions && (
          <section className="card">
            <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">
              Exclusions
            </div>
            <p className="text-sm whitespace-pre-wrap">{quote.exclusions}</p>
          </section>
        )}

        <section className="card space-y-2 text-sm">
          {quote.estimated_start && (
            <div className="flex justify-between">
              <span className="text-slate-500">Estimated start</span>
              <span>{formatDateAEST(quote.estimated_start, { dateStyle: 'medium' })}</span>
            </div>
          )}
          {quote.estimated_duration && (
            <div className="flex justify-between">
              <span className="text-slate-500">Duration</span>
              <span>{quote.estimated_duration}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-slate-500">Payment terms</span>
            <span className="text-right">{quote.payment_terms}</span>
          </div>
          {quote.notes && (
            <div>
              <div className="text-slate-500 mb-1">Notes</div>
              <div className="whitespace-pre-wrap">{quote.notes}</div>
            </div>
          )}
        </section>

        {/* Status + actions */}
        {resultMsg && (
          <div className="card bg-emerald-50 border-emerald-200 text-emerald-900 text-sm">
            {resultMsg}
          </div>
        )}

        {canRespond && !resultMsg && !isPrint && (
          <section className="card">
            {declining ? (
              <div className="space-y-3">
                <label className="label">Reason (optional)</label>
                <textarea
                  rows={2}
                  className="input"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Let them know why (optional)"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => respond('decline')}
                    disabled={busy}
                    className="btn-primary flex-1 !bg-red-600 hover:!bg-red-700"
                  >
                    Confirm decline
                  </button>
                  <button
                    onClick={() => setDeclining(false)}
                    className="btn-secondary"
                  >
                    Back
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={() => respond('accept')}
                  disabled={busy}
                  style={{ background: brand }}
                  className="btn w-full text-white font-semibold"
                >
                  <Check className="w-5 h-5" />
                  {busy ? 'Submitting…' : 'Accept quote'}
                </button>
                <button
                  onClick={() => setDeclining(true)}
                  disabled={busy}
                  className="btn-secondary w-full text-slate-600"
                >
                  <X className="w-4 h-4" />
                  Decline
                </button>
              </div>
            )}
          </section>
        )}

        {!canRespond && !resultMsg && !isPrint && (
          <section className="card text-center text-sm text-slate-600">
            {quote.status === 'accepted' && 'This quote has been accepted.'}
            {quote.status === 'declined' && 'This quote has been declined.'}
            {quote.status === 'expired' && 'This quote has expired.'}
          </section>
        )}

        <footer className="text-xs text-slate-500 text-center pt-4 pb-8">
          Questions? Contact {business?.name}
          <br />
          {business?.phone} · {business?.email}
          {business?.abn && (
            <>
              <br />
              ABN {business.abn}
            </>
          )}
        </footer>
      </main>
    </div>
  )
}

function ItemsByCategory({ items }) {
  const grouped = useMemo(() => {
    const map = {}
    for (const i of items) {
      if (!map[i.category]) map[i.category] = []
      map[i.category].push(i)
    }
    return Object.entries(map)
  }, [items])

  return (
    <div className="space-y-3">
      {grouped.map(([cat, list]) => (
        <div key={cat}>
          <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">
            {cat}
          </div>
          <div className="divide-y divide-slate-100">
            {list.map((i) => (
              <div key={i.id} className="py-2 flex justify-between text-sm">
                <div className="min-w-0 pr-2">
                  <div className="truncate">{i.name}</div>
                  <div className="text-xs text-slate-500">
                    {i.quantity} {i.unit} × {formatAUD(i.unit_price)}
                  </div>
                </div>
                <div className="font-medium whitespace-nowrap">
                  {formatAUD(i.line_total)}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function Row({ label, value, bold, brand }) {
  return (
    <div
      className={`flex justify-between text-sm ${
        bold
          ? 'font-bold text-base pt-2 mt-1 border-t border-slate-100'
          : 'text-slate-600'
      }`}
      style={bold && brand ? { color: brand } : undefined}
    >
      <span>{label}</span>
      <span>{formatAUD(value)}</span>
    </div>
  )
}
