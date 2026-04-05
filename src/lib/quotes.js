import { supabase } from './supabase.js'

/**
 * Send a quote to its customer via email (invokes send-quote Edge Function).
 * Returns { ok, email_id, quote_url } on success, throws with detail on failure.
 */
export async function sendQuoteEmail(quoteId) {
  const { data, error } = await supabase.functions.invoke('send-quote', {
    body: { quote_id: quoteId }
  })
  if (error) {
    // supabase-js wraps non-2xx as FunctionsHttpError. The real error is in the body.
    let detail = error.message || 'Failed to send quote'
    try {
      if (error.context?.json) {
        const body = await error.context.json()
        if (body?.error) detail = body.error
      } else if (error.context?.text) {
        const txt = await error.context.text()
        if (txt) detail = txt
      }
    } catch (_) {
      /* ignore parse errors */
    }
    throw new Error(detail)
  }
  if (data?.error) throw new Error(data.error)
  return data
}
