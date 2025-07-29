import { fetchWithRetry } from '../../utils/fetchWithRetry';
import { Elevation } from '../../models/elevationModel';

export const elevationCache = new Map<string, number | null>();

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
      results[index] = elevationCache.get(key)!;
    } else {
      results[index] = null; // placeholder
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

      // Cache and store results
      uncached.forEach((loc, i) => {
        const key = `${loc.latitude},${loc.longitude}`;
        const elevation = payload!.results[i].elevation;
        elevationCache.set(key, elevation);
        results[uncachedIndexes[i]] = elevation;
      });
    } catch (err: any) {
      // If API fails, return null for uncached locations
      uncachedIndexes.forEach((index) => {
        results[index] = null;
      });
    }
  }

  return results;
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