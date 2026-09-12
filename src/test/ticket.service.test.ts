import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockGet = vi.fn()
const mockPost = vi.fn()

vi.mock('@/services/api.client', () => ({
  apiClient: {
    get: mockGet,
    post: mockPost,
  },
  ApiError: class ApiError extends Error {
    status: number
    code: string

    constructor(status: number, code: string, message: string) {
      super(message)
      this.status = status
      this.code = code
    }
  },
}))

const assignOrReassignSpy = vi.hoisted(() => vi.fn())

vi.mock('@/services/assignment.service', () => ({
  assignmentService: {
    assignOrReassign: assignOrReassignSpy,
  },
}))

const { ticketService } = await import('@/services/ticket.service')

describe('ticketService', () => {
  beforeEach(() => {
    mockGet.mockReset()
    mockPost.mockReset()
    assignOrReassignSpy.mockReset()
  })

  it('sends real backend filter params including openOnly and tag filters', async () => {
    mockGet.mockResolvedValueOnce({ items: [], totalElements: 0 })

    await ticketService.getAll({
      search: 'vip',
      statuses: [],
      priorities: [],
      assignedUserIds: [],
      groupIds: [],
      tagIds: ['7'],
      tagCodes: ['VIP'],
      dateFrom: null,
      dateTo: null,
      unassignedOnly: false,
      overdueOnly: true,
      openOnly: true,
      transferredOnly: false,
    }, { field: 'updatedAt', direction: 'desc' }, 1, 25)

    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('openOnly=true'))
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('overdueOnly=true'))
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('tagId=7'))
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('tagCode=VIP'))
  })

  it('sends slaBreachedOnly=true when slaState is BREACHED', async () => {
    mockGet.mockResolvedValueOnce({ items: [], totalElements: 0 })

    await ticketService.getAll({
      search: '',
      statuses: [],
      priorities: [],
      assignedUserIds: [],
      groupIds: [],
      tagIds: [],
      tagCodes: [],
      dateFrom: null,
      dateTo: null,
      unassignedOnly: false,
      overdueOnly: false,
      openOnly: true,
      transferredOnly: false,
      slaState: 'BREACHED',
    }, { field: 'updatedAt', direction: 'desc' }, 1, 25)

    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('openOnly=true'))
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('slaBreachedOnly=true'))
    expect(mockGet).not.toHaveBeenCalledWith(expect.stringContaining('slaAtRiskOnly=true'))
  })

  it('sends slaAtRiskOnly=true when slaState is AT_RISK', async () => {
    mockGet.mockResolvedValueOnce({ items: [], totalElements: 0 })

    await ticketService.getAll({
      search: '',
      statuses: [],
      priorities: [],
      assignedUserIds: [],
      groupIds: [],
      tagIds: [],
      tagCodes: [],
      dateFrom: null,
      dateTo: null,
      unassignedOnly: false,
      overdueOnly: false,
      openOnly: true,
      transferredOnly: false,
      slaState: 'AT_RISK',
    }, { field: 'updatedAt', direction: 'desc' }, 1, 25)

    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('openOnly=true'))
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('slaAtRiskOnly=true'))
    expect(mockGet).not.toHaveBeenCalledWith(expect.stringContaining('slaBreachedOnly=true'))
  })

  it('preserves the current group in assignment payloads', async () => {
    assignOrReassignSpy.mockResolvedValueOnce({ id: 'a1' })
    mockGet.mockResolvedValueOnce({
      id: 't1',
      ticketNo: 'TK-1',
      subject: 'Issue',
      customerId: 'c1',
      customerName: 'Acme',
      assignedGroupId: 'g1',
      assignedGroupName: 'Tier 1',
      assignedUserId: 'u2',
      assignedUserName: 'Agent',
      status: 'ASSIGNED',
      priority: 'MEDIUM',
      createdAt: '2026-04-01T00:00:00Z',
      updatedAt: '2026-04-01T01:00:00Z',
    })

    await ticketService.assign('t1', 'u2', 'Agent', 'g1')

    expect(assignOrReassignSpy).toHaveBeenCalledWith({
      ticketId: 't1',
      assignedUserId: 'u2',
      assignedGroupId: 'g1',
    })
  })
})