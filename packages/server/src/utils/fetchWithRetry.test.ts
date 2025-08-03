import { describe, it, expect, vi, beforeEach } from 'vitest'

import { fetchWithRetry } from './fetchWithRetry'

describe('fetchWithRetry', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns response on first successful attempt', async () => {
    const mockResponse = new Response('ok', { status: 200 })

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse))

    const res = await fetchWithRetry('https://example.com')
    expect(res.status).toBe(200)
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('retries on failure and eventually succeeds', async () => {
    const failResponse = new Response('fail', { status: 500 })
    const successResponse = new Response('ok', { status: 200 })

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce(failResponse).mockResolvedValueOnce(successResponse)
    )

    const res = await fetchWithRetry('https://example.com', {}, 2, 10) // short delay for test
    expect(res.status).toBe(200)
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('throws after all retries fail', async () => {
    const failResponse = new Response('fail', { status: 500 })

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(failResponse))

    await expect(fetchWithRetry('https://example.com', {}, 2, 10)).rejects.toThrow(
      'API responded with status 500'
    )
    expect(fetch).toHaveBeenCalledTimes(3) // original + 2 retries
  })

  it('does not retry on 429 and throws immediately', async () => {
    const tooManyRequests = new Response('Too Many Requests', { status: 429 })

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(tooManyRequests))

    await expect(fetchWithRetry('https://example.com')).rejects.toThrow(
      'API responded with status 429'
    )
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('retries on network error', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(new Response('ok', { status: 200 }))

    vi.stubGlobal('fetch', fetchMock)

    const res = await fetchWithRetry('https://example.com', {}, 1, 10)
    expect(res.status).toBe(200)
    expect(fetch).toHaveBeenCalledTimes(2)
  })
})
