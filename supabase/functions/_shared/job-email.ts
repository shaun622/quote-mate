import { formatDateAEST, escapeHtml } from './format.ts'

export type JobStatus =
  | 'scheduled'
  | 'in_progress'
  | 'on_hold'
  | 'completed'
  | 'invoiced'
  | 'cancelled'

export interface JobEmailData {
  status: JobStatus
  jobNumber: string
  customerName: string
  jobSiteAddress: string
  scheduledStart: string | null
  note: string | null
  businessName: string
  businessPhone: string
  businessEmail: string
  brandColor: string
  logoUrl: string | null
}

interface Template {
  subject: string
  heading: string
  body: string
}

function template(d: JobEmailData): Template | null {
  const name = escapeHtml(d.businessName)
  const customer = escapeHtml(d.customerName)
  const site = escapeHtml(d.jobSiteAddress)
  const dateStr = d.scheduledStart
    ? formatDateAEST(d.scheduledStart, { dateStyle: 'long' })
    : null
  const noteBlock = d.note
    ? `<p style="margin:12px 0 0;font-size:14px;color:#334155;line-height:1.5;white-space:pre-wrap">${escapeHtml(d.note)}</p>`
    : ''

  switch (d.status) {
    case 'scheduled':
      return {
        subject: `Your job is booked — ${d.jobNumber}`,
        heading: 'Your job is booked',
        body: `
          <p style="margin:0 0 8px;font-size:16px">Hi ${customer},</p>
          <p style="margin:0;font-size:15px;color:#334155;line-height:1.5">
            Great news — ${name} has scheduled your job${dateStr ? ` for <strong>${escapeHtml(dateStr)}</strong>` : ''}.
          </p>
          <p style="margin:12px 0 0;font-size:14px;color:#64748b">Site: ${site}</p>
          ${noteBlock}
        `
      }
    case 'in_progress':
      return {
        subject: `We're on site — ${d.jobNumber}`,
        heading: `We're on site`,
        body: `
          <p style="margin:0 0 8px;font-size:16px">Hi ${customer},</p>
          <p style="margin:0;font-size:15px;color:#334155;line-height:1.5">
            ${name} is on site today working on your job at <strong>${site}</strong>. We'll keep you posted on progress.
          </p>
          ${noteBlock}
        `
      }
    case 'on_hold':
      return {
        subject: `Your job is on hold — ${d.jobNumber}`,
        heading: 'Your job is on hold',
        body: `
          <p style="margin:0 0 8px;font-size:16px">Hi ${customer},</p>
          <p style="margin:0;font-size:15px;color:#334155;line-height:1.5">
            We've had to temporarily pause work on your job at <strong>${site}</strong>. We'll be back in touch with an update as soon as we can.
          </p>
          ${noteBlock}
        `
      }
    case 'completed':
      return {
        subject: `Job complete — ${d.jobNumber}`,
        heading: 'Job complete',
        body: `
          <p style="margin:0 0 8px;font-size:16px">Hi ${customer},</p>
          <p style="margin:0;font-size:15px;color:#334155;line-height:1.5">
            Your job at <strong>${site}</strong> is complete. Thanks for choosing ${name} — we really appreciate your business. An invoice will follow shortly.
          </p>
          ${noteBlock}
        `
      }
    case 'invoiced':
      return {
        subject: `Invoice sent — ${d.jobNumber}`,
        heading: 'Invoice sent',
        body: `
          <p style="margin:0 0 8px;font-size:16px">Hi ${customer},</p>
          <p style="margin:0;font-size:15px;color:#334155;line-height:1.5">
            Your invoice for the job at <strong>${site}</strong> has been issued. Thanks again from ${name}.
          </p>
          ${noteBlock}
        `
      }
    case 'cancelled':
      return {
        subject: `Job cancelled — ${d.jobNumber}`,
        heading: 'Job cancelled',
        body: `
          <p style="margin:0 0 8px;font-size:16px">Hi ${customer},</p>
          <p style="margin:0;font-size:15px;color:#334155;line-height:1.5">
            Your job at <strong>${site}</strong> has been cancelled. If this is unexpected, please reach out to ${name}.
          </p>
          ${noteBlock}
        `
      }
    default:
      return null
  }
}

export function buildJobStatusEmail(d: JobEmailData): {
  subject: string
  html: string
  text: string
} | null {
  const tpl = template(d)
  if (!tpl) return null

  const brand = d.brandColor || '#1E3A5F'

  const logoBlock = d.logoUrl
    ? `<img src="${escapeHtml(d.logoUrl)}" alt="${escapeHtml(d.businessName)}" style="max-height:48px;max-width:180px;display:block;margin-bottom:12px" />`
    : `<div style="font-size:22px;font-weight:700;color:#ffffff;margin-bottom:4px">${escapeHtml(d.businessName)}</div>`

  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${escapeHtml(tpl.subject)}</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0f172a">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:24px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06)">
        <tr>
          <td style="background:${escapeHtml(brand)};padding:24px">
            ${logoBlock}
            <div style="font-size:13px;color:rgba(255,255,255,0.85)">${escapeHtml(tpl.heading)} · ${escapeHtml(d.jobNumber)}</div>
          </td>
        </tr>
        <tr>
          <td style="padding:24px">
            ${tpl.body}
          </td>
        </tr>
        <tr>
          <td style="padding:16px 24px;background:#f8fafc;border-top:1px solid #e2e8f0">
            <div style="font-size:12px;color:#64748b;line-height:1.5">
              Questions? Contact ${escapeHtml(d.businessName)}<br/>
              ${escapeHtml(d.businessPhone)} &middot; <a href="mailto:${escapeHtml(d.businessEmail)}" style="color:${escapeHtml(brand)};text-decoration:none">${escapeHtml(d.businessEmail)}</a>
            </div>
          </td>
        </tr>
      </table>
      <p style="font-size:11px;color:#94a3b8;margin:16px 0 0">Sent via QuoteMate</p>
    </td></tr>
  </table>
</body>
</html>`

  const text = `${tpl.heading} — ${d.jobNumber}

Hi ${d.customerName},

${d.businessName} has an update on your job at ${d.jobSiteAddress}.
${dateStrSafe(d.scheduledStart)}${d.note ? `\n\n${d.note}` : ''}

Questions? Contact ${d.businessName}
${d.businessPhone}
${d.businessEmail}

Sent via QuoteMate`

  return { subject: tpl.subject, html, text }
}

function dateStrSafe(s: string | null): string {
  if (!s) return ''
  try {
    return `\nScheduled: ${formatDateAEST(s, { dateStyle: 'long' })}`
  } catch (_) {
    return ''
  }
}
