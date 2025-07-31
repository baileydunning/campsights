import { Campsite } from '../../models/campsiteModel';
import { getElevation } from '../elevation/elevationService';
import { getWeather } from '../weather/weatherService';
import { WeatherPeriod } from '../../models/weatherModel';
import { performanceMetrics } from '../../utils/metrics';
import { cacheUtils } from '../../utils/cacheUtils';

const CAMPSITE_CACHE_TTL = 5 * 60 * 1000;
const API_TIMEOUT = process.env.NODE_ENV === 'production' ? 5000 : 2000;
const BLM_API_URL = 'https://blm-spider.onrender.com/api/v1/campsites';

const campsiteCache = new Map<string, { campsite: Campsite; timestamp: number }>();
const cleanupCampsiteCache = cacheUtils(campsiteCache, CAMPSITE_CACHE_TTL);

if (process.env.NODE_ENV !== 'test') {
  setInterval(cleanupCampsiteCache, 5 * 60 * 1000);
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
        'User-Agent': 'Campsights-API/1.0',
      },
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

export const getCampsites = async (): Promise<Campsite[]> => {
  const response = await fetchWithTimeout(BLM_API_URL);
  if (!response.ok) throw new Error(`BLM API error: ${response.status}`);
  const raw: Campsite[] = await response.json();
  return raw.filter(site =>
    typeof site.lat === 'number' && typeof site.lng === 'number' &&
    !isNaN(site.lat) && !isNaN(site.lng)
  );
};

export const getCampsiteById = async (
  id: string
): Promise<Campsite & { elevation: number | null; weather: WeatherPeriod[] } | null> => {
  const startTime = Date.now();
  const result = await Promise.race([
    getCampsiteByIdInternal(id),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), process.env.NODE_ENV === 'production' ? 15000 : 4000))
  ]);
  performanceMetrics.recordResponseTime(Date.now() - startTime);
  return result;
};

async function getCampsiteByIdInternal(
  id: string
): Promise<Campsite & { elevation: number | null; weather: WeatherPeriod[] } | null> {
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) return null;
  const now = Date.now();
  const cached = campsiteCache.get(id);
  let raw: Campsite;

  if (cached && now - cached.timestamp < CAMPSITE_CACHE_TTL) {
    raw = cached.campsite;
  } else {
    const response = await fetchWithTimeout(`${BLM_API_URL}/${id}`);
    if (!response.ok) return null;
    raw = await response.json();
    campsiteCache.set(id, { campsite: raw, timestamp: now });
  }

  const [weatherResult, elevationResult] = await Promise.allSettled([
    getWeather(raw.lat, raw.lng, raw.id),
    raw.elevation != null
      ? Promise.resolve(raw.elevation)
      : (raw.lat != null && raw.lng != null
          ? getElevation(raw.lat, raw.lng)
          : Promise.resolve(null)),
  ]);

  const weather = weatherResult.status === 'fulfilled' ? weatherResult.value : [];
  const elevation = elevationResult.status === 'fulfilled' ? elevationResult.value : null;

  return { ...raw, elevation, weather };
}