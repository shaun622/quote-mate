// send-quote Edge Function
// Sends a quote email (via Resend) to the customer and marks the quote as 'sent'.
//
// Auth: requires the tradie's JWT (standard Supabase function invocation).
// Body: { quote_id: string }
//
// Env vars required (set via `supabase secrets set`):
//   RESEND_API_KEY         - Resend API key
//   RESEND_FROM            - From address, e.g. "QuoteMate <onboarding@resend.dev>"
//   APP_URL                - Frontend base URL, e.g. "https://quotemate.app"
// Provided automatically by Supabase:
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   SUPABASE_ANON_KEY

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { sendEmail } from '../_shared/resend.ts'
import { buildQuoteEmail } from '../_shared/quote-email.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return jsonResponse({ error: 'Missing authorization' }, 401)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    // User-scoped client (respects RLS) — used to verify the caller owns the quote
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } }
    })
    // Service-role client — used for writes that need to bypass RLS safely
    const adminClient = createClient(supabaseUrl, serviceKey)

    const { data: { user }, error: userErr } = await userClient.auth.getUser()
    if (userErr || !user) return jsonResponse({ error: 'Unauthorized' }, 401)

    const { quote_id } = await req.json().catch(() => ({}))
    if (!quote_id) return jsonResponse({ error: 'quote_id is required' }, 400)

    // Load quote via RLS-scoped client — if the user doesn't own it, this returns null.
    const { data: quote, error: qErr } = await userClient
      .from('quotes')
      .select('*')
      .eq('id', quote_id)
      .single()

    if (qErr || !quote) return jsonResponse({ error: 'Quote not found' }, 404)
    if (!quote.customer_email) {
      return jsonResponse(
        { error: 'Quote has no customer email' },
        400
      )
    }

    // Load the business for branding
    const { data: business, error: bErr } = await userClient
      .from('businesses')
      .select('*')
      .eq('id', quote.business_id)
      .single()
    if (bErr || !business) return jsonResponse({ error: 'Business not found' }, 404)

    const appUrl = Deno.env.get('APP_URL') || 'http://localhost:5173'
    const fromAddress =
      Deno.env.get('RESEND_FROM') || 'QuoteMate <onboarding@resend.dev>'
    const quoteUrl = `${appUrl.replace(/\/$/, '')}/quote/${quote.public_token}`

    const { subject, html, text } = buildQuoteEmail({
      quoteNumber: quote.quote_number,
      customerName: quote.customer_name,
      jobSiteAddress: quote.job_site_address,
      subtotal: Number(quote.subtotal),
      gst: Number(quote.gst),
      total: Number(quote.total),
      validUntil: quote.valid_until,
      scopeOfWork: quote.scope_of_work,
      businessName: business.name,
      businessPhone: business.phone,
      businessEmail: business.email,
      brandColor: business.brand_color,
      logoUrl: business.logo_url,
      quoteUrl
    })

    const { id: emailId } = await sendEmail({
      from: fromAddress,
      to: quote.customer_email,
      subject,
      html,
      text,
      replyTo: business.email
    })

    // Mark as sent (service role — avoids any RLS edge cases on update)
    const { error: updateErr } = await adminClient
      .from('quotes')
      .update({
        status: quote.status === 'draft' ? 'sent' : quote.status,
        sent_at: quote.sent_at || new Date().toISOString()
      })
      .eq('id', quote_id)
      .eq('business_id', quote.business_id)

    if (updateErr) {
      console.error('Failed to update quote status:', updateErr)
    }

    return jsonResponse({ ok: true, email_id: emailId, quote_url: quoteUrl })
  } catch (err) {
    console.error('send-quote error:', err)
    const message = err instanceof Error ? err.message : 'Internal error'
    return jsonResponse({ error: message }, 500)
  }
})
