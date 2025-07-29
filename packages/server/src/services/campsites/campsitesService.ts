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

const WEATHER_CACHE_TTL = 10 * 60 * 1000; // 10 minutes
const ELEVATION_CACHE_TTL = 60 * 60 * 1000; // 1 hour
const CAMPSITE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const API_TIMEOUT = process.env.NODE_ENV === 'production' ? 5000 : 2000; 
const BLM_API_URL = 'https://blm-spider.onrender.com/api/v1/campsites';

// Pre-warm cache to avoid cold starts
const preWarmCache = new Set<string>();

// Track performance metrics
const performanceMetrics = {
  weatherTimeouts: 0,
  elevationTimeouts: 0,
  totalRequests: 0,
  avgResponseTime: 0
};

// Circuit breaker for external APIs
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

// Helper function to create cache key from coordinates
function getWeatherCacheKey(lat: number, lng: number): string {
  // Round to 2 decimal places to group nearby locations
  return `${Math.round(lat * 100) / 100},${Math.round(lng * 100) / 100}`;
}

function getElevationCacheKey(lat: number, lng: number): string {
  // Round to 3 decimal places for more precise elevation caching
  return `${Math.round(lat * 1000) / 1000},${Math.round(lng * 1000) / 1000}`;
}

// Cleanup expired cache entries
function cleanupCaches(): void {
  const now = Date.now();
  
  // Clean weather cache
  for (const [key, entry] of weatherCache.entries()) {
    if (now - entry.timestamp > WEATHER_CACHE_TTL) {
      weatherCache.delete(key);
    }
  }
  
  // Clean elevation cache
  for (const [key, entry] of elevationCache.entries()) {
    if (now - entry.timestamp > ELEVATION_CACHE_TTL) {
      elevationCache.delete(key);
    }
  }
  
  // Clean campsite cache
  for (const [key, entry] of campsiteCache.entries()) {
    if (now - entry.timestamp > CAMPSITE_CACHE_TTL) {
      campsiteCache.delete(key);
    }
  }
}

// Run cleanup every 5 minutes (only in production)
if (process.env.NODE_ENV !== 'test') {
  setInterval(cleanupCaches, 5 * 60 * 1000);
  
  // Background cache preloader - run every 10 minutes
  setInterval(async () => {
    try {
      console.log('Background cache preloader started...');
      const campsites = await getCampsites();
      const popular = campsites.slice(0, 10); // Preload first 10 campsites
      
      for (const site of popular) {
        if (!weatherCache.has(getWeatherCacheKey(site.lat, site.lng))) {
          // Preload weather data in background (fire and forget)
          attachWeather(site).catch(() => {}); // Ignore failures
        }
        if (!elevationCache.has(getElevationCacheKey(site.lat, site.lng))) {
          // Preload elevation data in background (fire and forget)
          getElevationCached(site.lat, site.lng).catch(() => {}); // Ignore failures
        }
      }
      console.log('Background cache preloader completed');
    } catch (err) {
      console.error('Background preloader error:', err);
    }
  }, 10 * 60 * 1000); // Every 10 minutes
}

