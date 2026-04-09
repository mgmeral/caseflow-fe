import { describe, expect, it, vi } from 'vitest'
import { normalizeTicket } from '@/services/normalizers'

describe('normalizeTicket', () => {
  it('falls back to createdAt for open duration when backend value is missing', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-07T12:00:00Z'))

    const ticket = normalizeTicket({
      id: 1,
      subject: 'Age fallback',
      customerId: 1,
      customerName: 'Acme',
      assignedGroupId: 1,
      assignedGroupName: 'Tier 1',
      status: 'ASSIGNED',
      priority: 'HIGH',
      createdAt: '2026-04-07T11:00:00Z',
      updatedAt: '2026-04-07T11:30:00Z',
    })

    expect(ticket.openDurationMinutes).toBe(60)
    vi.useRealTimers()
  })
})
