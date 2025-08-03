import { describe, it, beforeEach, afterEach, vi, expect } from 'vitest'

import { circuitBreaker } from './circuitBreaker'

describe('circuitBreaker', () => {
  const originalEnv = process.env.NODE_ENV
  let now = 1000000

  beforeEach(() => {
    circuitBreaker.weatherFailures = 0
    circuitBreaker.elevationFailures = 0
    circuitBreaker.campsiteFailures = 0
    circuitBreaker.lastWeatherReset = 0
    circuitBreaker.lastElevationReset = 0
    circuitBreaker.lastCampsiteReset = 0
    now = 1000000
    vi.spyOn(Date, 'now').mockImplementation(() => now)
    process.env.NODE_ENV = 'test'
  })

  afterEach(() => {
    vi.restoreAllMocks()
    process.env.NODE_ENV = originalEnv
  })

  it('should not open weather circuit before max failures', () => {
    expect(circuitBreaker.isWeatherOpen()).toBe(false)
    circuitBreaker.recordWeatherFailure()
    expect(circuitBreaker.isWeatherOpen()).toBe(false)
    circuitBreaker.recordWeatherFailure()
    expect(circuitBreaker.isWeatherOpen()).toBe(true)
  })

  it('should not open elevation circuit before max failures', () => {
    expect(circuitBreaker.isElevationOpen()).toBe(false)
    circuitBreaker.recordElevationFailure()
    expect(circuitBreaker.isElevationOpen()).toBe(false)
    circuitBreaker.recordElevationFailure()
    expect(circuitBreaker.isElevationOpen()).toBe(true)
  })

  it('should not open campsite circuit before max failures', () => {
    expect(circuitBreaker.isCampsiteOpen()).toBe(false)
    circuitBreaker.recordCampsiteFailure()
    expect(circuitBreaker.isCampsiteOpen()).toBe(false)
    circuitBreaker.recordCampsiteFailure()
    expect(circuitBreaker.isCampsiteOpen()).toBe(true)
  })

  it('should reset weather failures after RESET_TIME', () => {
    circuitBreaker.recordWeatherFailure()
    circuitBreaker.recordWeatherFailure()
    expect(circuitBreaker.isWeatherOpen()).toBe(true)
    now += 31000 // advance time past RESET_TIME (30000 in dev)
    expect(circuitBreaker.isWeatherOpen()).toBe(false)
    expect(circuitBreaker.weatherFailures).toBe(0)
  })

  it('should reset elevation failures after RESET_TIME', () => {
    circuitBreaker.recordElevationFailure()
    circuitBreaker.recordElevationFailure()
    expect(circuitBreaker.isElevationOpen()).toBe(true)
    now += 31000
    expect(circuitBreaker.isElevationOpen()).toBe(false)
    expect(circuitBreaker.elevationFailures).toBe(0)
  })

  it('should reset campsite failures after RESET_TIME', () => {
    circuitBreaker.recordCampsiteFailure()
    circuitBreaker.recordCampsiteFailure()
    expect(circuitBreaker.isCampsiteOpen()).toBe(true)
    now += 31000
    expect(circuitBreaker.isCampsiteOpen()).toBe(false)
    expect(circuitBreaker.campsiteFailures).toBe(0)
  })
})
