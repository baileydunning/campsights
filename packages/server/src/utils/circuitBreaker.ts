const ENV = process.env.NODE_ENV === 'production';
const MAX_FAILURES = ENV ? 5 : 2;
const RESET_TIME = ENV ? 60000 : 30000;

export const circuitBreaker = {
  weatherFailures: 0,
  elevationFailures: 0,
  campsiteFailures: 0,
  lastWeatherReset: 0,
  lastElevationReset: 0,
  lastCampsiteReset: 0,

  isWeatherOpen() {
    if (Date.now() - this.lastWeatherReset > RESET_TIME) {
      this.weatherFailures = 0;
      this.lastWeatherReset = Date.now();
    }
    return this.weatherFailures >= MAX_FAILURES;
  },

  isElevationOpen() {
    if (Date.now() - this.lastElevationReset > RESET_TIME) {
      this.elevationFailures = 0;
      this.lastElevationReset = Date.now();
    }
    return this.elevationFailures >= MAX_FAILURES;
  },

  isCampsiteOpen() {
    if (Date.now() - this.lastCampsiteReset > RESET_TIME) {
      this.campsiteFailures = 0;
      this.lastCampsiteReset = Date.now();
    }
    return this.campsiteFailures >= MAX_FAILURES;
  },

  recordWeatherFailure() {
    this.weatherFailures++;
  },

  recordElevationFailure() {
    this.elevationFailures++;
  },

  recordCampsiteFailure() {
    this.campsiteFailures++;
  }
};