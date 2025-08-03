import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { cacheUtils } from './cacheUtils'

describe('cacheUtils', () => {
  let cache: Map<string, { timestamp: number }>
  const ttl = 1000 // 1 second TTL
  let now: number

  beforeEach(() => {
    cache = new Map()
    now = Date.now()
    vi.spyOn(Date, 'now').mockReturnValue(now)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should remove entries older than ttl', () => {
    cache.set('a', { timestamp: now - (ttl + 1) }) // expired
    cache.set('b', { timestamp: now - (ttl - 1) }) // valid
    const cleanCache = cacheUtils(cache, ttl)
    cleanCache()
    expect(cache.has('a')).toBe(false)
    expect(cache.has('b')).toBe(true)
  })

  it('should not remove entries within ttl', () => {
    cache.set('a', { timestamp: now })
    cache.set('b', { timestamp: now - (ttl - 10) })
    const cleanCache = cacheUtils(cache, ttl)
    cleanCache()
    expect(cache.has('a')).toBe(true)
    expect(cache.has('b')).toBe(true)
  })

  it('should remove all entries if all are expired', () => {
    cache.set('a', { timestamp: now - (ttl + 100) })
    cache.set('b', { timestamp: now - (ttl + 200) })
    const cleanCache = cacheUtils(cache, ttl)
    cleanCache()
    expect(cache.size).toBe(0)
  })

  it('should do nothing if cache is empty', () => {
    const cleanCache = cacheUtils(cache, ttl)
    cleanCache()
    expect(cache.size).toBe(0)
  })
})
