// Thin wrapper around the Resend HTTP API.
// Docs: https://resend.com/docs/api-reference/emails/send-email

export interface SendEmailParams {
  from: string
  to: string | string[]
  subject: string
  html: string
  text?: string
  replyTo?: string
}

export async function sendEmail(params: SendEmailParams): Promise<{ id: string }> {
  const apiKey = Deno.env.get('RESEND_API_KEY')
  if (!apiKey) throw new Error('RESEND_API_KEY is not set')

  const body: Record<string, unknown> = {
    from: params.from,
    to: Array.isArray(params.to) ? params.to : [params.to],
    subject: params.subject,
    html: params.html
  }
  if (params.text) body.text = params.text
  if (params.replyTo) body.reply_to = params.replyTo

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Resend API error ${res.status}: ${err}`)
  }

  const data = await res.json()
  return { id: data.id }
}
