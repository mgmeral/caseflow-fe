/**
 * Transfer service — aligned to backend /api/transfers endpoints.
 */
import type { TransferRecord } from '@/types/ticket.types'
import type { TransferResponse, TransferTicketRequest } from '@/types/api.types'
import { apiClient } from './api.client'
import { USE_MOCKS } from '@/lib/env'
import { mockTransferRecords, getMockDelay } from '@/mock'

// ---------------------------------------------------------------------------
// Helper: map TransferResponse → TransferRecord view model
// ---------------------------------------------------------------------------

function toTransferRecord(t: TransferResponse): TransferRecord {
  return {
    id: t.id,
    ticketId: t.ticketId,
    fromGroupId: t.fromGroupId,
    fromGroupName: t.fromGroupName,
    toGroupId: t.toGroupId,
    toGroupName: t.toGroupName,
    transferredByName: t.transferredByName,
    reason: t.reason,
    note: t.note,
    createdAt: t.createdAt,
  }
}

// ---------------------------------------------------------------------------
// Mock implementation
// ---------------------------------------------------------------------------

const mockService = {
  getByTicket: async (ticketId: string): Promise<TransferRecord[]> => {
    await getMockDelay()
    return mockTransferRecords
      .filter((r) => r.ticketId === ticketId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  },

  create: async (req: TransferTicketRequest): Promise<TransferRecord> => {
    await getMockDelay()
    const record: TransferRecord = {
      id: `tr-${Date.now()}`,
      ticketId: req.ticketId,
      fromGroupId: '',
      fromGroupName: 'Previous Group',
      toGroupId: req.targetGroupId,
      toGroupName: req.targetGroupId,
      transferredByName: 'System',
      reason: req.reason,
      note: req.note ?? null,
      createdAt: new Date().toISOString(),
    }
    mockTransferRecords.push(record)
    return record
  },
}

// ---------------------------------------------------------------------------
// Real API implementation
// ---------------------------------------------------------------------------

const realService = {
  getByTicket: async (ticketId: string): Promise<TransferRecord[]> => {
    const res = await apiClient.get<TransferResponse[]>(`/transfers/by-ticket/${ticketId}`)
    return res.map(toTransferRecord).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  },

  create: async (req: TransferTicketRequest): Promise<TransferRecord> => {
    const res = await apiClient.post<TransferResponse>('/transfers', req)
    return toTransferRecord(res)
  },
}

export const transferService = USE_MOCKS ? mockService : realService
