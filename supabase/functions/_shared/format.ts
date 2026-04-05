// AUD currency formatter for Edge Functions (Deno)
export function formatAUD(amount: number | string | null | undefined): string {
  const n = Number(amount || 0)
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 2
  }).format(n)
}

export function formatDateAEST(
  date: string | Date | null | undefined,
  opts: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }
): string {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-AU', {
    ...opts,
    timeZone: 'Australia/Sydney'
  }).format(d)
}

export function escapeHtml(s: string | null | undefined): string {
  if (!s) return ''
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
