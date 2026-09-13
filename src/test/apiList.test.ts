import { describe, expect, it } from 'vitest'
import { toArrayPayload } from '@/lib/apiList'

describe('toArrayPayload', () => {
  it('returns a bare array unchanged', () => {
    expect(toArrayPayload([1, 2, 3])).toEqual([1, 2, 3])
  })

  it('unwraps a PagedResponse-style {items} envelope', () => {
    expect(toArrayPayload({ items: ['a', 'b'], page: 0, size: 20, totalElements: 2, totalPages: 1 })).toEqual(['a', 'b'])
  })

  it('unwraps a Spring Data Page-style {content} envelope', () => {
    expect(toArrayPayload({ content: ['a', 'b'], totalElements: 2 })).toEqual(['a', 'b'])
  })

  it('unwraps a {data} envelope', () => {
    expect(toArrayPayload({ data: ['a'] })).toEqual(['a'])
  })

  it('unwraps a {results} envelope', () => {
    expect(toArrayPayload({ results: ['a'] })).toEqual(['a'])
  })

  it('returns an empty array for null/undefined', () => {
    expect(toArrayPayload(null)).toEqual([])
    expect(toArrayPayload(undefined)).toEqual([])
  })

  it('returns an empty array for a malformed/unknown object shape', () => {
    expect(toArrayPayload({ foo: 'bar' })).toEqual([])
  })

  it('returns an empty array for a primitive', () => {
    expect(toArrayPayload('not an object')).toEqual([])
    expect(toArrayPayload(42)).toEqual([])
  })
})
