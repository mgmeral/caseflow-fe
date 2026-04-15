import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { CalendarRange } from 'lucide-react'
import { clsx } from 'clsx'
import {
  buildReportDateRange,
  DEFAULT_REPORT_DATE_PRESET,
  formatReportDateRangeLabel,
  type ReportDatePreset,
  type ReportDateRange,
  validateCustomReportDateRange,
} from '@/lib/reportDateRange'

interface ReportDateFilterProps {
  value: ReportDateRange
  onChange: (nextValue: ReportDateRange) => void
  compact?: boolean
  disabled?: boolean
  actions?: ReactNode
}

const PRESET_OPTIONS: Array<{ value: ReportDatePreset; label: string }> = [
  { value: 'today', label: 'Today' },
  { value: 'last7', label: 'Last 7 days' },
  { value: 'last30', label: 'Last 30 days' },
  { value: 'thisMonth', label: 'This month' },
  { value: 'custom', label: 'Custom range' },
  { value: 'allTime', label: 'All time' },
]

export function ReportDateFilter({ value, onChange, compact = false, disabled = false, actions }: ReportDateFilterProps) {
  const [draftFrom, setDraftFrom] = useState(value.dateFrom ?? '')
  const [draftTo, setDraftTo] = useState(value.dateTo ?? '')

  useEffect(() => {
    setDraftFrom(value.dateFrom ?? '')
    setDraftTo(value.dateTo ?? '')
  }, [value.dateFrom, value.dateTo, value.preset])

  const customValidationMessage = useMemo(() => {
    if (value.preset !== 'custom') return null
    if (!draftFrom && !draftTo) return null
    return validateCustomReportDateRange(draftFrom || null, draftTo || null)
  }, [draftFrom, draftTo, value.preset])

  const handlePresetChange = (preset: ReportDatePreset) => {
    if (preset === 'custom') {
      const defaultRange = buildReportDateRange(DEFAULT_REPORT_DATE_PRESET)
      const fallbackRange = value.dateFrom && value.dateTo
        ? { preset: 'custom' as const, dateFrom: value.dateFrom, dateTo: value.dateTo }
        : {
            preset: 'custom' as const,
            dateFrom: defaultRange.dateFrom,
            dateTo: defaultRange.dateTo,
          }
      setDraftFrom(fallbackRange.dateFrom ?? '')
      setDraftTo(fallbackRange.dateTo ?? '')
      onChange(fallbackRange)
      return
    }

    onChange(buildReportDateRange(preset))
  }

  const handleCustomDraftChange = (nextFrom: string, nextTo: string) => {
    setDraftFrom(nextFrom)
    setDraftTo(nextTo)

    const validationMessage = validateCustomReportDateRange(nextFrom || null, nextTo || null)
    if (!validationMessage) {
      onChange({
        preset: 'custom',
        dateFrom: nextFrom,
        dateTo: nextTo,
      })
    }
  }

  return (
    <div className={clsx(compact ? 'surface-section px-3 py-3' : 'surface-card px-4 py-4')}>
      <div className={clsx('flex gap-3', compact ? 'flex-col' : 'flex-col xl:flex-row xl:items-start xl:justify-between')}>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <CalendarRange className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-semibold text-slate-900">Date Range</span>
              </div>
              <p className="mt-2 text-sm text-slate-600">{formatReportDateRangeLabel(value)}. Default stays controlled, but all-time remains available when needed.</p>
            </div>
            {actions ? <div className="shrink-0">{actions}</div> : null}
          </div>
        </div>

        {compact ? (
          <div className="grid gap-3 md:grid-cols-[minmax(190px,220px)_1fr] md:items-start">
            <select
              aria-label="Report date preset"
              value={value.preset}
              onChange={(event) => handlePresetChange(event.target.value as ReportDatePreset)}
              className="ui-select"
              disabled={disabled}
            >
              {PRESET_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            {value.preset === 'custom' ? (
              <div className="grid gap-3 md:grid-cols-2">
                <label className="block">
                  <span className="ui-label normal-case tracking-[0.04em]">From</span>
                  <input
                    type="date"
                    value={draftFrom}
                    onChange={(event) => handleCustomDraftChange(event.target.value, draftTo)}
                    className="ui-input"
                    disabled={disabled}
                  />
                </label>
                <label className="block">
                  <span className="ui-label normal-case tracking-[0.04em]">To</span>
                  <input
                    type="date"
                    value={draftTo}
                    onChange={(event) => handleCustomDraftChange(draftFrom, event.target.value)}
                    className="ui-input"
                    disabled={disabled}
                  />
                </label>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="space-y-3 xl:max-w-[46rem] xl:items-end">
            <div className="flex flex-wrap gap-2">
              {PRESET_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handlePresetChange(option.value)}
                  disabled={disabled}
                  className={clsx(
                    'rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-all duration-200',
                    value.preset === option.value
                      ? 'border-[#b7d0ff] bg-[#edf4ff] text-[#1258e3] shadow-soft'
                      : 'border-slate-200 bg-white/80 text-slate-600 hover:border-[#c7d8f3] hover:bg-white',
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {value.preset === 'custom' ? (
              <div className="grid gap-3 md:grid-cols-2">
                <label className="block">
                  <span className="ui-label normal-case tracking-[0.04em]">From</span>
                  <input
                    type="date"
                    value={draftFrom}
                    onChange={(event) => handleCustomDraftChange(event.target.value, draftTo)}
                    className="ui-input"
                    disabled={disabled}
                  />
                </label>
                <label className="block">
                  <span className="ui-label normal-case tracking-[0.04em]">To</span>
                  <input
                    type="date"
                    value={draftTo}
                    onChange={(event) => handleCustomDraftChange(draftFrom, event.target.value)}
                    className="ui-input"
                    disabled={disabled}
                  />
                </label>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {customValidationMessage ? (
        <div className="mt-3 rounded-xl border border-amber-200/80 bg-amber-50/90 px-3 py-2.5 text-[12px] text-amber-900">
          {customValidationMessage}
        </div>
      ) : null}
    </div>
  )
}