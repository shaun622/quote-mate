import { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import { useBusiness } from '../../hooks/useBusiness.jsx'
import TradeTypeInput from './TradeTypeInput.jsx'

export default function BusinessProfile() {
  const { business, refresh } = useBusiness()
  const [form, setForm] = useState(null)
  const [err, setErr] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (business) setForm({ ...business })
  }, [business])

  if (!form) {
    return <div className="p-4 text-slate-500">Loading…</div>
  }

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    setErr('')
    setInfo('')
    if (!form.trade_type?.trim()) {
      setErr('Please describe your trade')
      return
    }
    setBusy(true)
    const { error } = await supabase
      .from('businesses')
      .update({
        name: form.name.trim(),
        trade_type: form.trade_type,
        phone: form.phone.trim(),
        email: form.email.trim(),
        abn: form.abn?.trim() || null,
        address: form.address?.trim() || null,
        brand_color: form.brand_color
      })
      .eq('id', business.id)
    setBusy(false)
    if (error) {
      setErr(error.message)
      return
    }
    setInfo('Saved.')
    await refresh()
  }

  return (
    <div className="p-4 space-y-4">
      <header className="flex items-center gap-2">
        <Link to="/settings" className="btn-ghost -ml-2 !min-h-0 !py-2 !px-2">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold">Business profile</h1>
      </header>
      <form onSubmit={onSubmit} className="card space-y-4">
        <div>
          <label className="label">Business name *</label>
          <input
            required
            className="input"
            value={form.name || ''}
            onChange={(e) => set('name', e.target.value)}
          />
        </div>
        <div>
          <label className="label">Trade type *</label>
          <TradeTypeInput
            value={form.trade_type}
            onChange={(v) => set('trade_type', v)}
          />
        </div>
        <div>
          <label className="label">Phone *</label>
          <input
            required
            type="tel"
            className="input"
            value={form.phone || ''}
            onChange={(e) => set('phone', e.target.value)}
          />
        </div>
        <div>
          <label className="label">Email *</label>
          <input
            required
            type="email"
            className="input"
            value={form.email || ''}
            onChange={(e) => set('email', e.target.value)}
          />
        </div>
        <div>
          <label className="label">ABN</label>
          <input
            className="input"
            value={form.abn || ''}
            onChange={(e) => set('abn', e.target.value)}
          />
        </div>
        <div>
          <label className="label">Business address</label>
          <input
            className="input"
            value={form.address || ''}
            onChange={(e) => set('address', e.target.value)}
          />
        </div>
        <div>
          <label className="label">Brand colour</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={form.brand_color || '#1E3A5F'}
              onChange={(e) => set('brand_color', e.target.value)}
              className="h-11 w-16 rounded-lg border border-slate-200 bg-white cursor-pointer"
            />
            <span className="text-sm text-slate-600">{form.brand_color}</span>
          </div>
        </div>
        {err && <p className="text-sm text-red-600">{err}</p>}
        {info && <p className="text-sm text-emerald-700">{info}</p>}
        <button type="submit" disabled={busy} className="btn-primary w-full">
          {busy ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </div>
  )
}
