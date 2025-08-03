import { describe, it, expect, beforeEach } from 'vitest'

import { performanceMetrics } from './metrics'

describe('performanceMetrics', () => {
  beforeEach(() => {
    performanceMetrics.weatherTimeouts = 0
    performanceMetrics.elevationTimeouts = 0
    performanceMetrics.campsiteTimeouts = 0
    performanceMetrics.totalRequests = 0
    performanceMetrics.avgResponseTime = 0
  })

  it('should increment weatherTimeouts when recordWeatherTimeout is called', () => {
    performanceMetrics.recordWeatherTimeout()
    expect(performanceMetrics.weatherTimeouts).toBe(1)
    performanceMetrics.recordWeatherTimeout()
    expect(performanceMetrics.weatherTimeouts).toBe(2)
  })

  it('should increment elevationTimeouts when recordElevationTimeout is called', () => {
    performanceMetrics.recordElevationTimeout()
    expect(performanceMetrics.elevationTimeouts).toBe(1)
    performanceMetrics.recordElevationTimeout()
    expect(performanceMetrics.elevationTimeouts).toBe(2)
  })

  it('should increment campsiteTimeouts when recordCampsiteTimeout is called', () => {
    performanceMetrics.recordCampsiteTimeout()
    expect(performanceMetrics.campsiteTimeouts).toBe(1)
    performanceMetrics.recordCampsiteTimeout()
    expect(performanceMetrics.campsiteTimeouts).toBe(2)
  })

  it('should correctly calculate avgResponseTime and totalRequests', () => {
    performanceMetrics.recordResponseTime(100)
    expect(performanceMetrics.totalRequests).toBe(1)
    expect(performanceMetrics.avgResponseTime).toBe(100)

    performanceMetrics.recordResponseTime(200)
    expect(performanceMetrics.totalRequests).toBe(2)
    expect(performanceMetrics.avgResponseTime).toBe(150)

    performanceMetrics.recordResponseTime(50)
    expect(performanceMetrics.totalRequests).toBe(3)
    expect(performanceMetrics.avgResponseTime).toBeCloseTo((100 + 200 + 50) / 3, 5)
  })
})
