import { useParams } from 'react-router-dom'

export default function CustomerQuoteView() {
  const { token } = useParams()
  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-2xl mx-auto card mt-8">
        <h1 className="text-2xl font-bold text-brand">Quote</h1>
        <p className="text-sm text-slate-500 mt-2">Token: {token}</p>
        <p className="text-slate-600 mt-4">Customer quote view — coming next.</p>
      </div>
    </div>
  )
}
