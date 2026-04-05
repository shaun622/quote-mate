import { useState, useMemo } from 'react'
import { X, Search, Plus } from 'lucide-react'
import { usePricingItems } from '../../hooks/usePricingItems.js'
import { formatAUD } from '../../lib/utils.js'

export default function QuoteItemPicker({ onPick, onCustom, onClose }) {
  const { items, loading } = usePricingItems()
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return items
    return items.filter(
      (i) =>
        i.name.toLowerCase().includes(s) ||
        i.category.toLowerCase().includes(s)
    )
  }, [items, q])

  const recent = useMemo(() => {
    if (q.trim()) return []
    return [...items]
      .sort((a, b) => {
        const ta = a.created_at ? new Date(a.created_at).getTime() : 0
        const tb = b.created_at ? new Date(b.created_at).getTime() : 0
        return tb - ta
      })
      .slice(0, 5)
  }, [items, q])

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] flex flex-col safe-bottom">
        <header className="flex items-center justify-between p-4 border-b border-slate-100">
          <h2 className="text-lg font-bold">Add line item</h2>
          <button onClick={onClose} className="btn-ghost !min-h-0 !p-2">
            <X className="w-5 h-5" />
          </button>
        </header>
        <div className="p-4 border-b border-slate-100 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              autoFocus
              className="input pl-9"
              placeholder="Search your library…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          {recent.length > 0 && (
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-500 mb-1.5">
                Recent
              </div>
              <ul className="rounded-lg border border-slate-200 divide-y divide-slate-100 overflow-hidden">
                {recent.map((i) => (
                  <li key={i.id}>
                    <button
                      onClick={() => onPick(i)}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-slate-50 active:bg-slate-100"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate text-sm">{i.name}</div>
                        <div className="text-xs text-slate-500">
                          {i.category} · {i.unit}
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-brand">
                        {formatAUD(i.default_price)}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <button onClick={onCustom} className="btn-secondary w-full">
            <Plus className="w-4 h-4" />
            Add custom item
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <p className="text-slate-500 text-center py-8">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="text-slate-500 text-center py-8 px-4">
              {items.length === 0
                ? 'Your library is empty. Tap "Add custom item" or add items in Settings.'
                : 'No matches.'}
            </p>
          ) : (
            <>
              {!q.trim() && (
                <div className="text-xs uppercase tracking-wider text-slate-500 px-4 pt-3 pb-1">
                  All items
                </div>
              )}
              <ul className="divide-y divide-slate-100">
                {filtered.map((i) => (
                  <li key={i.id}>
                    <button
                      onClick={() => onPick(i)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 active:bg-slate-100"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{i.name}</div>
                        <div className="text-xs text-slate-500">
                          {i.category} · {i.unit}
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-brand">
                        {formatAUD(i.default_price)}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
