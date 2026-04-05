// respond-to-quote Edge Function (PUBLIC - no auth)
// Customer accepts or declines a quote. Creates a Job on acceptance.
//
// POST /respond-to-quote
// body: { token: string, response: 'accept' | 'decline', reason?: string }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { sendEmail } from '../_shared/resend.ts'

function padNumber(n: number, width = 4): string {
  return String(n).padStart(width, '0')
}

async function nextJobNumber(admin: any, businessId: string): Promise<string> {
  const { data } = await admin
    .from('jobs')
    .select('job_number')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
    .limit(1)
  const last = data?.[0]?.job_number
  let n = 1
  if (last) {
    const m = last.match(/(\d+)/)
    if (m) n = parseInt(m[1], 10) + 1
  }
  return `JOB-${padNumber(n, 4)}`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { token, response, reason } = await req.json().catch(() => ({}))
    if (!token) return jsonResponse({ error: 'token is required' }, 400)
    if (response !== 'accept' && response !== 'decline') {
      return jsonResponse({ error: 'response must be "accept" or "decline"' }, 400)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const admin = createClient(supabaseUrl, serviceKey)

    const { data: quote } = await admin
      .from('quotes')
      .select('*')
      .eq('public_token', token)
      .maybeSingle()
    if (!quote) return jsonResponse({ error: 'Quote not found' }, 404)

    // Already responded?
    if (quote.status === 'accepted' || quote.status === 'declined') {
      return jsonResponse(
        { error: `Quote already ${quote.status}` },
        409
      )
    }

    // Expired?
    if (
      quote.valid_until &&
      new Date(quote.valid_until) < new Date(new Date().toISOString().slice(0, 10))
    ) {
      return jsonResponse({ error: 'Quote has expired' }, 410)
    }

    const now = new Date().toISOString()
    const newStatus = response === 'accept' ? 'accepted' : 'declined'

    await admin
      .from('quotes')
      .update({
        status: newStatus,
        responded_at: now,
        decline_reason: response === 'decline' ? (reason || null) : null
      })
      .eq('id', quote.id)

    let jobId: string | null = null
    if (response === 'accept') {
      const jobNumber = await nextJobNumber(admin, quote.business_id)
      const { data: job } = await admin
        .from('jobs')
        .insert({
          business_id: quote.business_id,
          quote_id: quote.id,
          job_number: jobNumber,
          status: 'scheduled',
          customer_name: quote.customer_name,
          customer_phone: quote.customer_phone,
          customer_email: quote.customer_email,
          job_site_address: quote.job_site_address,
          scheduled_start: quote.estimated_start
        })
        .select()
        .single()
      jobId = job?.id || null

      if (job) {
        await admin.from('job_status_history').insert({
          job_id: job.id,
          old_status: null,
          new_status: 'scheduled',
          notification_sent: false
        })
      }
    }

    // Notify the tradie by email
    try {
      const { data: business } = await admin
        .from('businesses')
        .select('name, email, brand_color')
        .eq('id', quote.business_id)
        .maybeSingle()

      if (business?.email) {
        const from = Deno.env.get('RESEND_FROM') || 'QuoteMate <onboarding@resend.dev>'
        const subject =
          response === 'accept'
            ? `✓ Accepted: ${quote.quote_number} — ${quote.customer_name}`
            : `Declined: ${quote.quote_number} — ${quote.customer_name}`
        const body = response === 'accept'
          ? `<p><strong>${quote.customer_name}</strong> accepted quote <strong>${quote.quote_number}</strong>.</p>
             <p>Job site: ${quote.job_site_address}</p>
             <p>A new job has been created for you. Open QuoteMate to see it.</p>`
          : `<p><strong>${quote.customer_name}</strong> declined quote <strong>${quote.quote_number}</strong>.</p>
             ${reason ? `<p>Reason: ${reason}</p>` : ''}`
        await sendEmail({
          from,
          to: business.email,
          subject,
          html: `<div style="font-family:sans-serif;font-size:15px;color:#0f172a">${body}</div>`
        }).catch((e) => console.error('tradie notification failed:', e))
      }
    } catch (e) {
      console.error('Notification error (non-fatal):', e)
    }

    return jsonResponse({
      ok: true,
      status: newStatus,
      job_id: jobId
    })
  } catch (err) {
    console.error('respond-to-quote error:', err)
    const message = err instanceof Error ? err.message : 'Internal error'
    return jsonResponse({ error: message }, 500)
  }
})
