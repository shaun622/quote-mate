import { supabase } from './supabase.js'

/**
 * Send a quote to its customer via email (invokes send-quote Edge Function).
 * Returns { ok, email_id, quote_url } on success, throws on failure.
 */
export async function sendQuoteEmail(quoteId) {
  const { data, error } = await supabase.functions.invoke('send-quote', {
    body: { quote_id: quoteId }
  })
  if (error) throw new Error(error.message || 'Failed to send quote')
  if (data?.error) throw new Error(data.error)
  return data
}
