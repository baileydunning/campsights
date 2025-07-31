import { fetchWithRetry } from '../../utils/fetchWithRetry';
import { Elevation } from '../../models/elevationModel';
import { circuitBreaker } from '../../utils/circuitBreaker';
import { performanceMetrics } from '../../utils/metrics';
import { cacheUtils } from '../../utils/cacheUtils';

const ELEVATION_CACHE_TTL = 60 * 60 * 1000;
export const elevationCache = new Map<string, { elevation: number | null; timestamp: number }>();
export const preWarmCache = new Set<string>();
const cleanupElevationCache = cacheUtils(elevationCache, ELEVATION_CACHE_TTL);

export function __clearElevationCache() {
  elevationCache.clear();
  preWarmCache.clear();
}

if (process.env.NODE_ENV !== 'test') {
  setInterval(cleanupElevationCache, 10 * 60 * 1000); 
}

function getCacheKey(lat: number, lng: number): string {
  return `${Math.round(lat * 1000) / 1000},${Math.round(lng * 1000) / 1000}`;
}

export async function getElevation(lat: number, lng: number): Promise<number | null> {
  const cacheKey = getCacheKey(lat, lng);
  const now = Date.now();
  const cached = elevationCache.get(cacheKey);
  if (cached && now - cached.timestamp < ELEVATION_CACHE_TTL) return cached.elevation;
  if (circuitBreaker.isElevationOpen() || preWarmCache.has(cacheKey)) return null;

  try {
    const response = await fetchWithRetry('https://api.open-elevation.com/api/v1/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locations: [{ latitude: lat, longitude: lng }] }),
    });
    const result = await response.json() as { results: Elevation[] };
    const elevation = result.results?.[0]?.elevation ?? null;
    elevationCache.set(cacheKey, { elevation, timestamp: now });
    return elevation;
  } catch (err) {
    circuitBreaker.recordElevationFailure();
    performanceMetrics.recordElevationTimeout();
    preWarmCache.add(cacheKey);
    setTimeout(() => preWarmCache.delete(cacheKey), 60000);
    return null;
  }
}

export const getElevations = async (
  locations: { latitude: number; longitude: number }[]
): Promise<(number | null)[]> => {
  const keys = locations.map(({ latitude, longitude }) => `${latitude},${longitude}`);
  const results: Array<number | null> = [];
  const uncached: { latitude: number; longitude: number }[] = [];
  const uncachedIndexes: number[] = [];

  // Check in-memory cache
  for (const [index, key] of keys.entries()) {
    if (elevationCache.has(key)) {
      results[index] = elevationCache.get(key)!.elevation;
    } else {
      results[index] = null; 
      uncached.push(locations[index]);
      uncachedIndexes.push(index);
    }
  }

  // Fetch uncached elevations from API
  if (uncached.length > 0) {
    let payload: { results: Elevation[] } | null = null;
    try {
      const response = await fetchWithRetry('https://api.open-elevation.com/api/v1/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locations: uncached }),
      });
      payload = (await response.json()) as { results: Elevation[] };

      if (!Array.isArray(payload.results) || payload.results.length !== uncached.length) {
        throw new Error('Elevation data missing or mismatched for requested coordinates.');
      }

      uncached.forEach((loc, i) => {
        const key = `${loc.latitude},${loc.longitude}`;
        const elevation = payload!.results[i].elevation;
        elevationCache.set(key, { elevation, timestamp: Date.now() });
        results[uncachedIndexes[i]] = elevation;
      });
    } catch (err: any) {
      uncachedIndexes.forEach((index) => {
        results[index] = null;
      });
    }
  }

  return results;
};