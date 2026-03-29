import { describe, it, expect, vi, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => ({
  post: vi.fn(async () => ({ id: 1 })),
  put: vi.fn(async () => ({ id: 1 })),
}))

vi.mock('@/lib/env', () => ({ USE_MOCKS: false }))
vi.mock('@/services/api.client', () => ({
  apiClient: {
    get: vi.fn(),
    post: mocks.post,
    put: mocks.put,
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))
vi.mock('@/services/normalizers', () => ({
  normalizeUser: (raw: unknown) => raw,
}))

const { userService } = await import('@/services/user.service')

describe('userService payload contract', () => {
  beforeEach(() => {
    mocks.post.mockClear()
    mocks.put.mockClear()
  })

  it('create sends roleId payload (not role string)', async () => {
    await userService.create({
      username: 'john.doe',
      email: 'john.doe@example.com',
      fullName: 'John Doe',
      password: 'Passw0rd!',
      roleId: 42,
      groupIds: [1, 2],
      isActive: true,
    })

    expect(mocks.post).toHaveBeenCalledWith('/users', {
      username: 'john.doe',
      email: 'john.doe@example.com',
      fullName: 'John Doe',
      password: 'Passw0rd!',
      roleId: 42,
      groupIds: [1, 2],
      isActive: true,
    })

    const postCalls = mocks.post.mock.calls as unknown as Array<unknown[]>
    const body = (postCalls[0]?.[1] ?? {}) as Record<string, unknown>
    expect(body.role).toBeUndefined()
  })

  it('update sends roleId payload (not role string)', async () => {
    await userService.update('7', {
      username: 'john.doe',
      email: 'john.doe@example.com',
      fullName: 'John Doe',
      roleId: 42,
      groupIds: [1],
      isActive: false,
      password: 'optional',
    })

    expect(mocks.put).toHaveBeenCalledWith('/users/7', {
      username: 'john.doe',
      email: 'john.doe@example.com',
      fullName: 'John Doe',
      roleId: 42,
      groupIds: [1],
      isActive: false,
      password: 'optional',
    })

    const putCalls = mocks.put.mock.calls as unknown as Array<unknown[]>
    const body = (putCalls[0]?.[1] ?? {}) as Record<string, unknown>
    expect(body.role).toBeUndefined()
  })
})
