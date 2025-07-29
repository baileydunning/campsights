import { Campsite } from '../../models/campsiteModel';
import { getElevation } from '../elevation/elevationService';
import { getWeatherForecast } from '../weather/weatherService';
import { WeatherPeriod } from '../../models/weatherModel';

interface WeatherCacheEntry {
  weather: WeatherPeriod[];
  timestamp: number;
}

const weatherCache = new Map<string, WeatherCacheEntry>();
const WEATHER_CACHE_TTL = 10 * 60 * 1000; // 10 minutes
const API_TIMEOUT = 5000; // 5 seconds
const BLM_API_URL = 'https://blm-spider.onrender.com/api/v1/campsites';

// Helper function to create cache key from coordinates
function getWeatherCacheKey(lat: number, lng: number): string {
  // Round to 2 decimal places to group nearby locations
  return `${Math.round(lat * 100) / 100},${Math.round(lng * 100) / 100}`;
}

// Cleanup expired cache entries
function cleanupWeatherCache(): void {
  const now = Date.now();
  for (const [key, entry] of weatherCache.entries()) {
    if (now - entry.timestamp > WEATHER_CACHE_TTL) {
      weatherCache.delete(key);
    }
  }
}

// Run cleanup every 5 minutes (only in production)
if (process.env.NODE_ENV !== 'test') {
  setInterval(cleanupWeatherCache, 5 * 60 * 1000);
}

// Helper function to fetch with timeout
async function fetchWithTimeout(url: string, timeoutMs: number = API_TIMEOUT): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, { signal: controller.signal });
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

    const response = await fetchWithTimeout(`${BLM_API_URL}/${id}`);
    if (!response.ok) {
      console.error('Error fetching campsite by ID:', id);
      return null;
    }

    const raw: Campsite = await response.json();
    
    // Fetch weather and elevation in parallel for better performance
    const [weatherResult, elevationResult] = await Promise.allSettled([
      attachWeather(raw),
      raw.elevation != null 
        ? Promise.resolve(raw.elevation)
        : (raw.lat != null && raw.lng != null 
            ? Promise.race([
                getElevation(raw.lat, raw.lng),
                new Promise<number | null>((_, reject) => 
                  setTimeout(() => reject(new Error('Elevation timeout')), API_TIMEOUT)
                )
              ])
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