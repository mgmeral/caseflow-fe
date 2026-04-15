import { describe, expect, it } from 'vitest'
import { reportPdfUtils } from '@/lib/reportPdf'

describe('reportPdfUtils', () => {
  it('builds aggregate status segments without zero values', () => {
    expect(reportPdfUtils.buildAggregateSegments({
      total: 20,
      open: 7,
      resolved: 8,
      waitingCustomer: 5,
      closed: 0,
    })).toEqual([
      expect.objectContaining({ label: 'Open', value: 7 }),
      expect.objectContaining({ label: 'Resolved', value: 8 }),
      expect.objectContaining({ label: 'Waiting Customer', value: 5 }),
    ])
  })

  it('builds customer status segments without zero values', () => {
    expect(reportPdfUtils.buildCustomerSegments({
      totalCount: 12,
      openCount: 5,
      closedCount: 0,
      resolvedCount: 4,
      newCount: 2,
      inProgressCount: 2,
      waitingCustomerCount: 1,
      reopenedCount: 0,
      byTag: [],
    })).toEqual([
      expect.objectContaining({ label: 'Open', value: 5 }),
      expect.objectContaining({ label: 'Resolved', value: 4 }),
      expect.objectContaining({ label: 'Waiting Customer', value: 1 }),
    ])
  })

  it('builds tag segments with backend colors preserved', () => {
    expect(reportPdfUtils.buildTagSegments({
      totalCount: 12,
      openCount: 5,
      closedCount: 0,
      resolvedCount: 4,
      newCount: 2,
      inProgressCount: 2,
      waitingCustomerCount: 1,
      reopenedCount: 0,
      byTag: [
        { tagId: 'vip', tagCode: 'VIP', tagName: 'VIP', tagColor: '#ef4444', count: 3 },
        { tagId: 'ops', tagCode: 'OPS', tagName: 'Ops', tagColor: null, count: 2 },
      ],
    })).toEqual([
      expect.objectContaining({ label: 'VIP', value: 3, color: '#ef4444' }),
      expect.objectContaining({ label: 'Ops', value: 2 }),
    ])
  })

  it('builds a deterministic export file name', () => {
    expect(reportPdfUtils.buildFileName('Customer Aggregate Report', {
      preset: 'last7',
      dateFrom: '2026-04-04',
      dateTo: '2026-04-10',
    })).toMatch(/^customer-aggregate-report-last7-\d{4}-\d{2}-\d{2}\.pdf$/)
  })
})