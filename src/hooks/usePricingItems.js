import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { useBusiness } from './useBusiness.jsx'

export function usePricingItems() {
  const { business } = useBusiness()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    if (!business) {
      setItems([])
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error } = await supabase
      .from('pricing_items')
      .select('*')
      .eq('business_id', business.id)
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })
    if (error) setError(error)
    setItems(data || [])
    setLoading(false)
  }, [business])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function create(input) {
    const { data, error } = await supabase
      .from('pricing_items')
      .insert({ ...input, business_id: business.id })
      .select()
      .single()
    if (!error) await refresh()
    return { data, error }
  }

  async function update(id, patch) {
    const { data, error } = await supabase
      .from('pricing_items')
      .update(patch)
      .eq('id', id)
      .select()
      .single()
    if (!error) await refresh()
    return { data, error }
  }

  async function archive(id) {
    const { error } = await supabase
      .from('pricing_items')
      .update({ is_active: false })
      .eq('id', id)
    if (!error) await refresh()
    return { error }
  }

  return { items, loading, error, refresh, create, update, archive }
}
