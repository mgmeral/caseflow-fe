import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockGet = vi.fn()
const mockPost = vi.fn()
const mockPut = vi.fn()
const mockPatch = vi.fn()
const mockDelete = vi.fn()

vi.mock('@/services/api.client', () => ({
  apiClient: {
    get: mockGet,
    post: mockPost,
    put: mockPut,
    patch: mockPatch,
    delete: mockDelete,
  },
}))

const { tagService } = await import('@/services/tag.service')

describe('tagService', () => {
  beforeEach(() => {
    mockGet.mockReset()
    mockPost.mockReset()
    mockPut.mockReset()
    mockPatch.mockReset()
    mockDelete.mockReset()
  })

  it('loads active tags from GET /tags', async () => {
    mockGet.mockResolvedValueOnce([{ id: 1, code: 'VIP', name: 'VIP', color: '#ef4444', isActive: true }])

    const result = await tagService.listActiveTags()

    expect(mockGet).toHaveBeenCalledWith('/tags')
    expect(result[0]).toMatchObject({ id: '1', code: 'VIP', name: 'VIP', isActive: true })
  })

  it('loads all tags from GET /tags/all', async () => {
    mockGet.mockResolvedValueOnce([{ id: 2, code: 'ARCHIVE', name: 'Archive', color: null, isActive: false }])

    const result = await tagService.listAllTags()

    expect(mockGet).toHaveBeenCalledWith('/tags/all')
    expect(result[0]).toMatchObject({ id: '2', code: 'ARCHIVE', isActive: false })
  })

  it('creates a tag with POST /tags', async () => {
    mockPost.mockResolvedValueOnce({ id: 3, code: 'ESC', name: 'Escalated', color: '#f59e0b', isActive: true })

    await tagService.create({ code: 'ESC', name: 'Escalated', color: '#f59e0b', isActive: true })

    expect(mockPost).toHaveBeenCalledWith('/tags', { code: 'ESC', name: 'Escalated', color: '#f59e0b', isActive: true })
  })

  it('updates a tag with PUT /tags/{id}', async () => {
    mockPut.mockResolvedValueOnce({ id: 3, code: 'ESC', name: 'Escalated+', color: null, isActive: true })

    await tagService.update('3', { code: 'ESC', name: 'Escalated+', color: null, isActive: true })

    expect(mockPut).toHaveBeenCalledWith('/tags/3', { code: 'ESC', name: 'Escalated+', color: null, isActive: true })
  })

  it('activates and deactivates tags with PATCH endpoints', async () => {
    mockPatch.mockResolvedValue({ id: 3, code: 'ESC', name: 'Escalated', color: null, isActive: true })

    await tagService.activateTag('3')
    await tagService.deactivateTag('3')

    expect(mockPatch).toHaveBeenNthCalledWith(1, '/tags/3/activate', {})
    expect(mockPatch).toHaveBeenNthCalledWith(2, '/tags/3/deactivate', {})
  })

  it('loads ticket tag assignments from GET /tickets/{ticketId}/tags', async () => {
    mockGet.mockResolvedValueOnce([
      {
        id: 'tt1',
        ticketId: 't1',
        tagId: '2',
        taggedAt: '2026-04-05T10:00:00Z',
        taggedBy: 'u1',
        taggedByName: 'Agent One',
        tagCode: 'ESC',
        tagName: 'Escalated',
        tagColor: '#f59e0b',
      },
    ])

    const result = await tagService.listTicketTags('t1')

    expect(mockGet).toHaveBeenCalledWith('/tickets/t1/tags')
    expect(result[0]).toMatchObject({ ticketId: 't1', tagId: '2', taggedByName: 'Agent One', tagCode: 'ESC', tagName: 'Escalated' })
    expect(result[0]?.tag).toMatchObject({ id: '2', code: 'ESC', name: 'Escalated' })
  })

  it('adds and removes ticket tags with POST/DELETE ticket routes', async () => {
    mockPost.mockResolvedValueOnce({
      id: 'tt2',
      ticketId: 't1',
      tagId: '5',
      taggedAt: '2026-04-05T10:30:00Z',
      taggedBy: 'u1',
      tagCode: 'VIP',
      tagName: 'VIP',
      tagColor: '#ef4444',
    })
    mockDelete.mockResolvedValueOnce(undefined)

    const result = await tagService.addTagToTicket('t1', '5')
    await tagService.removeTagFromTicket('t1', '5')

    expect(mockPost).toHaveBeenCalledWith('/tickets/t1/tags/5', {})
    expect(mockDelete).toHaveBeenCalledWith('/tickets/t1/tags/5')
    expect(result).toMatchObject({ tagId: '5', tagCode: 'VIP', tagName: 'VIP' })
  })
})