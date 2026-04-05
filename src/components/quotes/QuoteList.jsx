import { Plus } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function QuoteList() {
  return (
    <div className="p-4 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Quotes</h1>
      </header>

      <div className="card text-center py-12">
        <p className="text-slate-500 mb-4">No quotes yet.</p>
        <Link to="/quotes/new" className="btn-primary inline-flex">
          <Plus className="w-4 h-4" />
          Create quote
        </Link>
      </div>

      <Link
        to="/quotes/new"
        className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-brand text-white shadow-lg flex items-center justify-center active:scale-95"
        aria-label="Create quote"
      >
        <Plus className="w-6 h-6" />
      </Link>
    </div>
  )
}
