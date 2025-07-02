import { fetchWithRetry } from '../../utils/fetchWithRetry';
import { Elevation } from '../../models/elevationModel';

const elevationCache = new Map<string, number | null>();

const getElevations = async (
  locations: { latitude: number; longitude: number }[]
): Promise<(number | null)[]> => {
  const keys = locations.map(({ latitude, longitude }) => `${latitude},${longitude}`);
  const results: Array<number | null | undefined> = [];
  const uncached: { latitude: number; longitude: number }[] = [];
  const uncachedIndexes: number[] = [];

  for (const [index, key] of keys.entries()) {
    if (elevationCache.has(key)) {
      results[index] = elevationCache.get(key)!;
    } else {
      uncached.push(locations[index]);
      uncachedIndexes.push(index);
    }
  }

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
    } catch (err) {
      console.warn('[elevationService] Elevation API failed, serving stale or null data');
      uncached.forEach((loc, i) => {
        const key = `${loc.latitude},${loc.longitude}`;
        if (elevationCache.has(key)) {
          results[uncachedIndexes[i]] = elevationCache.get(key)!;
        } else {
          results[uncachedIndexes[i]] = null;
        }
      });
      return results as (number | null)[];
    }

    uncached.forEach((loc, i) => {
      const key = `${loc.latitude},${loc.longitude}`;
      const elevation = payload!.results[i].elevation;
      elevationCache.set(key, elevation);
      results[uncachedIndexes[i]] = elevation;
    });
  }

  return results as (number | null)[];
};

export const getElevation = async (
  latitude: number,
  longitude: number
): Promise<number | null> => {
  const [elevation] = await getElevations([{ latitude, longitude }]);
  return elevation;
};

export function __clearElevationCache() {
  elevationCache.clear();
}