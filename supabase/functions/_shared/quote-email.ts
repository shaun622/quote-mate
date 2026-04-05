import { formatAUD, formatDateAEST, escapeHtml } from './format.ts'

export interface QuoteEmailData {
  quoteNumber: string
  customerName: string
  jobSiteAddress: string
  subtotal: number
  gst: number
  total: number
  validUntil: string | null
  scopeOfWork: string | null
  businessName: string
  businessPhone: string
  businessEmail: string
  brandColor: string
  logoUrl: string | null
  quoteUrl: string
}

export function buildQuoteEmail(d: QuoteEmailData): { subject: string; html: string; text: string } {
  const subject = `Quote from ${d.businessName} — ${d.quoteNumber}`
  const brand = d.brandColor || '#1E3A5F'
  const validUntilStr = d.validUntil
    ? formatDateAEST(d.validUntil, { dateStyle: 'long' })
    : null

  const logoBlock = d.logoUrl
    ? `<img src="${escapeHtml(d.logoUrl)}" alt="${escapeHtml(d.businessName)}" style="max-height:48px;max-width:180px;display:block;margin-bottom:12px" />`
    : `<div style="font-size:22px;font-weight:700;color:#ffffff;margin-bottom:4px">${escapeHtml(d.businessName)}</div>`

  const scopeBlock = d.scopeOfWork
    ? `<tr><td style="padding:20px 24px 0">
        <div style="font-size:12px;text-transform:uppercase;letter-spacing:0.5px;color:#64748b;margin-bottom:6px">Scope of work</div>
        <div style="font-size:14px;color:#334155;line-height:1.5;white-space:pre-wrap">${escapeHtml(d.scopeOfWork)}</div>
      </td></tr>`
    : ''

  const validityBlock = validUntilStr
    ? `<p style="margin:8px 0 0;font-size:12px;color:#64748b">Valid until ${escapeHtml(validUntilStr)}</p>`
    : ''

  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0f172a">
  <div style="display:none;max-height:0;overflow:hidden">Quote ${escapeHtml(d.quoteNumber)} from ${escapeHtml(d.businessName)} for ${escapeHtml(d.jobSiteAddress)}. Total ${formatAUD(d.total)} inc GST.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:24px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06)">
        <tr>
          <td style="background:${escapeHtml(brand)};padding:24px">
            ${logoBlock}
            <div style="font-size:13px;color:rgba(255,255,255,0.85)">Quote ${escapeHtml(d.quoteNumber)}</div>
          </td>
        </tr>
        <tr>
          <td style="padding:24px">
            <p style="margin:0 0 8px;font-size:16px">Hi ${escapeHtml(d.customerName)},</p>
            <p style="margin:0 0 16px;font-size:15px;line-height:1.5;color:#334155">
              ${escapeHtml(d.businessName)} has prepared a quote for work at <strong>${escapeHtml(d.jobSiteAddress)}</strong>.
            </p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:8px;padding:16px;margin:16px 0">
              <tr>
                <td style="font-size:13px;color:#64748b;padding:4px 0">Subtotal (ex GST)</td>
                <td align="right" style="font-size:13px;color:#0f172a;padding:4px 0">${formatAUD(d.subtotal)}</td>
              </tr>
              <tr>
                <td style="font-size:13px;color:#64748b;padding:4px 0">GST (10%)</td>
                <td align="right" style="font-size:13px;color:#0f172a;padding:4px 0">${formatAUD(d.gst)}</td>
              </tr>
              <tr>
                <td style="font-size:15px;color:#0f172a;font-weight:700;padding:8px 0 0;border-top:1px solid #e2e8f0">Total (inc GST)</td>
                <td align="right" style="font-size:15px;color:#0f172a;font-weight:700;padding:8px 0 0;border-top:1px solid #e2e8f0">${formatAUD(d.total)}</td>
              </tr>
            </table>
          </td>
        </tr>
        ${scopeBlock}
        <tr>
          <td align="center" style="padding:8px 24px 24px">
            <a href="${escapeHtml(d.quoteUrl)}" style="display:inline-block;background:${escapeHtml(brand)};color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:14px 28px;border-radius:8px">View & respond to quote</a>
            ${validityBlock}
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

  const text = `Hi ${d.customerName},

${d.businessName} has prepared quote ${d.quoteNumber} for work at ${d.jobSiteAddress}.

Subtotal: ${formatAUD(d.subtotal)}
GST: ${formatAUD(d.gst)}
Total (inc GST): ${formatAUD(d.total)}
${validUntilStr ? `\nValid until: ${validUntilStr}\n` : ''}
View and respond to your quote: ${d.quoteUrl}

Questions? Contact ${d.businessName}
${d.businessPhone}
${d.businessEmail}

Sent via QuoteMate`

  return { subject, html, text }
}
