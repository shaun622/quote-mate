import { Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useQuotes } from '../../hooks/useQuotes.js'
import { formatAUD, formatDateAEST } from '../../lib/utils.js'
import QuoteStatusBadge from './QuoteStatusBadge.jsx'

export default function QuoteList() {
  const { quotes, loading } = useQuotes()

  return (
    <div className="p-4 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Quotes</h1>
      </header>

      {loading ? (
        <p className="text-slate-500 text-center py-8">Loading…</p>
      ) : quotes.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-slate-500 mb-4">No quotes yet.</p>
          <Link to="/quotes/new" className="btn-primary inline-flex">
            <Plus className="w-4 h-4" />
            Create quote
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {quotes.map((q) => (
            <Link
              key={q.id}
              to={`/quotes/${q.id}`}
              className="card block hover:bg-slate-50 active:bg-slate-100 !p-3"
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="font-mono text-xs text-slate-500">
                  {q.quote_number}
                </div>
                <QuoteStatusBadge status={q.status} />
              </div>
              <div className="font-medium truncate">{q.customer_name}</div>
              <div className="text-sm text-slate-500 truncate">
                {q.job_site_address}
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="text-xs text-slate-400">
                  {formatDateAEST(q.created_at)}
                </div>
                <div className="text-sm font-semibold text-brand">
                  {formatAUD(q.total)}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Link
        to="/quotes/new"
        className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-brand text-white shadow-lg flex items-center justify-center active:scale-95 z-10"
        aria-label="Create quote"
      >
        <Plus className="w-6 h-6" />
      </Link>
    </div>
  )
}
