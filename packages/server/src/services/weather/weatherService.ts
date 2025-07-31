import { fetchWithRetry } from '../../utils/fetchWithRetry';
import { Campsite } from '../../models/campsiteModel';
import { WeatherPeriod } from '../../models/weatherModel';
import { circuitBreaker } from '../../utils/circuitBreaker';
import { performanceMetrics } from '../../utils/metrics';

const WEATHER_CACHE_TTL = 10 * 60 * 1000;
const weatherCache = new Map<string, { weather: WeatherPeriod[]; timestamp: number }>();
const preWarmCache = new Set<string>();

function getCacheKey(lat: number, lng: number): string {
  return `${Math.round(lat * 100) / 100},${Math.round(lng * 100) / 100}`;
}


export async function getWeather(lat: number, lng: number, id?: string): Promise<WeatherPeriod[]> {
  const cacheKey = getCacheKey(lat, lng);
  const now = Date.now();
  const cached = weatherCache.get(cacheKey);
  if (cached && now - cached.timestamp < WEATHER_CACHE_TTL) return cached.weather;
  if (circuitBreaker.isWeatherOpen() || preWarmCache.has(cacheKey)) return [];

  try {
    const weather = await getWeatherForecast({
      lat,
      lng,
      id: id ?? '',
      name: '',
      url: '',
      state: '',
      mapLink: '',
      source: 'BLM'
    });
    weatherCache.set(cacheKey, { weather, timestamp: now });
    return weather;
  } catch (err) {
    circuitBreaker.recordWeatherFailure();
    performanceMetrics.recordWeatherTimeout();
    preWarmCache.add(cacheKey);
    setTimeout(() => preWarmCache.delete(cacheKey), 60000);
    return [];
  }
}

export async function getWeatherForecast(
  campsite: Campsite
): Promise<WeatherPeriod[]> {
  const { lat, lng, id } = campsite;
  const pointsUrl = `https://api.weather.gov/points/${lat},${lng}`;

  try {
    const pointsRes = await fetchWithRetry(pointsUrl, {
      headers: { 'Accept': 'application/geo+json, application/json' }
    });
    if (!pointsRes.ok) throw new Error(`Points API ${pointsRes.status}`);

    const pointsData = (await pointsRes.json()) as { properties?: { forecast?: string } };
    const forecastUrl = pointsData.properties?.forecast;
    if (!forecastUrl) throw new Error('No forecast URL');

    const forecastRes = await fetchWithRetry(forecastUrl, {
      headers: { 'Accept': 'application/geo+json, application/json' }
    });
    if (!forecastRes.ok) throw new Error(`Forecast API ${forecastRes.status}`);

    const forecastData = (await forecastRes.json()) as { properties?: { periods?: WeatherPeriod[] } };
    return forecastData.properties?.periods ?? [];
  } catch (error) {
    console.error('Weather fetch error for campsite %s:', id, error);
    return [];
  }
}