export const performanceMetrics = {
  weatherTimeouts: 0,
  elevationTimeouts: 0,
  campsiteTimeouts: 0,
  totalRequests: 0,
  avgResponseTime: 0,

  recordWeatherTimeout() {
    this.weatherTimeouts++
  },

  recordElevationTimeout() {
    this.elevationTimeouts++
  },

  recordCampsiteTimeout() {
    this.campsiteTimeouts++
  },

  recordResponseTime(duration: number) {
    this.totalRequests++
    this.avgResponseTime =
      (this.avgResponseTime * (this.totalRequests - 1) + duration) / this.totalRequests
  },
}
