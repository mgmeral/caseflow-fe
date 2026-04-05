import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockGet = vi.fn()

vi.mock('@/services/api.client', () => ({
  apiClient: {
    get: mockGet,
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

const { reportService } = await import('@/services/report.service')

describe('reportService', () => {
  beforeEach(() => {
    mockGet.mockReset()
  })

  it('loads the customer report from the backend', async () => {
    mockGet.mockResolvedValueOnce({
      totalCount: 12,
      openCount: 5,
      closedCount: 3,
      resolvedCount: 4,
      newCount: 2,
      inProgressCount: 2,
      waitingCustomerCount: 1,
      reopenedCount: 0,
      byTag: [
        { tagId: 'vip', tagCode: 'VIP', tagName: 'VIP', tagColor: '#ef4444', count: 3 },
      ],
    })

    const result = await reportService.getCustomerReport('c1')

    expect(mockGet).toHaveBeenCalledWith('/customers/c1/reports/tickets')
    expect(result.totalCount).toBe(12)
    expect(result.byTag[0]).toMatchObject({ tagId: 'vip', tagName: 'VIP', count: 3 })
  })

  it('passes optional date filters to the customer report route', async () => {
    mockGet.mockResolvedValueOnce({
      totalCount: 0,
      openCount: 0,
      closedCount: 0,
      resolvedCount: 0,
      newCount: 0,
      inProgressCount: 0,
      waitingCustomerCount: 0,
      reopenedCount: 0,
      byTag: [],
    })

    await reportService.getCustomerReport('c1', {
      from: '2026-04-01',
      to: '2026-04-30',
    })

    expect(mockGet).toHaveBeenCalledWith('/customers/c1/reports/tickets?from=2026-04-01&to=2026-04-30')
  })

  it('loads paged admin aggregate report data from the backend', async () => {
    mockGet.mockResolvedValueOnce({
      items: [
        {
          customerId: 'c1',
          customerName: 'Acme',
          totalCount: 10,
          openCount: 4,
          closedCount: 2,
          resolvedCount: 4,
          waitingCustomerCount: 1,
          byTag: [],
        },
      ],
      page: 0,
      size: 20,
      totalElements: 1,
      totalPages: 1,
    })

    const result = await reportService.getAdminAggregateReport(0, 20)

    expect(mockGet).toHaveBeenCalledWith('/admin/reports/customers/tickets?page=0&size=20')
    expect(result.items[0]).toMatchObject({ customerId: 'c1', customerName: 'Acme', totalCount: 10 })
    expect(result.totalPages).toBe(1)
  })
})