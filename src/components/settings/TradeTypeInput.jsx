import { useEffect, useState } from 'react'

export const TRADE_TYPES = [
  'Fencing',
  'Retaining Walls',
  'Electrical',
  'Plumbing',
  'Carpentry',
  'Painting',
  'Landscaping',
  'Roofing',
  'Tiling',
  'Concreting',
  'General Building',
  'Other'
]

/**
 * A combined select + custom input for trade type.
 * - If the current value is one of the preset TRADE_TYPES (other than "Other"),
 *   the select is shown and onChange receives that value.
 * - If the select is set to "Other", a text input appears and the entered
 *   string is passed to onChange as the stored value.
 */
export default function TradeTypeInput({ value, onChange }) {
  // Figure out if the current stored value matches a preset.
  const presets = TRADE_TYPES.filter((t) => t !== 'Other')
  const isPreset = presets.includes(value)

  const [selectVal, setSelectVal] = useState(isPreset ? value : 'Other')
  const [customVal, setCustomVal] = useState(isPreset ? '' : value || '')

  // Sync if the external value changes (e.g. form loaded async).
  useEffect(() => {
    if (presets.includes(value)) {
      setSelectVal(value)
      setCustomVal('')
    } else if (value) {
      setSelectVal('Other')
      setCustomVal(value)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  function handleSelect(next) {
    setSelectVal(next)
    if (next === 'Other') {
      // Don't clear custom if they had something typed
      onChange(customVal.trim() || '')
    } else {
      onChange(next)
    }
  }

  function handleCustom(next) {
    setCustomVal(next)
    onChange(next.trim())
  }

  return (
    <>
      <select
        className="input"
        value={selectVal}
        onChange={(e) => handleSelect(e.target.value)}
      >
        {TRADE_TYPES.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
      {selectVal === 'Other' && (
        <input
          className="input mt-2"
          placeholder="Describe your trade"
          value={customVal}
          onChange={(e) => handleCustom(e.target.value)}
          required
        />
      )}
    </>
  )
}
