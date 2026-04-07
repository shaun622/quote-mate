import { useState, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Plus } from 'lucide-react'
import { useBusiness } from '../../hooks/useBusiness.jsx'
import { createQuote } from '../../hooks/useQuotes.js'
import { calcTotals, formatAUD } from '../../lib/utils.js'
import { supabase } from '../../lib/supabase.js'
import QuoteItemPicker from './QuoteItemPicker.jsx'
import QuoteItemRow from './QuoteItemRow.jsx'

const STEPS = ['Customer', 'Items', 'Details', 'Review']

export default function QuoteCreate() {
  const { business } = useBusiness()
  const navigate = useNavigate()
  const location = useLocation()
  const dup = location.state?.duplicate

  const [step, setStep] = useState(0)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [customOpen, setCustomOpen] = useState(false)

  const [customer, setCustomer] = useState({
    customer_name: dup?.customer_name || '',
    customer_phone: dup?.customer_phone || '',
    customer_email: dup?.customer_email || '',
    job_site_address: dup?.job_site_address || ''
  })
  const [items, setItems] = useState(() => {
    if (!dup?.items) return []
    return dup.items.map((it) => ({
      pricing_item_id: it.pricing_item_id || null,
      name: it.name,
      description: it.description || '',
      category: it.category,
      unit: it.unit,
      quantity: it.quantity ?? 1,
      unit_price: it.unit_price ?? 0
    }))
  })
  const [details, setDetails] = useState({
    scope_of_work: dup?.scope_of_work || '',
    exclusions: dup?.exclusions || '',
    validity_days: dup?.validity_days ?? 30,
    estimated_start: '',
    estimated_duration: dup?.estimated_duration || '',
    notes: dup?.notes || '',
    payment_terms: dup?.payment_terms || '50% deposit, 50% on completion'
  })

  const totals = useMemo(() => calcTotals(items), [items])

  function canAdvance() {
    if (step === 0) {
      return (
        customer.customer_name.trim() &&
        customer.customer_phone.trim() &&
        customer.job_site_address.trim()
      )
    }
    if (step === 1) return items.length > 0
    return true
  }

  function addItem(it) {
    setItems((cur) => [
      ...cur,
      {
        pricing_item_id: it.id || null,
        name: it.name,
        description: it.description || '',
        category: it.category,
        unit: it.unit,
        quantity: 1,
        unit_price: it.default_price ?? 0
      }
    ])
    setPickerOpen(false)
    setCustomOpen(false)
  }

  async function addCustomItem(it, saveToLibrary) {
    let pricingId = null
    if (saveToLibrary && business?.id) {
      const { data } = await supabase
        .from('pricing_items')
        .insert({
          business_id: business.id,
          name: it.name,
          category: it.category,
          unit: it.unit,
          default_price: it.default_price ?? 0,
          description: it.description || null,
          is_active: true
        })
        .select()
        .single()
      if (data) pricingId = data.id
    }
    setItems((cur) => [
      ...cur,
      {
        pricing_item_id: pricingId,
        name: it.name,
        description: it.description || '',
        category: it.category,
        unit: it.unit,
        quantity: 1,
        unit_price: it.default_price ?? 0
      }
    ])
    setCustomOpen(false)
  }

  function updateItem(idx, newItem) {
    setItems((cur) => cur.map((x, i) => (i === idx ? newItem : x)))
  }
  function removeItem(idx) {
    setItems((cur) => cur.filter((_, i) => i !== idx))
  }

  async function onSave() {
    setErr('')
    setBusy(true)
    try {
      const quote = await createQuote({
        businessId: business.id,
        quote: { ...customer, ...details },
        items
      })
      navigate(`/quotes/${quote.id}`, { replace: true })
    } catch (e) {
      setErr(e.message || 'Failed to save quote')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="p-4 pb-32 space-y-4">
      <header className="flex items-center gap-2">
        <button
          onClick={() => (step === 0 ? navigate(-1) : setStep(step - 1))}
          className="btn-ghost -ml-2 !min-h-0 !py-2 !px-2"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold flex-1">New quote</h1>
      </header>

      {/* Step indicator */}
      <div className="flex gap-1.5">
        {STEPS.map((s, i) => (
          <div
            key={s}
            className={`flex-1 h-1 rounded-full ${
              i <= step ? 'bg-brand' : 'bg-slate-200'
            }`}
          />
        ))}
      </div>
      <div className="text-xs text-slate-500 text-center">
        Step {step + 1} of {STEPS.length}: {STEPS[step]}
      </div>

      {step === 0 && (
        <section className="card space-y-4">
          <div>
            <label className="label">Customer name *</label>
            <input
              className="input"
              value={customer.customer_name}
              onChange={(e) =>
                setCustomer({ ...customer, customer_name: e.target.value })
              }
            />
          </div>
          <div>
            <label className="label">Phone *</label>
            <input
              type="tel"
              className="input"
              value={customer.customer_phone}
              onChange={(e) =>
                setCustomer({ ...customer, customer_phone: e.target.value })
              }
              placeholder="0400 000 000"
            />
          </div>
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              className="input"
              value={customer.customer_email}
              onChange={(e) =>
                setCustomer({ ...customer, customer_email: e.target.value })
              }
              placeholder="Required to send by email"
            />
          </div>
          <div>
            <label className="label">Job site address *</label>
            <input
              className="input"
              value={customer.job_site_address}
              onChange={(e) =>
                setCustomer({ ...customer, job_site_address: e.target.value })
              }
            />
          </div>
        </section>
      )}

      {step === 1 && (
        <section className="space-y-3">
          {items.length === 0 && (
            <div className="card text-center py-8">
              <p className="text-slate-500 mb-4">No items yet.</p>
              <button
                onClick={() => setPickerOpen(true)}
                className="btn-primary inline-flex"
              >
                <Plus className="w-4 h-4" />
                Add item
              </button>
            </div>
          )}
          {items.map((it, i) => (
            <QuoteItemRow
              key={i}
              item={it}
              onChange={(next) => updateItem(i, next)}
              onRemove={() => removeItem(i)}
            />
          ))}
          {items.length > 0 && (
            <button
              onClick={() => setPickerOpen(true)}
              className="btn-secondary w-full"
            >
              <Plus className="w-4 h-4" />
              Add another item
            </button>
          )}
          {items.length > 0 && (
            <div className="card !p-3">
              <TotalsRow label="Subtotal (ex GST)" value={totals.subtotal} />
              <TotalsRow label="GST (10%)" value={totals.gst} />
              <TotalsRow label="Total (inc GST)" value={totals.total} bold />
            </div>
          )}
        </section>
      )}

      {step === 2 && (
        <section className="card space-y-4">
          <div>
            <label className="label">Scope of work</label>
            <textarea
              rows={4}
              className="input"
              value={details.scope_of_work}
              onChange={(e) =>
                setDetails({ ...details, scope_of_work: e.target.value })
              }
              placeholder="What's included"
            />
          </div>
          <div>
            <label className="label">Exclusions</label>
            <textarea
              rows={2}
              className="input"
              value={details.exclusions}
              onChange={(e) =>
                setDetails({ ...details, exclusions: e.target.value })
              }
              placeholder="What's NOT included"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Valid for (days)</label>
              <input
                type="number"
                min={1}
                className="input"
                value={details.validity_days}
                onChange={(e) =>
                  setDetails({
                    ...details,
                    validity_days: parseInt(e.target.value || '30', 10)
                  })
                }
              />
            </div>
            <div>
              <label className="label">Est. start date</label>
              <input
                type="date"
                className="input"
                value={details.estimated_start}
                onChange={(e) =>
                  setDetails({ ...details, estimated_start: e.target.value })
                }
              />
            </div>
          </div>
          <div>
            <label className="label">Est. duration</label>
            <input
              className="input"
              value={details.estimated_duration}
              onChange={(e) =>
                setDetails({ ...details, estimated_duration: e.target.value })
              }
              placeholder="e.g. 2–3 days"
            />
          </div>
          <div>
            <label className="label">Payment terms</label>
            <input
              className="input"
              value={details.payment_terms}
              onChange={(e) =>
                setDetails({ ...details, payment_terms: e.target.value })
              }
            />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea
              rows={2}
              className="input"
              value={details.notes}
              onChange={(e) =>
                setDetails({ ...details, notes: e.target.value })
              }
            />
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="space-y-4">
          <div className="card">
            <h3 className="font-semibold mb-2">Customer</h3>
            <p className="text-sm">{customer.customer_name}</p>
            <p className="text-sm text-slate-600">{customer.customer_phone}</p>
            {customer.customer_email && (
              <p className="text-sm text-slate-600">{customer.customer_email}</p>
            )}
            <p className="text-sm text-slate-600 mt-1">
              {customer.job_site_address}
            </p>
          </div>
          <div className="card">
            <h3 className="font-semibold mb-2">Items ({items.length})</h3>
            <div className="space-y-1.5">
              {items.map((it, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-slate-700 truncate pr-2">
                    {it.name}{' '}
                    <span className="text-slate-400">
                      × {it.quantity} {it.unit}
                    </span>
                  </span>
                  <span className="font-medium whitespace-nowrap">
                    {formatAUD(
                      Number(it.quantity || 0) * Number(it.unit_price || 0)
                    )}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-100 mt-3 pt-3">
              <TotalsRow label="Subtotal" value={totals.subtotal} />
              <TotalsRow label="GST" value={totals.gst} />
              <TotalsRow label="Total" value={totals.total} bold />
            </div>
          </div>
          {err && <p className="text-sm text-red-600">{err}</p>}
        </section>
      )}

      {/* Footer nav */}
      <div className="fixed bottom-20 inset-x-0 bg-white border-t border-slate-200 p-3 safe-bottom">
        <div className="max-w-lg mx-auto flex gap-2">
          {step < STEPS.length - 1 ? (
            <button
              onClick={() => canAdvance() && setStep(step + 1)}
              disabled={!canAdvance()}
              className="btn-primary flex-1"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={onSave}
              disabled={busy || items.length === 0}
              className="btn-primary flex-1"
            >
              {busy ? 'Saving…' : 'Save as draft'}
            </button>
          )}
        </div>
      </div>

      {pickerOpen && (
        <QuoteItemPicker
          onPick={addItem}
          onCustom={() => {
            setPickerOpen(false)
            setCustomOpen(true)
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}
      {customOpen && (
        <CustomItemModal
          onAdd={(it, saveToLibrary) => addCustomItem(it, saveToLibrary)}
          onClose={() => setCustomOpen(false)}
        />
      )}
    </div>
  )
}

function TotalsRow({ label, value, bold }) {
  return (
    <div
      className={`flex justify-between text-sm py-1 ${
        bold ? 'font-bold text-brand border-t border-slate-100 pt-2 mt-1' : 'text-slate-600'
      }`}
    >
      <span>{label}</span>
      <span>{formatAUD(value)}</span>
    </div>
  )
}

function CustomItemModal({ onAdd, onClose }) {
  const [form, setForm] = useState({
    name: '',
    category: 'Materials',
    unit: 'per unit',
    default_price: ''
  })
  const [saveToLibrary, setSaveToLibrary] = useState(true)
  function submit(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    onAdd(
      {
        id: null,
        name: form.name.trim(),
        category: form.category,
        unit: form.unit,
        default_price: Number(form.default_price) || 0,
        description: null
      },
      saveToLibrary
    )
    onClose()
  }
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center">
      <form
        onSubmit={submit}
        className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl p-4 space-y-4 safe-bottom"
      >
        <h2 className="text-lg font-bold">Custom item</h2>
        <div>
          <label className="label">Name *</label>
          <input
            required
            autoFocus
            className="input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Category</label>
            <select
              className="input"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {['Materials', 'Labour', 'Equipment Hire', 'Disposal', 'Other'].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Unit</label>
            <select
              className="input"
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
            >
              {['per metre', 'per unit', 'per hour', 'per sqm', 'per day', 'fixed'].map(
                (u) => (
                  <option key={u}>{u}</option>
                )
              )}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Unit price (ex GST)</label>
          <input
            inputMode="decimal"
            className="input"
            value={form.default_price}
            onChange={(e) => setForm({ ...form, default_price: e.target.value })}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700 select-none">
          <input
            type="checkbox"
            checked={saveToLibrary}
            onChange={(e) => setSaveToLibrary(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
          />
          Save to library for reuse
        </label>
        <div className="flex gap-2">
          <button type="submit" className="btn-primary flex-1">
            Add to quote
          </button>
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
