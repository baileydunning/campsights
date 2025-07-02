import fetch from 'node-fetch';
import { Elevation } from '../../models/elevationModel';

const elevationCache = new Map<string, number | null>();

export const getElevations = async (
  locations: { latitude: number; longitude: number }[]
): Promise<number[]> => {

  const keys = locations.map(({ latitude, longitude }) => `${latitude},${longitude}`);
  const results: Array<number | undefined> = [];
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
    const response = await fetch('https://api.open-elevation.com/api/v1/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locations: uncached }),
    });

    if (!response.ok) {
      throw new Error(`Open-Elevation API responded with status ${response.status}`);
    }
    const payload = (await response.json()) as { results: Elevation[] };
    if (!Array.isArray(payload.results) || payload.results.length !== uncached.length) {
      throw new Error('Elevation data missing or mismatched for requested coordinates.');
    }

    uncached.forEach((loc, i) => {
      const key = `${loc.latitude},${loc.longitude}`;
      const elevation = payload.results[i].elevation;
      elevationCache.set(key, elevation);
      results[uncachedIndexes[i]] = elevation;
    });
  }

  return results as number[];
};

export const getElevation = async (
  latitude: number,
  longitude: number
): Promise<number> => {
  const [elevation] = await getElevations([{ latitude, longitude }]);
  return elevation;
};

export function __clearElevationCache() {
  elevationCache.clear();
}