import { Trash2 } from 'lucide-react'
import { formatAUD } from '../../lib/utils.js'

export default function QuoteItemRow({ item, onChange, onRemove }) {
  const lineTotal =
    Number(item.quantity || 0) * Number(item.unit_price || 0)

  return (
    <div className="card space-y-2 !p-3">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm">{item.name}</div>
          <div className="text-xs text-slate-500">
            {item.category} · {item.unit}
          </div>
        </div>
        <button
          onClick={onRemove}
          className="btn-ghost !min-h-0 !p-2 text-slate-400 hover:text-red-600"
          aria-label="Remove"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-[80px_1fr_auto] gap-2 items-center">
        <div>
          <label className="sr-only">Quantity</label>
          <input
            inputMode="decimal"
            className="input !py-2 !min-h-0 text-sm text-center"
            value={item.quantity}
            onChange={(e) => onChange({ ...item, quantity: e.target.value })}
          />
        </div>
        <div>
          <label className="sr-only">Unit price</label>
          <input
            inputMode="decimal"
            className="input !py-2 !min-h-0 text-sm"
            value={item.unit_price}
            onChange={(e) => onChange({ ...item, unit_price: e.target.value })}
          />
        </div>
        <div className="text-sm font-semibold text-brand min-w-[70px] text-right">
          {formatAUD(lineTotal)}
        </div>
      </div>
    </div>
  )
}