// Helper function to fetch with timeout and connection reuse
async function fetchWithTimeout(url: string, timeoutMs: number = API_TIMEOUT): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, { 
      signal: controller.signal,
      // Enable connection reuse and HTTP/2
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

async function attachWeather(
  campsite: Campsite
): Promise<{ weather: WeatherPeriod[] }> {
  const cacheKey = getWeatherCacheKey(campsite.lat, campsite.lng);
  const now = Date.now();
  
  // Check if we have valid cached data
  const cached = weatherCache.get(cacheKey);
  if (cached && (now - cached.timestamp) < WEATHER_CACHE_TTL) {
    return { weather: cached.weather };
  }

  // Circuit breaker - fail fast if service is down
  if (circuitBreaker.isWeatherOpen()) {
    return { weather: [] };
  }

  // Return empty weather immediately if we've already tried this location recently
  if (preWarmCache.has(`weather_${cacheKey}`)) {
    return { weather: [] };
  }

  try {
    // More reasonable timeout for production - still aggressive but not too much
    const forecast = await Promise.race([
      getWeatherForecast(campsite),
      new Promise<WeatherPeriod[]>((_, reject) => 
        setTimeout(() => reject(new Error('Weather timeout')), API_TIMEOUT * 1.5) // 1.5x API timeout
      )
    ]);
    
    weatherCache.set(cacheKey, { weather: forecast, timestamp: now });
    return { weather: forecast };
  } catch (err) {
    console.error(`Error fetching weather for ${campsite.id}:`, err);
    circuitBreaker.recordWeatherFailure();
    // Mark as attempted to avoid future slow calls
    preWarmCache.add(`weather_${cacheKey}`);
    setTimeout(() => preWarmCache.delete(`weather_${cacheKey}`), 60000); // Reset after 60s in prod
    return { weather: [] };
  }
}

async function getElevationCached(lat: number, lng: number): Promise<number | null> {
  const cacheKey = getElevationCacheKey(lat, lng);
  const now = Date.now();
  
  // Check if we have valid cached data
  const cached = elevationCache.get(cacheKey);
  if (cached && (now - cached.timestamp) < ELEVATION_CACHE_TTL) {
    return cached.elevation;
  }

  // Circuit breaker - fail fast if service is down
  if (circuitBreaker.isElevationOpen()) {
    return null;
  }

  // Return null immediately if we've already tried this location recently
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
    console.error(`Error fetching elevation for ${lat},${lng}:`, err);
    circuitBreaker.recordElevationFailure();
    // Mark as attempted to avoid future slow calls
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
    console.error('Error fetching campsites:', err);
    throw err;
  }
};

export const getCampsiteById = async (
  id: string
): Promise<Campsite & { elevation: number | null; weather: WeatherPeriod[] } | null> => {
  const startTime = Date.now();
  
  // Wrap entire operation in timeout for guaranteed response time
  const result = await Promise.race([
    getCampsiteByIdInternal(id),
    new Promise<null>((resolve) => 
      setTimeout(() => {
        console.warn(`Campsite ${id} request timed out, returning null`);
        resolve(null);
      }, process.env.NODE_ENV === 'production' ? 15000 : 4000) 
    )
  ]);
  
  // Track performance metrics
  const duration = Date.now() - startTime;
  performanceMetrics.totalRequests++;
  performanceMetrics.avgResponseTime = 
    (performanceMetrics.avgResponseTime * (performanceMetrics.totalRequests - 1) + duration) / 
    performanceMetrics.totalRequests;
  
  // Log performance every 100 requests
  if (performanceMetrics.totalRequests % 100 === 0) {
    console.log(`Performance metrics: Avg: ${performanceMetrics.avgResponseTime.toFixed(0)}ms, Weather timeouts: ${performanceMetrics.weatherTimeouts}, Elevation timeouts: ${performanceMetrics.elevationTimeouts}`);
  }
  
  return result;
};

async function getCampsiteByIdInternal(
  id: string
): Promise<Campsite & { elevation: number | null; weather: WeatherPeriod[] } | null> {
  try {
    const validIdPattern = /^[a-zA-Z0-9_-]+$/; 
    if (!validIdPattern.test(id)) {
      console.error('Invalid campsite ID:', id);
      return null;
    }

    // Check campsite cache first
    const now = Date.now();
    const cachedCampsite = campsiteCache.get(id);
    let raw: Campsite;
    
    if (cachedCampsite && (now - cachedCampsite.timestamp) < CAMPSITE_CACHE_TTL) {
      raw = cachedCampsite.campsite;
    } else {
      const response = await fetchWithTimeout(`${BLM_API_URL}/${id}`);
      if (!response.ok) {
        console.error('Error fetching campsite by ID:', id);
        return null;
      }
      raw = await response.json();
      campsiteCache.set(id, { campsite: raw, timestamp: now });
    }
    
    // Fetch weather and elevation in parallel 
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
    console.error('Error fetching campsite %s:', id, err);
    return null; // Return null instead of throwing to maintain API contract
  }
};