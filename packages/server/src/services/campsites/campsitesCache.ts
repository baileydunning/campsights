import { Campsite } from '../../models/campsiteModel';
import { db } from '../../config/db';

let cachedCampsites: Campsite[] | null = null;
let lastCacheTime: number = 0;
const CACHE_TTL = 1000 * 60 * 60 * 6; // 6 hours

export async function getCachedCampsites(): Promise<Campsite[]> {
  const now = Date.now();
  if (cachedCampsites && (now - lastCacheTime < CACHE_TTL)) {
    return cachedCampsites;
  }
  // Rebuild cache
  const campsites: Campsite[] = [];
  for (const { value } of db.getRange({})) {
    campsites.push(value as Campsite);
  }
  cachedCampsites = campsites;
  lastCacheTime = now;
  return campsites;
}

export function invalidateCampsitesCache() {
  cachedCampsites = null;
  lastCacheTime = 0;
}
