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
        const appUrl = (Deno.env.get('APP_URL') || 'http://localhost:5173').replace(/\/$/, '')
        const brand = business.brand_color || '#1E3A5F'
        const quoteLink = `${appUrl}/quotes/${quote.id}`
        const subject =
          response === 'accept'
            ? `✓ Accepted: ${quote.quote_number} — ${quote.customer_name}`
            : `Declined: ${quote.quote_number} — ${quote.customer_name}`
        const heading = response === 'accept'
          ? `${quote.customer_name} accepted your quote`
          : `${quote.customer_name} declined your quote`
        const detail = response === 'accept'
          ? `<p style="margin:0 0 8px;font-size:15px;color:#334155;line-height:1.5"><strong>${quote.customer_name}</strong> accepted quote <strong>${quote.quote_number}</strong>.</p>
             <p style="margin:0 0 8px;font-size:14px;color:#64748b">Job site: ${quote.job_site_address}</p>
             <p style="margin:0 0 16px;font-size:14px;color:#334155">A new job has been created automatically.</p>`
          : `<p style="margin:0 0 8px;font-size:15px;color:#334155;line-height:1.5"><strong>${quote.customer_name}</strong> declined quote <strong>${quote.quote_number}</strong>.</p>
             ${reason ? `<p style="margin:0 0 16px;font-size:14px;color:#64748b">Reason: ${reason}</p>` : ''}`
        const buttonLabel = response === 'accept' ? 'View job' : 'View quote'
        const html = `<!doctype html>
<html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0f172a">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:24px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06)">
        <tr><td style="background:${brand};padding:24px">
          <div style="font-size:22px;font-weight:700;color:#ffffff;margin-bottom:4px">${heading}</div>
          <div style="font-size:13px;color:rgba(255,255,255,0.85)">${quote.quote_number}</div>
        </td></tr>
        <tr><td style="padding:24px">
          ${detail}
          <a href="${quoteLink}" style="display:inline-block;background:${brand};color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:14px 28px;border-radius:8px">${buttonLabel}</a>
        </td></tr>
      </table>
      <p style="font-size:11px;color:#94a3b8;margin:16px 0 0">Sent via QuoteMate</p>
    </td></tr>
  </table>
</body></html>`
        await sendEmail({
          from,
          to: business.email,
          subject,
          html
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
