export async function fetchWithRetry(
  url: string,
  init: RequestInit = {},
  maxRetries = 2,
  retryDelayMs = 500,
  errorMessage?: (status: number) => string
): Promise<Response> {
  const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))
  let lastError: Error = new Error('fetchWithRetry: All attempts failed')

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      const res = await fetch(url, init)
      if (res.ok) return res
      const status = typeof res.status === 'number' ? res.status : 0
      if (status === 429) {
        lastError = new Error(`API responded with status 429 (Too Many Requests)`)
        break // Stop retrying on 429
      }
      lastError = new Error(
        errorMessage ? errorMessage(status) : `API responded with status ${status}`
      )
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
    }

    if (attempt <= maxRetries) {
      console.warn(`fetchWithRetry: attempt ${attempt} failed. Retrying in ${retryDelayMs}ms...`)
      await sleep(retryDelayMs)
    }
  }

  throw lastError
}
