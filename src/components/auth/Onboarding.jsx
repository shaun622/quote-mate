import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import { useAuth } from '../../hooks/useAuth.jsx'
import { useBusiness } from '../../hooks/useBusiness.jsx'

const TRADE_TYPES = [
  'Fencing',
  'Retaining Walls',
  'Electrical',
  'Plumbing',
  'Carpentry',
  'Painting',
  'Landscaping',
  'Roofing',
  'Tiling',
  'Concreting',
  'General Building',
  'Other'
]

export default function Onboarding() {
  const { user } = useAuth()
  const { refresh } = useBusiness()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: '',
    trade_type: 'Fencing',
    phone: '',
    email: user?.email || '',
    abn: '',
    address: '',
    brand_color: '#1E3A5F'
  })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    setErr('')
    setBusy(true)
    const { error } = await supabase.from('businesses').insert({
      user_id: user.id,
      name: form.name.trim(),
      trade_type: form.trade_type,
      phone: form.phone.trim(),
      email: form.email.trim(),
      abn: form.abn.trim() || null,
      address: form.address.trim() || null,
      brand_color: form.brand_color
    })
    setBusy(false)
    if (error) {
      setErr(error.message)
      return
    }
    await refresh()
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] p-4">
      <div className="max-w-lg mx-auto pt-6">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-brand">Set up your business</h1>
          <p className="text-sm text-slate-500 mt-1">
            This info appears on every quote you send.
          </p>
        </header>
        <form onSubmit={onSubmit} className="card space-y-4">
          <div>
            <label className="label">Business name *</label>
            <input
              required
              className="input"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Elite Walls & Fencing"
            />
          </div>
          <div>
            <label className="label">Trade type *</label>
            <select
              className="input"
              value={form.trade_type}
              onChange={(e) => set('trade_type', e.target.value)}
            >
              {TRADE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="label">Phone *</label>
              <input
                required
                type="tel"
                className="input"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="0400 000 000"
              />
            </div>
            <div>
              <label className="label">Email *</label>
              <input
                required
                type="email"
                className="input"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="label">ABN</label>
            <input
              className="input"
              value={form.abn}
              onChange={(e) => set('abn', e.target.value)}
              placeholder="Optional — shown on quotes"
            />
          </div>
          <div>
            <label className="label">Business address</label>
            <input
              className="input"
              value={form.address}
              onChange={(e) => set('address', e.target.value)}
              placeholder="Optional"
            />
          </div>
          <div>
            <label className="label">Brand colour</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.brand_color}
                onChange={(e) => set('brand_color', e.target.value)}
                className="h-11 w-16 rounded-lg border border-slate-200 bg-white cursor-pointer"
              />
              <span className="text-sm text-slate-600">{form.brand_color}</span>
            </div>
          </div>
          {err && <p className="text-sm text-red-600">{err}</p>}
          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy ? 'Saving…' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  )
}
