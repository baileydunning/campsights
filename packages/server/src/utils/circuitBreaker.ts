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
    if (this.weatherFailures >= MAX_FAILURES) {
      if (Date.now() - this.lastWeatherReset > RESET_TIME) {
        this.weatherFailures = 0;
        this.lastWeatherReset = Date.now();
        return false;
      }
      return true;
    }
    return false;
  },

  isElevationOpen() {
    if (this.elevationFailures >= MAX_FAILURES) {
      if (Date.now() - this.lastElevationReset > RESET_TIME) {
        this.elevationFailures = 0;
        this.lastElevationReset = Date.now();
        return false;
      }
      return true;
    }
    return false;
  },

  isCampsiteOpen() {
    if (this.campsiteFailures >= MAX_FAILURES) {
      if (Date.now() - this.lastCampsiteReset > RESET_TIME) {
        this.campsiteFailures = 0;
        this.lastCampsiteReset = Date.now();
        return false;
      }
      return true;
    }
    return false;
  },

  recordWeatherFailure() {
    this.weatherFailures++;
    if (this.weatherFailures === MAX_FAILURES) {
      this.lastWeatherReset = Date.now();
    }
  },

  recordElevationFailure() {
    this.elevationFailures++;
    if (this.elevationFailures === MAX_FAILURES) {
      this.lastElevationReset = Date.now();
    }
  },

  recordCampsiteFailure() {
    this.campsiteFailures++;
    if (this.campsiteFailures === MAX_FAILURES) {
      this.lastCampsiteReset = Date.now();
    }
  }
};