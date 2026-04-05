import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Plus, Search } from 'lucide-react'
import { usePricingItems } from '../../hooks/usePricingItems.js'
import { formatAUD } from '../../lib/utils.js'
import PricingItemForm from './PricingItemForm.jsx'

export default function PricingList() {
  const { items, loading, create, update, archive } = usePricingItems()
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null) // null = closed, {} = new, {...item} = edit
  const [confirmArchive, setConfirmArchive] = useState(false)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return items
    return items.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q)
    )
  }, [items, search])

  const grouped = useMemo(() => {
    const map = {}
    for (const i of filtered) {
      if (!map[i.category]) map[i.category] = []
      map[i.category].push(i)
    }
    return Object.entries(map)
  }, [filtered])

  async function onSave(data) {
    if (editing?.id) {
      const r = await update(editing.id, data)
      if (!r.error) setEditing(null)
      return r
    }
    const r = await create(data)
    if (!r.error) setEditing(null)
    return r
  }

  async function onArchive() {
    if (!editing?.id) return
    if (!confirmArchive) {
      setConfirmArchive(true)
      setTimeout(() => setConfirmArchive(false), 3000)
      return
    }
    await archive(editing.id)
    setEditing(null)
    setConfirmArchive(false)
  }

  return (
    <div className="p-4 space-y-4">
      <header className="flex items-center gap-2">
        <Link to="/settings" className="btn-ghost -ml-2 !min-h-0 !py-2 !px-2">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold flex-1">Pricing library</h1>
        <button
          onClick={() => setEditing({})}
          className="btn-primary !min-h-0 !py-2 !px-3"
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      </header>

      {items.length > 0 && (
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="Search items…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}

      {loading ? (
        <p className="text-slate-500 text-center py-8">Loading…</p>
      ) : items.length === 0 ? (
        <div className="card text-center py-10">
          <p className="text-slate-500 mb-4">
            No pricing items yet. Build your library — they'll be reusable on every quote.
          </p>
          <button onClick={() => setEditing({})} className="btn-primary inline-flex">
            <Plus className="w-4 h-4" />
            Add your first item
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-slate-500 text-center py-8">No matches.</p>
      ) : (
        <div className="space-y-4">
          {grouped.map(([cat, list]) => (
            <section key={cat}>
              <h2 className="text-xs uppercase tracking-wider text-slate-500 font-semibold px-1 mb-2">
                {cat}
              </h2>
              <div className="card p-0 divide-y divide-slate-100">
                {list.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setConfirmArchive(false)
                      setEditing(item)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 active:bg-slate-100"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{item.name}</div>
                      <div className="text-xs text-slate-500">{item.unit}</div>
                    </div>
                    <div className="text-sm font-semibold text-brand">
                      {formatAUD(item.default_price)}
                    </div>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {editing !== null && (
        <PricingItemForm
          item={editing}
          onSave={onSave}
          onCancel={() => {
            setEditing(null)
            setConfirmArchive(false)
          }}
          onArchive={editing.id ? onArchive : undefined}
        />
      )}
      {confirmArchive && (
        <div className="fixed bottom-24 inset-x-0 flex justify-center z-50 pointer-events-none">
          <div className="bg-slate-900 text-white text-sm rounded-lg px-4 py-2 shadow-lg">
            Tap Archive again to confirm
          </div>
        </div>
      )}
    </div>
  )
}
