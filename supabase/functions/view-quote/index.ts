// view-quote Edge Function (PUBLIC - no auth)
// Returns a quote + line items + business branding for the customer-facing page.
// Marks the quote as 'viewed' on first access. Validates token + expiry.
//
// GET /view-quote?token={public_token}

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const token = url.searchParams.get('token')
    if (!token) return jsonResponse({ error: 'token is required' }, 400)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const admin = createClient(supabaseUrl, serviceKey)

    const { data: quote, error: qErr } = await admin
      .from('quotes')
      .select('*')
      .eq('public_token', token)
      .maybeSingle()

    if (qErr) throw qErr
    if (!quote) return jsonResponse({ error: 'Quote not found' }, 404)

    // Auto-expire if past valid_until
    let status = quote.status
    if (
      status !== 'accepted' &&
      status !== 'declined' &&
      quote.valid_until &&
      new Date(quote.valid_until) < new Date(new Date().toISOString().slice(0, 10))
    ) {
      status = 'expired'
      await admin.from('quotes').update({ status }).eq('id', quote.id)
    }

    // First view: mark viewed + timestamp (don't overwrite accepted/declined/expired)
    if (status === 'sent') {
      status = 'viewed'
      await admin
        .from('quotes')
        .update({ status, viewed_at: new Date().toISOString() })
        .eq('id', quote.id)
    }

    const [{ data: items }, { data: business }] = await Promise.all([
      admin
        .from('quote_items')
        .select('*')
        .eq('quote_id', quote.id)
        .order('sort_order'),
      admin
        .from('businesses')
        .select('name, abn, phone, email, address, logo_url, brand_color, trade_type')
        .eq('id', quote.business_id)
        .maybeSingle()
    ])

    // Return a safe subset (no internal fields)
    return jsonResponse({
      quote: {
        id: quote.id,
        quote_number: quote.quote_number,
        status,
        customer_name: quote.customer_name,
        job_site_address: quote.job_site_address,
        scope_of_work: quote.scope_of_work,
        exclusions: quote.exclusions,
        validity_days: quote.validity_days,
        valid_until: quote.valid_until,
        estimated_start: quote.estimated_start,
        estimated_duration: quote.estimated_duration,
        notes: quote.notes,
        payment_terms: quote.payment_terms,
        subtotal: Number(quote.subtotal),
        gst: Number(quote.gst),
        total: Number(quote.total),
        created_at: quote.created_at,
        sent_at: quote.sent_at,
        viewed_at: quote.viewed_at,
        responded_at: quote.responded_at
      },
      items: (items || []).map((i) => ({
        id: i.id,
        name: i.name,
        description: i.description,
        category: i.category,
        unit: i.unit,
        quantity: Number(i.quantity),
        unit_price: Number(i.unit_price),
        line_total: Number(i.line_total)
      })),
      business
    })
  } catch (err) {
    console.error('view-quote error:', err)
    const message = err instanceof Error ? err.message : 'Internal error'
    return jsonResponse({ error: message }, 500)
  }
})
