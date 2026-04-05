import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.jsx'

export default function SignUp() {
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    setErr('')
    setInfo('')
    if (password.length < 8) {
      setErr('Password must be at least 8 characters')
      return
    }
    setBusy(true)
    const { data, error } = await signUp(email, password)
    setBusy(false)
    if (error) {
      setErr(error.message)
      return
    }
    // If email confirmation is ON, session will be null and user must confirm first.
    if (data.session) {
      navigate('/onboarding', { replace: true })
    } else {
      setInfo('Check your email to confirm your account, then sign in.')
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#F5F5F5]">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-brand">QuoteMate</h1>
          <p className="text-sm text-slate-500 mt-1">14-day free trial. No card required.</p>
        </div>
        <form onSubmit={onSubmit} className="card space-y-4">
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="At least 8 characters"
            />
          </div>
          {err && <p className="text-sm text-red-600">{err}</p>}
          {info && <p className="text-sm text-emerald-700">{info}</p>}
          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy ? 'Creating account…' : 'Create account'}
          </button>
        </form>
        <p className="text-center text-sm text-slate-600 mt-6">
          Already have an account?{' '}
          <Link to="/signin" className="text-brand font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
