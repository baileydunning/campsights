import { Campsite } from '../../models/campsiteModel';
import { getElevation } from '../elevation/elevationService';
import { getWeatherForecast } from '../weather/weatherService';
import { WeatherPeriod } from '../../models/weatherModel';

interface WeatherCacheEntry {
  weather: WeatherPeriod[];
  timestamp: number;
}

const weatherCache = new Map<string, WeatherCacheEntry>();
const elevationCache = new Map<string, { elevation: number | null; timestamp: number }>();
const campsiteCache = new Map<string, { campsite: Campsite; timestamp: number }>();
const WEATHER_CACHE_TTL = 10 * 60 * 1000;
const ELEVATION_CACHE_TTL = 60 * 60 * 1000;
const CAMPSITE_CACHE_TTL = 5 * 60 * 1000;
const API_TIMEOUT = process.env.NODE_ENV === 'production' ? 5000 : 2000;
const BLM_API_URL = 'https://blm-spider.onrender.com/api/v1/campsites';

const preWarmCache = new Set<string>();

const performanceMetrics = {
  weatherTimeouts: 0,
  elevationTimeouts: 0,
  totalRequests: 0,
  avgResponseTime: 0
};

const circuitBreaker = {
  weatherFailures: 0,
  elevationFailures: 0,
  maxFailures: process.env.NODE_ENV === 'production' ? 5 : 2,
  resetTime: process.env.NODE_ENV === 'production' ? 60000 : 30000,
  lastWeatherReset: 0,
  lastElevationReset: 0,
  isWeatherOpen(): boolean {
    if (Date.now() - this.lastWeatherReset > this.resetTime) {
      this.weatherFailures = 0;
      this.lastWeatherReset = Date.now();
    }
    return this.weatherFailures >= this.maxFailures;
  },
  isElevationOpen(): boolean {
    if (Date.now() - this.lastElevationReset > this.resetTime) {
      this.elevationFailures = 0;
      this.lastElevationReset = Date.now();
    }
    return this.elevationFailures >= this.maxFailures;
  },
  recordWeatherFailure(): void {
    this.weatherFailures++;
    performanceMetrics.weatherTimeouts++;
  },
  recordElevationFailure(): void {
    this.elevationFailures++;
    performanceMetrics.elevationTimeouts++;
  }
};

function getWeatherCacheKey(lat: number, lng: number): string {
  return `${Math.round(lat * 100) / 100},${Math.round(lng * 100) / 100}`;
}

function getElevationCacheKey(lat: number, lng: number): string {
  return `${Math.round(lat * 1000) / 1000},${Math.round(lng * 1000) / 1000}`;
}

function cleanupCaches(): void {
  const now = Date.now();
  for (const [key, entry] of weatherCache.entries()) {
    if (now - entry.timestamp > WEATHER_CACHE_TTL) {
      weatherCache.delete(key);
    }
  }
  for (const [key, entry] of elevationCache.entries()) {
    if (now - entry.timestamp > ELEVATION_CACHE_TTL) {
      elevationCache.delete(key);
    }
  }
  for (const [key, entry] of campsiteCache.entries()) {
    if (now - entry.timestamp > CAMPSITE_CACHE_TTL) {
      campsiteCache.delete(key);
    }
  }
}

if (process.env.NODE_ENV !== 'test') {
  setInterval(cleanupCaches, 5 * 60 * 1000);
  setInterval(async () => {
    try {
      const campsites = await getCampsites();
      const popular = campsites.slice(0, 10);
      for (const site of popular) {
        if (!weatherCache.has(getWeatherCacheKey(site.lat, site.lng))) {
          attachWeather(site).catch(() => {});
        }
        if (!elevationCache.has(getElevationCacheKey(site.lat, site.lng))) {
          getElevationCached(site.lat, site.lng).catch(() => {});
        }
      }
    } catch (err) {}
  }, 10 * 60 * 1000);
}

async function fetchWithTimeout(url: string, timeoutMs: number = API_TIMEOUT): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      keepalive: true,
      headers: {
        'Connection': 'keep-alive',
        'Accept-Encoding': 'gzip, deflate, br',
        'User-Agent': 'Campsights-API/1.0'
      }
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

