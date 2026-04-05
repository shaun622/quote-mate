// update-job-status Edge Function
// Tradie updates a job's status. Logs to job_status_history and emails the customer.
//
// POST /update-job-status
// body: { job_id: string, new_status: 'scheduled'|'in_progress'|'on_hold'|'completed'|'invoiced'|'cancelled', note?: string, notify?: boolean }
//
// Auth is verified inside the function via the caller's JWT.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { sendEmail } from '../_shared/resend.ts'
import { buildJobStatusEmail, type JobStatus } from '../_shared/job-email.ts'

const ALLOWED: JobStatus[] = [
  'scheduled',
  'in_progress',
  'on_hold',
  'completed',
  'invoiced',
  'cancelled'
]

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

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } }
    })
    const admin = createClient(supabaseUrl, serviceKey)

    const {
      data: { user },
      error: userErr
    } = await userClient.auth.getUser()
    if (userErr || !user) return jsonResponse({ error: 'Unauthorized' }, 401)

    const body = await req.json().catch(() => ({}))
    const { job_id, new_status, note, notify = true } = body
    if (!job_id) return jsonResponse({ error: 'job_id is required' }, 400)
    if (!ALLOWED.includes(new_status)) {
      return jsonResponse({ error: 'invalid new_status' }, 400)
    }

    // Load via RLS-scoped client to confirm ownership
    const { data: job, error: jErr } = await userClient
      .from('jobs')
      .select('*')
      .eq('id', job_id)
      .maybeSingle()
    if (jErr || !job) return jsonResponse({ error: 'Job not found' }, 404)

    const oldStatus = job.status
    if (oldStatus === new_status) {
      return jsonResponse({ ok: true, unchanged: true })
    }

    const patch: Record<string, unknown> = { status: new_status }
    const nowIso = new Date().toISOString()
    if (new_status === 'in_progress' && !job.started_at) patch.started_at = nowIso
    if (new_status === 'completed' && !job.completed_at) patch.completed_at = nowIso

    const { error: updateErr } = await admin
      .from('jobs')
      .update(patch)
      .eq('id', job_id)
      .eq('business_id', job.business_id)
    if (updateErr) return jsonResponse({ error: updateErr.message }, 500)

    await admin.from('job_status_history').insert({
      job_id,
      old_status: oldStatus,
      new_status,
      note: note || null,
      notification_sent: false
    })

    let emailId: string | null = null
    let emailError: string | null = null

    if (notify && job.customer_email) {
      const { data: business } = await admin
        .from('businesses')
        .select('name, phone, email, brand_color, logo_url')
        .eq('id', job.business_id)
        .maybeSingle()

      if (business) {
        const built = buildJobStatusEmail({
          status: new_status,
          jobNumber: job.job_number,
          customerName: job.customer_name,
          jobSiteAddress: job.job_site_address,
          scheduledStart: job.scheduled_start,
          note: note || null,
          businessName: business.name,
          businessPhone: business.phone,
          businessEmail: business.email,
          brandColor: business.brand_color,
          logoUrl: business.logo_url
        })
        if (built) {
          const from =
            Deno.env.get('RESEND_FROM') || 'QuoteMate <onboarding@resend.dev>'
          try {
            const res = await sendEmail({
              from,
              to: job.customer_email,
              subject: built.subject,
              html: built.html,
              text: built.text,
              replyTo: business.email
            })
            emailId = res.id
            // Mark most recent history row as notified
            await admin
              .from('job_status_history')
              .update({ notification_sent: true })
              .eq('job_id', job_id)
              .eq('new_status', new_status)
              .order('changed_at', { ascending: false })
              .limit(1)
          } catch (e) {
            emailError = e instanceof Error ? e.message : 'email failed'
            console.error('Customer notification failed:', emailError)
          }
        }
      }
    }

    return jsonResponse({
      ok: true,
      status: new_status,
      email_id: emailId,
      email_error: emailError
    })
  } catch (err) {
    console.error('update-job-status error:', err)
    const message = err instanceof Error ? err.message : 'Internal error'
    return jsonResponse({ error: message }, 500)
  }
})
