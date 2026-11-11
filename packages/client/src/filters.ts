import type { Campsite } from "./types/Campsite";

// Filters for the map, applied on top of the text search.

export interface Origin {
  lat: number;
  lng: number;
  label: string; // "your location" or the place that was searched
}

export interface Filters {
  activities: string[]; // keys from ACTIVITY_GROUPS; a campsite must match all of them
  state: string; // "" for any state
  minElevationFt: number | null;
  maxElevationFt: number | null;
  minStayDays: number | null;
  origin: Origin | null;
  radiusMiles: number | null; // null for any distance
}

export const EMPTY_FILTERS: Filters = {
  activities: [],
  state: "",
  minElevationFt: null,
  maxElevationFt: null,
  minStayDays: null,
  origin: null,
  radiusMiles: null,
};

export const RADIUS_OPTIONS = [25, 50, 100, 200];
export const DEFAULT_RADIUS = 50;
export const STAY_OPTIONS = [7, 14];

// The BLM lists about 80 different activities, many of them near duplicates,
// so the filter offers a short list of groups instead.
export const ACTIVITY_GROUPS: { key: string; label: string; matches: string[] }[] = [
  { key: "hiking", label: "Hiking", matches: ["HIKING", "TRAIL RUNNING"] },
  { key: "backpacking", label: "Backpacking", matches: ["BACKPACKING"] },
  { key: "fishing", label: "Fishing", matches: ["FISHING", "FLY FISHING", "ICE FISHING"] },
  { key: "biking", label: "Biking", matches: ["BIKING", "MOUNTAIN BIKING"] },
  { key: "climbing", label: "Climbing", matches: ["CLIMBING", "ROCK CLIMBING", "BOULDERING"] },
  { key: "boating", label: "Boating and paddling", matches: ["BOATING", "NON-MOTORIZED BOATING", "KAYAKING", "CANOEING", "PADDLING", "RAFTING", "WHITEWATER RAFTING"] },
  { key: "swimming", label: "Swimming", matches: ["SWIMMING"] },
  { key: "horseback", label: "Horseback riding", matches: ["HORSEBACK RIDING"] },
  { key: "wildlife", label: "Wildlife viewing", matches: ["WILDLIFE VIEWING", "BIRD WATCHING", "BIRDING"] },
  { key: "hunting", label: "Hunting", matches: ["HUNTING"] },
  { key: "ohv", label: "Off-highway vehicles", matches: ["OFF HIGHWAY VEHICLE", "OHV"] },
  { key: "winter", label: "Winter sports", matches: ["SKIING", "SNOWSHOEING", "SNOWMOBILING", "SNOWMOBILE", "SKATE SKIING"] },
];

const GROUP_SETS = new Map(ACTIVITY_GROUPS.map((g) => [g.key, new Set(g.matches)]));

const FEET_PER_METER = 3.28084;
const EARTH_RADIUS_MILES = 3958.8;

export const metersToFeet = (m: number) => Math.round(m * FEET_PER_METER);

export const distanceMiles = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLng = (lng2 - lng1) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.min(1, Math.sqrt(a)));
};

// Compass direction from one point to another, e.g. "NE".
export const bearing = (lat1: number, lng1: number, lat2: number, lng2: number): string => {
  const rad = Math.PI / 180;
  const y = Math.sin((lng2 - lng1) * rad) * Math.cos(lat2 * rad);
  const x = Math.cos(lat1 * rad) * Math.sin(lat2 * rad) - Math.sin(lat1 * rad) * Math.cos(lat2 * rad) * Math.cos((lng2 - lng1) * rad);
  const deg = (Math.atan2(y, x) / rad + 360) % 360;
  return ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][Math.round(deg / 45) % 8];
};

// Turns the free-text stay limit into a number of days. Returns 0 when overnight
// stays aren't allowed and null when no limit is listed or it can't be read.
// With more than one number (seasonal limits) the shortest one is used.
const NUMBER_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7,
  eight: 8, nine: 9, ten: 10, fourteen: 14, sixteen: 16,
};

export const parseStayDays = (stayLimit?: string): number | null => {
  if (!stayLimit) return null;
  const text = stayLimit.trim();
  const pattern = new RegExp(`\\b(\\d+|${Object.keys(NUMBER_WORDS).join("|")})\\s*-?\\s*(?:consecutive\\s+)?(?:day|night)`, "gi");
  const days = [...text.matchAll(pattern)].map((m) => NUMBER_WORDS[m[1].toLowerCase()] ?? Number(m[1]));
  if (days.length === 0 && /^\d+$/.test(text)) days.push(Number(text));
  const valid = days.filter((d) => d > 0 && d <= 365);
  if (valid.length) return Math.min(...valid);
  if (/\b(no overnight|overnight (camping |use )?(is )?prohibited|closed to overnight)/i.test(text)) return 0;
  return null;
};

export const matchesActivityGroup = (site: Campsite, key: string): boolean => {
  const set = GROUP_SETS.get(key);
  if (!set || !site.activities) return false;
  return site.activities.some((a) => set.has(a.trim().toUpperCase()));
};

export const activeFilterCount = (f: Filters): number =>
  f.activities.length +
  (f.state ? 1 : 0) +
  (f.minElevationFt != null || f.maxElevationFt != null ? 1 : 0) +
  (f.minStayDays != null ? 1 : 0) +
  (f.origin ? 1 : 0);

export interface FilteredCampsite {
  site: Campsite;
  distance: number | null; // miles from the origin, when one is set
}

// Applies the filters and, when there's an origin, sorts closest first.
export const applyFilters = (campsites: Campsite[], f: Filters): FilteredCampsite[] => {
  const minM = f.minElevationFt != null ? f.minElevationFt / FEET_PER_METER : null;
  const maxM = f.maxElevationFt != null ? f.maxElevationFt / FEET_PER_METER : null;
  const results: FilteredCampsite[] = [];

  for (const site of campsites) {
    if (f.state && site.state !== f.state) continue;
    if (f.activities.length && !f.activities.every((key) => matchesActivityGroup(site, key))) continue;
    if (minM != null || maxM != null) {
      if (site.elevation == null) continue;
      if (minM != null && site.elevation < minM) continue;
      if (maxM != null && site.elevation > maxM) continue;
    }
    if (f.minStayDays != null) {
      const days = parseStayDays(site.stayLimit);
      if (days == null || days < f.minStayDays) continue;
    }
    let distance: number | null = null;
    if (f.origin) {
      distance = distanceMiles(f.origin.lat, f.origin.lng, site.lat, site.lng);
      if (f.radiusMiles != null && distance > f.radiusMiles) continue;
    }
    results.push({ site, distance });
  }

  if (f.origin) results.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
  return results;
};

// States in the data with how many campsites each has, most first.
export const stateOptions = (campsites: Campsite[]): { state: string; count: number }[] => {
  const counts = new Map<string, number>();
  for (const s of campsites) if (s.state) counts.set(s.state, (counts.get(s.state) ?? 0) + 1);
  return [...counts].map(([state, count]) => ({ state, count })).sort((a, b) => a.state.localeCompare(b.state));
};
