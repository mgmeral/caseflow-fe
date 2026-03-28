/**
 * Transfer service — aligned to CaseFlow API v2.0.0 /api/transfers endpoints.
 */
import type { TransferRecord } from '@/types/ticket.types'
import type { TransferResponse, TransferListItem, TransferTicketRequest } from '@/types/api.types'
import { apiClient } from './api.client'
import { USE_MOCKS } from '@/lib/env'
import { mockTransferRecords, getMockDelay } from '@/mock'

export type { TransferTicketRequest }

// ---------------------------------------------------------------------------
// Helper: map POST /transfers response → TransferRecord view model
// Spec POST response: { id, ticketId, fromGroupId, toGroupId, transferredBy, transferredAt, reason }
// ---------------------------------------------------------------------------

function toTransferRecord(t: TransferResponse): TransferRecord {
  return {
    id: t.id,
    ticketId: String(t.ticketId),
    fromGroupId: String(t.fromGroupId),
    fromGroupName: '',
    toGroupId: String(t.toGroupId),
    toGroupName: '',
    transferredByName: t.transferredBy ?? '',
    reason: t.reason ?? '',
    note: null,
    createdAt: t.transferredAt,
  }
}

// Helper: map GET /transfers/by-ticket response item → TransferRecord view model
// Spec GET list: { id, ticketId, fromGroupId, toGroupId, transferredAt }
function toTransferRecordFromListItem(t: TransferListItem): TransferRecord {
  return {
    id: t.id,
    ticketId: String(t.ticketId),
    fromGroupId: String(t.fromGroupId),
    fromGroupName: '',
    toGroupId: String(t.toGroupId),
    toGroupName: '',
    transferredByName: '',
    reason: '',
    note: null,
    createdAt: t.transferredAt,
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
      fromGroupId: req.fromGroupId,
      fromGroupName: req.fromGroupId,
      toGroupId: req.toGroupId,
      toGroupName: req.toGroupId,
      transferredByName: 'System',
      reason: req.reason ?? '',
      note: null,
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
    const res = await apiClient.get<TransferListItem[]>(`/transfers/by-ticket/${ticketId}`)
    return res.map(toTransferRecordFromListItem).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  },

  create: async (req: TransferTicketRequest): Promise<TransferRecord> => {
    const body = {
      ticketId: Number(req.ticketId),
      fromGroupId: Number(req.fromGroupId),
      toGroupId: Number(req.toGroupId),
      ...(req.reason !== undefined ? { reason: req.reason } : {}),
      ...(req.clearAssignee !== undefined ? { clearAssignee: req.clearAssignee } : {}),
    }
    const res = await apiClient.post<TransferResponse>('/transfers', body)
    return toTransferRecord(res)
  },
}

export const transferService = USE_MOCKS ? mockService : realService