async function attachWeather(campsite: Campsite): Promise<{ weather: WeatherPeriod[] }> {
  const cacheKey = getWeatherCacheKey(campsite.lat, campsite.lng);
  const now = Date.now();
  const cached = weatherCache.get(cacheKey);
  if (cached && (now - cached.timestamp) < WEATHER_CACHE_TTL) {
    return { weather: cached.weather };
  }
  if (circuitBreaker.isWeatherOpen()) {
    return { weather: [] };
  }
  if (preWarmCache.has(`weather_${cacheKey}`)) {
    return { weather: [] };
  }
  try {
    const forecast = await Promise.race([
      getWeatherForecast(campsite),
      new Promise<WeatherPeriod[]>((_, reject) =>
        setTimeout(() => reject(new Error('Weather timeout')), API_TIMEOUT * 1.5)
      )
    ]);
    weatherCache.set(cacheKey, { weather: forecast, timestamp: now });
    return { weather: forecast };
  } catch (err) {
    circuitBreaker.recordWeatherFailure();
    preWarmCache.add(`weather_${cacheKey}`);
    setTimeout(() => preWarmCache.delete(`weather_${cacheKey}`), 60000);
    return { weather: [] };
  }
}

async function getElevationCached(lat: number, lng: number): Promise<number | null> {
  const cacheKey = getElevationCacheKey(lat, lng);
  const now = Date.now();
  const cached = elevationCache.get(cacheKey);
  if (cached && (now - cached.timestamp) < ELEVATION_CACHE_TTL) {
    return cached.elevation;
  }
  if (circuitBreaker.isElevationOpen()) {
    return null;
  }
  if (preWarmCache.has(`elevation_${cacheKey}`)) {
    return null;
  }
  try {
    const elevation = await Promise.race([
      getElevation(lat, lng),
      new Promise<number | null>((_, reject) =>
        setTimeout(() => reject(new Error('Elevation timeout')), API_TIMEOUT * 1.5)
      )
    ]);
    elevationCache.set(cacheKey, { elevation, timestamp: now });
    return elevation;
  } catch (err) {
    circuitBreaker.recordElevationFailure();
    preWarmCache.add(`elevation_${cacheKey}`);
    setTimeout(() => preWarmCache.delete(`elevation_${cacheKey}`), 60000);
    return null;
  }
}

export const getCampsites = async (): Promise<Campsite[]> => {
  try {
    const response = await fetchWithTimeout(BLM_API_URL);
    if (!response.ok) {
      throw new Error(`BLM API responded with status: ${response.status}`);
    }
    const raw: Campsite[] = await response.json();
    return raw.filter(site =>
      typeof site.lat === 'number' &&
      typeof site.lng === 'number' &&
      !isNaN(site.lat) &&
      !isNaN(site.lng)
    );
  } catch (err) {
    throw err;
  }
};

export const getCampsiteById = async (
  id: string
): Promise<Campsite & { elevation: number | null; weather: WeatherPeriod[] } | null> => {
  const startTime = Date.now();
  const result = await Promise.race([
    getCampsiteByIdInternal(id),
    new Promise<null>((resolve) =>
      setTimeout(() => {
        resolve(null);
      }, process.env.NODE_ENV === 'production' ? 15000 : 4000)
    )
  ]);
  const duration = Date.now() - startTime;
  performanceMetrics.totalRequests++;
  performanceMetrics.avgResponseTime =
    (performanceMetrics.avgResponseTime * (performanceMetrics.totalRequests - 1) + duration) /
    performanceMetrics.totalRequests;
  return result;
};

async function getCampsiteByIdInternal(
  id: string
): Promise<Campsite & { elevation: number | null; weather: WeatherPeriod[] } | null> {
  try {
    const validIdPattern = /^[a-zA-Z0-9_-]+$/;
    if (!validIdPattern.test(id)) {
      return null;
    }
    const now = Date.now();
    const cachedCampsite = campsiteCache.get(id);
    let raw: Campsite;
    if (cachedCampsite && (now - cachedCampsite.timestamp) < CAMPSITE_CACHE_TTL) {
      raw = cachedCampsite.campsite;
    } else {
      const response = await fetchWithTimeout(`${BLM_API_URL}/${id}`);
      if (!response.ok) {
        return null;
      }
      raw = await response.json();
      campsiteCache.set(id, { campsite: raw, timestamp: now });
    }
    const [weatherResult, elevationResult] = await Promise.allSettled([
      Promise.race([
        attachWeather(raw),
        new Promise<{ weather: WeatherPeriod[] }>((resolve) =>
          setTimeout(() => resolve({ weather: [] }), API_TIMEOUT * 2)
        )
      ]),
      Promise.race([
        raw.elevation != null
          ? Promise.resolve(raw.elevation)
          : (raw.lat != null && raw.lng != null
              ? getElevationCached(raw.lat, raw.lng)
              : Promise.resolve(null)),
        new Promise<number | null>((resolve) =>
          setTimeout(() => resolve(null), API_TIMEOUT * 2)
        )
      ])
    ]);
    const weather = weatherResult.status === 'fulfilled' ? weatherResult.value.weather : [];
    const elevation = elevationResult.status === 'fulfilled' ? elevationResult.value : null;
    return { ...raw, elevation, weather };
  } catch (err) {
    return null;
  }
};