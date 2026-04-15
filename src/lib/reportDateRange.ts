import { format, subDays, startOfMonth } from 'date-fns'

export type ReportDatePreset = 'today' | 'last7' | 'last30' | 'thisMonth' | 'custom' | 'allTime'

export interface ReportDateRange {
  preset: ReportDatePreset
  dateFrom: string | null
  dateTo: string | null
}

export const DEFAULT_REPORT_DATE_PRESET: ReportDatePreset = 'last30'

const PRESET_LABELS: Record<Exclude<ReportDatePreset, 'custom'>, string> = {
  today: 'today',
  last7: 'last 7 days',
  last30: 'last 30 days',
  thisMonth: 'this month',
  allTime: 'all time',
}

function toDateInputValue(value: Date) {
  return format(value, 'yyyy-MM-dd')
}

function isKnownPreset(value: string | null): value is ReportDatePreset {
  return value === 'today'
    || value === 'last7'
    || value === 'last30'
    || value === 'thisMonth'
    || value === 'custom'
    || value === 'allTime'
}

export function buildReportDateRange(preset: ReportDatePreset, referenceDate = new Date()): ReportDateRange {
  switch (preset) {
    case 'today': {
      const today = toDateInputValue(referenceDate)
      return { preset, dateFrom: today, dateTo: today }
    }
    case 'last7':
      return {
        preset,
        dateFrom: toDateInputValue(subDays(referenceDate, 6)),
        dateTo: toDateInputValue(referenceDate),
      }
    case 'last30':
      return {
        preset,
        dateFrom: toDateInputValue(subDays(referenceDate, 29)),
        dateTo: toDateInputValue(referenceDate),
      }
    case 'thisMonth':
      return {
        preset,
        dateFrom: toDateInputValue(startOfMonth(referenceDate)),
        dateTo: toDateInputValue(referenceDate),
      }
    case 'allTime':
      return { preset, dateFrom: null, dateTo: null }
    case 'custom':
    default: {
      const fallback = buildReportDateRange(DEFAULT_REPORT_DATE_PRESET, referenceDate)
      return {
        preset: 'custom',
        dateFrom: fallback.dateFrom,
        dateTo: fallback.dateTo,
      }
    }
  }
}

export function validateCustomReportDateRange(dateFrom: string | null, dateTo: string | null): string | null {
  if (!dateFrom || !dateTo) {
    return 'Select both start and end dates.'
  }

  if (dateFrom > dateTo) {
    return 'Start date cannot be after end date.'
  }

  return null
}

export function formatReportDateRangeLabel(range: ReportDateRange): string {
  if (range.preset !== 'custom') {
    return `Showing ${PRESET_LABELS[range.preset]}`
  }

  if (!range.dateFrom || !range.dateTo) {
    return 'Showing custom range'
  }

  return `Showing ${format(new Date(range.dateFrom), 'MMM d, yyyy')} - ${format(new Date(range.dateTo), 'MMM d, yyyy')}`
}

export function parseReportDateRangeSearchParams(searchParams: URLSearchParams): ReportDateRange {
  const preset = searchParams.get('range')
  const dateFrom = searchParams.get('dateFrom')
  const dateTo = searchParams.get('dateTo')

  if (preset === 'custom') {
    return validateCustomReportDateRange(dateFrom, dateTo) === null
      ? { preset: 'custom', dateFrom, dateTo }
      : buildReportDateRange(DEFAULT_REPORT_DATE_PRESET)
  }

  if (dateFrom && dateTo && validateCustomReportDateRange(dateFrom, dateTo) === null && !preset) {
    return { preset: 'custom', dateFrom, dateTo }
  }

  if (isKnownPreset(preset) && preset !== 'custom') {
    return buildReportDateRange(preset)
  }

  return buildReportDateRange(DEFAULT_REPORT_DATE_PRESET)
}

export function applyReportDateRangeSearchParams(searchParams: URLSearchParams, range: ReportDateRange): URLSearchParams {
  const nextParams = new URLSearchParams(searchParams)

  nextParams.set('range', range.preset)

  if (range.dateFrom) {
    nextParams.set('dateFrom', range.dateFrom)
  } else {
    nextParams.delete('dateFrom')
  }

  if (range.dateTo) {
    nextParams.set('dateTo', range.dateTo)
  } else {
    nextParams.delete('dateTo')
  }

  return nextParams
}