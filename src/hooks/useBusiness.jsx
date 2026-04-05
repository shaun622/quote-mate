import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase.js'
import { useAuth } from './useAuth.jsx'

const BusinessContext = createContext({
  business: null,
  loading: true,
  refresh: async () => {}
})

export function BusinessProvider({ children }) {
  const { user, loading: authLoading } = useAuth()
  const [business, setBusiness] = useState(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!user) {
      setBusiness(null)
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
    if (error) {
      console.error('Failed to load business:', error)
    }
    setBusiness(data ?? null)
    setLoading(false)
  }, [user])

  useEffect(() => {
    if (authLoading) return
    refresh()
  }, [authLoading, refresh])

  return (
    <BusinessContext.Provider value={{ business, loading, refresh }}>
      {children}
    </BusinessContext.Provider>
  )
}

export function useBusiness() {
  return useContext(BusinessContext)
}
