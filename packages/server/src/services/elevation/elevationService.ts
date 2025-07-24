import { fetchWithRetry } from '../../utils/fetchWithRetry';
import { Elevation } from '../../models/elevationModel';
import { db } from '../../config/campsitesDb';

export const elevationCache = new Map<string, number | null>();

export const getElevations = async (
  locations: { latitude: number; longitude: number }[]
): Promise<(number | null)[]> => {
  const keys = locations.map(({ latitude, longitude }) => `${latitude},${longitude}`);
  const results: Array<number | null | undefined> = [];
  const uncached: { latitude: number; longitude: number }[] = [];
  const uncachedIndexes: number[] = [];

  // First, check in-memory cache
  const dbKeysToFetch: string[] = [];
  const dbIndexesToFetch: number[] = [];
  for (const [index, key] of keys.entries()) {
    if (elevationCache.has(key)) {
      results[index] = elevationCache.get(key)!;
      continue;
    }
    dbKeysToFetch.push(`elevation:${key}`);
    dbIndexesToFetch.push(index);
  }

  // Batch DB get for all uncached keys
  let dbResults: (number | null | undefined)[] = [];
  if (dbKeysToFetch.length > 0 && typeof db.getMany === 'function') {
    try {
      dbResults = await db.getMany(dbKeysToFetch);
    } catch {
      dbResults = [];
    }
  } else if (dbKeysToFetch.length > 0) {
    dbResults = await Promise.all(dbKeysToFetch.map(async (k) => {
      try { return await db.get(k); } catch { return undefined; }
    }));
  }

  // Fill results from DB batch
  for (let i = 0; i < dbResults.length; i++) {
    const dbElevation = dbResults[i];
    const index = dbIndexesToFetch[i];
    const key = keys[index];
    if (typeof dbElevation === 'number' || dbElevation === null) {
      elevationCache.set(key, dbElevation);
      results[index] = dbElevation;
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
    } catch (err: any) {
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
      const dbKey = `elevation:${key}`;
      db.put(dbKey, elevation).then(() => {
        // saved to DB cache
      }).catch(() => {
        // failed to save to DB cache
      });
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