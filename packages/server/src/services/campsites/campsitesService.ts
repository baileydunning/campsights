import { Campsite } from '../../models/campsiteModel';
import { WeatherPeriod } from '../../models/weatherModel';
import { performanceMetrics } from '../../utils/metrics';
import { cacheUtils } from '../../utils/cacheUtils';
import { fetchWithRetry } from '../../utils/fetchWithRetry';

const RATE_LIMIT = 2; 
let lastRequestTime = 0;
let pendingRequests: (() => void)[] = [];

function rateLimit(): Promise<void> {
  return new Promise((resolve) => {
    const now = Date.now();
    const minInterval = 1000 / RATE_LIMIT;
    const timeSinceLast = now - lastRequestTime;
    if (timeSinceLast >= minInterval) {
      lastRequestTime = now;
      resolve();
    } else {
      pendingRequests.push(resolve);
      setTimeout(() => {
        lastRequestTime = Date.now();
        const next = pendingRequests.shift();
        if (next) next();
      }, minInterval - timeSinceLast);
    }
  });
}

const CAMPSITE_CACHE_TTL = 5 * 60 * 1000;
const BLM_API_URL = 'https://blm-spider.onrender.com/api/v1/campsites';

export const campsiteCache = new Map<string, { campsite: Campsite; timestamp: number }>();
const cleanupCampsiteCache = cacheUtils(campsiteCache, CAMPSITE_CACHE_TTL);

export function __clearCampsiteCache() {
  campsiteCache.clear();
}

if (process.env.NODE_ENV !== 'test') {
  setInterval(cleanupCampsiteCache, 5 * 60 * 1000);
}

export const getCampsites = async (): Promise<Campsite[]> => {
  await rateLimit();
  const response = await fetchWithRetry(`${BLM_API_URL}?limit=all`);
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
  let didTimeout = false;
  const timeoutMs = process.env.NODE_ENV === 'production' ? 15000 : 4000;
  const result = await Promise.race([
    getCampsiteByIdInternal(id),
    new Promise<null>((resolve) => setTimeout(() => {
      didTimeout = true;
      resolve(null);
    }, timeoutMs))
  ]);
  if (didTimeout) performanceMetrics.recordCampsiteTimeout();
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
    await rateLimit();
    const response = await fetchWithRetry(`${BLM_API_URL}/${id}`);
    if (!response.ok) return null;
    raw = await response.json();
    campsiteCache.set(id, { campsite: raw, timestamp: now });
  }

  const weatherService = await import('../weather/weatherService');
  const elevationService = await import('../elevation/elevationService');

  const [weatherResult, elevationResult] = await Promise.allSettled([
    weatherService.getWeather(raw.lat, raw.lng, raw.id),
    raw.elevation != null
      ? Promise.resolve(raw.elevation)
      : (raw.lat != null && raw.lng != null
          ? elevationService.getElevation(raw.lat, raw.lng)
          : Promise.resolve(null)),
  ]);

  const weather = weatherResult.status === 'fulfilled' ? weatherResult.value : [];
  const elevation = elevationResult.status === 'fulfilled' ? elevationResult.value : null;

  return { ...raw, elevation, weather };
}