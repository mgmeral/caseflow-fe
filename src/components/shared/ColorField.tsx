import { clsx } from 'clsx'

const COLOR_PRESETS = [
  '#0d5ac9',
  '#1d4ed8',
  '#0f766e',
  '#059669',
  '#65a30d',
  '#c2410c',
  '#dc2626',
  '#be185d',
  '#7c3aed',
  '#475569',
] as const

function normalizeHexColor(value: string): string {
  const trimmed = value.trim().toLowerCase()
  if (!trimmed) return ''

  const withHash = trimmed.startsWith('#') ? trimmed : `#${trimmed}`
  const shortHexMatch = withHash.match(/^#([0-9a-f]{3})$/i)
  if (shortHexMatch) {
    const [, shortHex] = shortHexMatch
    return `#${shortHex.split('').map((character) => `${character}${character}`).join('')}`
  }

  return /^#[0-9a-f]{6}$/i.test(withHash) ? withHash : ''
}

interface ColorFieldProps {
  value: string
  onChange: (value: string) => void
  label?: string
  helperText?: string
}

export function ColorField({ value, onChange, label = 'Color', helperText }: ColorFieldProps) {
  const normalizedValue = normalizeHexColor(value)
  const hasCustomValue = Boolean(normalizedValue && !COLOR_PRESETS.includes(normalizedValue as typeof COLOR_PRESETS[number]))
  const isInvalid = Boolean(value.trim()) && !normalizedValue

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
        <p className="text-xs text-gray-500">
          {helperText ?? 'Choose a curated accent or enter a custom hex value. Leave empty if no color should be applied.'}
        </p>
      </div>

      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Customer color palette">
        <button
          type="button"
          onClick={() => onChange('')}
          className={clsx(
            'inline-flex items-center rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors',
            !normalizedValue ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300',
          )}
        >
          No color
        </button>
        {COLOR_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            aria-label={`Select ${preset}`}
            onClick={() => onChange(preset)}
            className={clsx(
              'h-8 w-8 rounded-full border-2 transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1',
              normalizedValue === preset ? 'border-gray-900' : 'border-white shadow-sm',
            )}
            style={{ backgroundColor: preset }}
          />
        ))}
      </div>

      <div className="grid grid-cols-[auto,1fr] gap-3 items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
        <span
          className="h-8 w-8 rounded-full border border-gray-200 bg-white"
          style={{ backgroundColor: normalizedValue || '#ffffff' }}
          aria-hidden="true"
        />
        <div>
          <label htmlFor="customer-color-hex" className="block text-xs font-medium text-gray-600 mb-1">Custom Hex</label>
          <input
            id="customer-color-hex"
            value={hasCustomValue ? normalizedValue : value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="#0d5ac9"
            className={clsx(
              'w-full border rounded-lg px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500',
              isInvalid ? 'border-red-300 text-red-700' : 'border-gray-300',
            )}
          />
        </div>
      </div>

      {isInvalid ? <p className="text-xs text-red-600">Enter a valid hex color like #0d5ac9.</p> : null}
    </div>
  )
}

export function normalizeOptionalHexColor(value: string): string | null {
  return normalizeHexColor(value) || null
}