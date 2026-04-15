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
        <label className="ui-label normal-case tracking-[0.04em]">{label}</label>
        <p className="ui-hint">
          {helperText ?? 'Choose a curated accent or enter a custom hex value. Leave empty if no color should be applied.'}
        </p>
      </div>

      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Customer color palette">
        <button
          type="button"
          onClick={() => onChange('')}
          className={clsx(
            'inline-flex items-center rounded-xl border px-3 py-2 text-xs font-semibold transition-all duration-200',
            !normalizedValue ? 'border-indigo-300 bg-indigo-50 text-indigo-800 shadow-soft' : 'border-slate-200 bg-white/80 text-slate-600 hover:-translate-y-[1px] hover:border-slate-300 hover:bg-white',
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
              'h-9 w-9 rounded-full border-[3px] transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-500/15 focus:ring-offset-0',
              normalizedValue === preset ? 'border-slate-900 shadow-card' : 'border-white/80 shadow-soft',
            )}
            style={{ backgroundColor: preset }}
          />
        ))}
      </div>

      <div className="surface-section grid grid-cols-[auto,1fr] items-center gap-3 px-3 py-3">
        <span
          className="h-9 w-9 rounded-full border border-white/90 bg-white shadow-soft"
          style={{ backgroundColor: normalizedValue || '#ffffff' }}
          aria-hidden="true"
        />
        <div>
          <label htmlFor="customer-color-hex" className="ui-label normal-case tracking-[0.04em]">Custom Hex</label>
          <input
            id="customer-color-hex"
            value={hasCustomValue ? normalizedValue : value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="#0d5ac9"
            className={clsx(
              'ui-input font-mono uppercase',
              isInvalid && 'border-red-300 text-red-700 focus:ring-red-500/15',
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