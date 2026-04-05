import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { useBusiness } from './useBusiness.jsx'

export const JOB_STATUSES = [
  'scheduled',
  'in_progress',
  'on_hold',
  'completed',
  'invoiced',
  'cancelled'
]

export const ACTIVE_STATUSES = ['scheduled', 'in_progress', 'on_hold']

export function useJobs() {
  const { business } = useBusiness()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!business) {
      setJobs([])
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error } = await supabase
      .from('jobs')
      .select('*, quotes(quote_number, total)')
      .eq('business_id', business.id)
      .order('created_at', { ascending: false })
    if (error) console.error(error)
    setJobs(data || [])
    setLoading(false)
  }, [business])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { jobs, loading, refresh }
}

/** Invoke update-job-status edge function */
export async function updateJobStatus({ jobId, newStatus, note, notify = true }) {
  const { data, error } = await supabase.functions.invoke('update-job-status', {
    body: { job_id: jobId, new_status: newStatus, note, notify }
  })
  if (error) {
    let detail = error.message || 'Failed to update job'
    try {
      if (error.context?.json) {
        const body = await error.context.json()
        if (body?.error) detail = body.error
      }
    } catch (_) {}
    throw new Error(detail)
  }
  if (data?.error) throw new Error(data.error)
  return data
}
