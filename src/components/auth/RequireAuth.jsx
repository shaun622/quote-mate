import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.jsx'
import { useBusiness } from '../../hooks/useBusiness.jsx'

function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center text-slate-500">
      Loading…
    </div>
  )
}

/** Requires the user to be signed in. Sends to /signin otherwise. */
export function RequireAuth() {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <Loading />
  if (!user) return <Navigate to="/signin" state={{ from: location }} replace />
  return <Outlet />
}

/** Requires a business profile to exist. Sends to /onboarding otherwise. */
export function RequireBusiness() {
  const { business, loading } = useBusiness()
  if (loading) return <Loading />
  if (!business) return <Navigate to="/onboarding" replace />
  return <Outlet />
}
