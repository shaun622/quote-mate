// Format AUD currency
export function formatAUD(amount) {
  const num = Number(amount || 0)
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 2
  }).format(num)
}

// Calculate GST (10%) and totals for an array of line items
export function calcTotals(items) {
  const subtotal = items.reduce((sum, i) => {
    const qty = Number(i.quantity || 0)
    const price = Number(i.unit_price || 0)
    return sum + qty * price
  }, 0)
  const gst = Math.round(subtotal * 0.1 * 100) / 100
  const total = Math.round((subtotal + gst) * 100) / 100
  return { subtotal: Math.round(subtotal * 100) / 100, gst, total }
}

// Format a date in AEST
export function formatDateAEST(date, opts = { dateStyle: 'medium' }) {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-AU', {
    ...opts,
    timeZone: 'Australia/Sydney'
  }).format(d)
}

// Generate a URL-safe token
export function generateToken(length = 24) {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(36).padStart(2, '0'))
    .join('')
    .slice(0, length)
}

// Pad a number like 0001
export function padNumber(n, width = 4) {
  return String(n).padStart(width, '0')
}

// Simple class name joiner
export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}
