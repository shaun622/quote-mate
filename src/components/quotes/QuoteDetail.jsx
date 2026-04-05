import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Send, Copy, ExternalLink } from 'lucide-react'
import { supabase } from '../../lib/supabase.js'
import { formatAUD, formatDateAEST } from '../../lib/utils.js'
import { sendQuoteEmail } from '../../lib/quotes.js'
import QuoteStatusBadge from './QuoteStatusBadge.jsx'

export default function QuoteDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [quote, setQuote] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [msg, setMsg] = useState({ type: '', text: '' })

  async function load() {
    setLoading(true)
    const [{ data: q }, { data: its }] = await Promise.all([
      supabase.from('quotes').select('*').eq('id', id).maybeSingle(),
      supabase
        .from('quote_items')
        .select('*')
        .eq('quote_id', id)
        .order('sort_order')
    ])
    setQuote(q)
    setItems(its || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [id])

  async function onSend() {
    if (!quote?.customer_email) {
      setMsg({
        type: 'err',
        text: 'Quote has no customer email. Add one to send.'
      })
      return
    }
    setMsg({ type: '', text: '' })
    setSending(true)
    try {
      await sendQuoteEmail(quote.id)
      setMsg({ type: 'ok', text: 'Sent! Customer will receive an email.' })
      await load()
    } catch (e) {
      setMsg({ type: 'err', text: e.message })
    } finally {
      setSending(false)
    }
  }

  function copyLink() {
    const url = `${window.location.origin}/quote/${quote.public_token}`
    navigator.clipboard.writeText(url)
    setMsg({ type: 'ok', text: 'Link copied.' })
    setTimeout(() => setMsg({ type: '', text: '' }), 2000)
  }

  if (loading) return <div className="p-4 text-slate-500">Loading…</div>
  if (!quote)
    return (
      <div className="p-4">
        <p className="text-slate-500">Quote not found.</p>
        <Link to="/quotes" className="btn-secondary mt-4 inline-flex">
          Back to quotes
        </Link>
      </div>
    )

  const publicUrl = `${window.location.origin}/quote/${quote.public_token}`

  return (
    <div className="p-4 pb-24 space-y-4">
      <header className="flex items-center gap-2">
        <button
          onClick={() => navigate('/quotes')}
          className="btn-ghost -ml-2 !min-h-0 !py-2 !px-2"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="font-mono text-xs text-slate-500">{quote.quote_number}</div>
          <h1 className="text-xl font-bold truncate">{quote.customer_name}</h1>
        </div>
        <QuoteStatusBadge status={quote.status} />
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

      <section className="card space-y-1 text-sm">
        <div className="text-slate-600">{quote.customer_phone}</div>
        {quote.customer_email && (
          <div className="text-slate-600">{quote.customer_email}</div>
        )}
        <div className="text-slate-600">{quote.job_site_address}</div>
      </section>

      <section className="card">
        <h2 className="font-semibold mb-2">Items</h2>
        <div className="divide-y divide-slate-100">
          {items.map((it) => (
            <div key={it.id} className="py-2 flex justify-between text-sm">
              <div className="min-w-0 pr-2">
                <div className="truncate">{it.name}</div>
                <div className="text-xs text-slate-500">
                  {it.quantity} {it.unit} × {formatAUD(it.unit_price)}
                </div>
              </div>
              <div className="font-medium whitespace-nowrap">
                {formatAUD(it.line_total)}
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-slate-100 mt-3 pt-3 space-y-1">
          <Row label="Subtotal" value={quote.subtotal} />
          <Row label="GST (10%)" value={quote.gst} />
          <Row label="Total inc GST" value={quote.total} bold />
        </div>
      </section>

      {(quote.scope_of_work || quote.exclusions) && (
        <section className="card space-y-3 text-sm">
          {quote.scope_of_work && (
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">
                Scope of work
              </div>
              <div className="whitespace-pre-wrap">{quote.scope_of_work}</div>
            </div>
          )}
          {quote.exclusions && (
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">
                Exclusions
              </div>
              <div className="whitespace-pre-wrap">{quote.exclusions}</div>
            </div>
          )}
        </section>
      )}

      <section className="card text-sm space-y-2">
        <div className="flex justify-between">
          <span className="text-slate-500">Valid for</span>
          <span>{quote.validity_days} days</span>
        </div>
        {quote.valid_until && (
          <div className="flex justify-between">
            <span className="text-slate-500">Expires</span>
            <span>{formatDateAEST(quote.valid_until, { dateStyle: 'medium' })}</span>
          </div>
        )}
        {quote.sent_at && (
          <div className="flex justify-between">
            <span className="text-slate-500">Sent</span>
            <span>{formatDateAEST(quote.sent_at, { dateStyle: 'medium' })}</span>
          </div>
        )}
        {quote.viewed_at && (
          <div className="flex justify-between">
            <span className="text-slate-500">Viewed</span>
            <span>{formatDateAEST(quote.viewed_at, { dateStyle: 'medium' })}</span>
          </div>
        )}
      </section>

      <section className="card space-y-2">
        <div className="text-xs text-slate-500">Customer link</div>
        <div className="flex gap-2">
          <input
            readOnly
            className="input text-xs !py-2 !min-h-0 flex-1"
            value={publicUrl}
          />
          <button onClick={copyLink} className="btn-secondary !px-3">
            <Copy className="w-4 h-4" />
          </button>
          <a
            href={publicUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary !px-3"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* Action footer */}
      <div className="fixed bottom-20 inset-x-0 bg-white border-t border-slate-200 p-3 safe-bottom">
        <div className="max-w-lg mx-auto">
          <button
            onClick={onSend}
            disabled={sending || !quote.customer_email}
            className="btn-primary w-full"
          >
            <Send className="w-4 h-4" />
            {sending
              ? 'Sending…'
              : quote.status === 'draft'
              ? 'Send to customer'
              : 'Resend email'}
          </button>
          {!quote.customer_email && (
            <p className="text-xs text-slate-500 text-center mt-2">
              Add a customer email to send by email
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, bold }) {
  return (
    <div
      className={`flex justify-between text-sm ${
        bold ? 'font-bold text-brand pt-1 mt-1 border-t border-slate-100' : 'text-slate-600'
      }`}
    >
      <span>{label}</span>
      <span>{formatAUD(value)}</span>
    </div>
  )
}
