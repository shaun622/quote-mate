import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { useBusiness } from './useBusiness.jsx'
import { generateToken, padNumber } from '../lib/utils.js'

export function useQuotes() {
  const { business } = useBusiness()
  const [quotes, setQuotes] = useState([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!business) {
      setQuotes([])
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .eq('business_id', business.id)
      .order('created_at', { ascending: false })
    if (error) console.error(error)
    setQuotes(data || [])
    setLoading(false)
  }, [business])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { quotes, loading, refresh }
}

/** Generate the next quote number for a business (e.g. QM-0001). */
export async function nextQuoteNumber(businessId) {
  const { data, error } = await supabase
    .from('quotes')
    .select('quote_number')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
    .limit(1)
  if (error) throw error
  const last = data?.[0]?.quote_number
  let n = 1
  if (last) {
    const m = last.match(/(\d+)/)
    if (m) n = parseInt(m[1], 10) + 1
  }
  return `QM-${padNumber(n, 4)}`
}

/**
 * Create a full quote with its line items.
 * `items` = [{ pricing_item_id?, name, description?, category, unit, quantity, unit_price, sort_order }]
 */
export async function createQuote({ businessId, quote, items }) {
  const quoteNumber = await nextQuoteNumber(businessId)
  const publicToken = generateToken(24)

  // Compute totals server-side-ish (still client, but consistent)
  const subtotal = items.reduce(
    (s, i) => s + Number(i.quantity || 0) * Number(i.unit_price || 0),
    0
  )
  const subtotalRounded = Math.round(subtotal * 100) / 100
  const gst = Math.round(subtotalRounded * 0.1 * 100) / 100
  const total = Math.round((subtotalRounded + gst) * 100) / 100

  const validUntil = quote.validity_days
    ? new Date(Date.now() + quote.validity_days * 86400000)
        .toISOString()
        .slice(0, 10)
    : null

  const { data: newQuote, error: qErr } = await supabase
    .from('quotes')
    .insert({
      business_id: businessId,
      quote_number: quoteNumber,
      public_token: publicToken,
      status: 'draft',
      customer_name: quote.customer_name,
      customer_phone: quote.customer_phone,
      customer_email: quote.customer_email || null,
      job_site_address: quote.job_site_address,
      scope_of_work: quote.scope_of_work || null,
      exclusions: quote.exclusions || null,
      validity_days: quote.validity_days || 30,
      valid_until: validUntil,
      estimated_start: quote.estimated_start || null,
      estimated_duration: quote.estimated_duration || null,
      notes: quote.notes || null,
      payment_terms: quote.payment_terms || '50% deposit, 50% on completion',
      subtotal: subtotalRounded,
      gst,
      total
    })
    .select()
    .single()
  if (qErr) throw qErr

  const rows = items.map((i, idx) => {
    const qty = Number(i.quantity || 0)
    const price = Number(i.unit_price || 0)
    return {
      quote_id: newQuote.id,
      pricing_item_id: i.pricing_item_id || null,
      name: i.name,
      description: i.description || null,
      category: i.category,
      unit: i.unit,
      quantity: qty,
      unit_price: price,
      line_total: Math.round(qty * price * 100) / 100,
      sort_order: idx
    }
  })

  if (rows.length > 0) {
    const { error: iErr } = await supabase.from('quote_items').insert(rows)
    if (iErr) throw iErr
  }

  return newQuote
}
