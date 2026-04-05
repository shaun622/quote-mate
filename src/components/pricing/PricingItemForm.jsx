import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

const CATEGORIES = ['Materials', 'Labour', 'Equipment Hire', 'Disposal', 'Other']
const UNITS = ['per metre', 'per unit', 'per hour', 'per sqm', 'per day', 'fixed']

export default function PricingItemForm({ item, onSave, onCancel, onArchive }) {
  const isEdit = Boolean(item?.id)
  const [form, setForm] = useState({
    name: '',
    category: 'Materials',
    unit: 'per unit',
    default_price: '',
    description: ''
  })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (item) {
      setForm({
        name: item.name || '',
        category: item.category || 'Materials',
        unit: item.unit || 'per unit',
        default_price: item.default_price ?? '',
        description: item.description || ''
      })
    }
  }, [item])

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    setErr('')
    const price = Number(form.default_price)
    if (Number.isNaN(price) || price < 0) {
      setErr('Enter a valid price')
      return
    }
    setBusy(true)
    const { error } = await onSave({
      name: form.name.trim(),
      category: form.category,
      unit: form.unit,
      default_price: price,
      description: form.description.trim() || null
    })
    setBusy(false)
    if (error) setErr(error.message)
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl p-4 max-h-[90vh] overflow-y-auto safe-bottom">
        <header className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">{isEdit ? 'Edit item' : 'New pricing item'}</h2>
          <button onClick={onCancel} className="btn-ghost !min-h-0 !p-2">
            <X className="w-5 h-5" />
          </button>
        </header>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="label">Name *</label>
            <input
              required
              autoFocus
              className="input"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Colorbond panel"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Category *</label>
              <select
                className="input"
                value={form.category}
                onChange={(e) => set('category', e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Unit *</label>
              <select
                className="input"
                value={form.unit}
                onChange={(e) => set('unit', e.target.value)}
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Default price (AUD, ex GST) *</label>
            <input
              required
              inputMode="decimal"
              className="input"
              value={form.default_price}
              onChange={(e) => set('default_price', e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              rows={2}
              className="input"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Optional — shown on quote"
            />
          </div>
          {err && <p className="text-sm text-red-600">{err}</p>}
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={busy} className="btn-primary flex-1">
              {busy ? 'Saving…' : isEdit ? 'Save' : 'Add item'}
            </button>
            {isEdit && onArchive && (
              <button
                type="button"
                onClick={onArchive}
                className="btn-secondary text-red-600"
              >
                Archive
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
