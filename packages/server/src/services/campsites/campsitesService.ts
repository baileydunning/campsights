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
const API_TIMEOUT = 3000;
const BLM_API_URL = 'https://blm-spider.onrender.com/api/v1/campsites';

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

  try {
    const forecast = await Promise.race([
      getWeatherForecast(campsite),
      new Promise<WeatherPeriod[]>((_, reject) => 
        setTimeout(() => reject(new Error('Weather timeout')), API_TIMEOUT)
      )
    ]);
    
    weatherCache.set(cacheKey, { weather: forecast, timestamp: now });
    return { weather: forecast };
  } catch (err) {
    console.error(`Error fetching weather for ${campsite.id}:`, err);
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

  try {
    const elevation = await Promise.race([
      getElevation(lat, lng),
      new Promise<number | null>((_, reject) => 
        setTimeout(() => reject(new Error('Elevation timeout')), API_TIMEOUT)
      )
    ]);
    
    elevationCache.set(cacheKey, { elevation, timestamp: now });
    return elevation;
  } catch (err) {
    console.error(`Error fetching elevation for ${lat},${lng}:`, err);
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
    
    // Fetch weather and elevation in parallel for better performance
    const [weatherResult, elevationResult] = await Promise.allSettled([
      attachWeather(raw),
      raw.elevation != null 
        ? Promise.resolve(raw.elevation)
        : (raw.lat != null && raw.lng != null 
            ? getElevationCached(raw.lat, raw.lng)
            : Promise.resolve(null))
    ]);

    const weather = weatherResult.status === 'fulfilled' ? weatherResult.value.weather : [];
    const elevation = elevationResult.status === 'fulfilled' ? elevationResult.value : null;

    return { ...raw, elevation, weather };
  } catch (err) {
    console.error('Error fetching campsite %s:', id, err);
    throw err;
  }
};