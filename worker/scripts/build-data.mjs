// Downloads the campsite JSON that blm-spider commits each week and writes it
// into the client build as static files the Worker can serve without parsing
// the whole 4 MB file on every request (the free plan has a 10 ms CPU limit).
//
// It also cleans up state names and adds each campsite's elevation (in meters)
// so the map can filter by elevation. Elevations are saved in
// worker/data/elevations.json, so only new campsites need a lookup.
//
// Usage: node worker/scripts/build-data.mjs <outDir>
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const SOURCE =
  process.env.BLM_DATA_URL ||
  'https://raw.githubusercontent.com/baileydunning/blm-spider/main/data/blm-campsites.json';
const ELEVATION_URL = process.env.ELEVATION_URL || 'https://api.open-meteo.com/v1/elevation';
const ELEVATION_BATCH = 100; // Open-Meteo accepts up to 100 points per request
// Open-Meteo's free tier counts every point toward a limit of 600 a minute, so
// leave a gap between batches to stay under it.
const ELEVATION_GAP_MS = Number(process.env.ELEVATION_GAP_MS ?? 15000);
const RATE_LIMIT_WAIT_MS = Number(process.env.RATE_LIMIT_WAIT_MS ?? 65000);

// Elevations never change, so each campsite is looked up once and saved here
// (keyed by campsite ID, in meters). Commit this file after it changes.
const CACHE_FILE = fileURLToPath(new URL('../data/elevations.json', import.meta.url));

// The scraped state is sometimes doubled ("OregonOregon") or in capitals ("OREGON").
export const cleanState = (value) => {
  let s = typeof value === 'string' ? value.trim() : '';
  const half = s.length / 2;
  if (s.length % 2 === 0 && half > 0 && s.slice(0, half) === s.slice(half)) s = s.slice(0, half);
  if (s && s === s.toUpperCase()) {
    s = s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return s;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const readCache = async () => {
  try {
    return JSON.parse(await readFile(CACHE_FILE, 'utf8'));
  } catch {
    return {};
  }
};

// Looks up elevations in meters and returns a map of campsite ID to elevation.
// Waits and retries when rate limited, and stops early if the daily limit is
// used up. A failed lookup never fails the build.
const fetchElevations = async (sites) => {
  const found = {};
  for (let start = 0; start < sites.length; start += ELEVATION_BATCH) {
    if (start > 0) await sleep(ELEVATION_GAP_MS);
    const batch = sites.slice(start, start + ELEVATION_BATCH);
    const url =
      `${ELEVATION_URL}?latitude=${batch.map((s) => s.lat.toFixed(5)).join(',')}` +
      `&longitude=${batch.map((s) => s.lng.toFixed(5)).join(',')}`;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
        if (res.status === 429) {
          const reason = (await res.json().catch(() => ({})))?.reason ?? '';
          if (/daily|hourly/i.test(reason)) {
            console.warn(`Elevation lookups stopped: ${reason}`);
            return found;
          }
          throw Object.assign(new Error(reason || 'HTTP 429'), { rateLimited: true });
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const { elevation } = await res.json();
        if (!Array.isArray(elevation) || elevation.length !== batch.length) throw new Error('bad response');
        elevation.forEach((m, i) => {
          if (typeof m === 'number' && Number.isFinite(m)) found[batch[i].id] = Math.round(m);
        });
        console.log(`Elevation: ${Math.min(start + batch.length, sites.length)} of ${sites.length}`);
        break;
      } catch (err) {
        if (attempt === 3) {
          console.warn(`Elevation lookup failed for points ${start}-${start + batch.length - 1}: ${err.message}`);
        } else {
          await sleep(err.rateLimited ? RATE_LIMIT_WAIT_MS : 2000 * attempt);
        }
      }
    }
  }
  return found;
};

const main = async () => {
  const outDir = process.argv[2];
  if (!outDir) throw new Error('Usage: node build-data.mjs <outDir>');

  const res = await fetch(SOURCE);
  if (!res.ok) throw new Error(`Failed to download campsite data: ${res.status}`);
  const raw = await res.json();

  const campsites = raw
    .filter(
      (s) =>
        s && typeof s.id === 'string' && /^[a-zA-Z0-9_-]+$/.test(s.id) &&
        typeof s.lat === 'number' && typeof s.lng === 'number' &&
        !Number.isNaN(s.lat) && !Number.isNaN(s.lng)
    )
    .map((s) => ({ ...s, state: cleanState(s.state) }));
  if (campsites.length === 0) throw new Error('No valid campsites in source data');

  const cache = await readCache();
  const missing = [];
  for (const s of campsites) {
    if (typeof s.elevation === 'number') continue;
    if (typeof cache[s.id] === 'number') s.elevation = cache[s.id];
    else missing.push(s);
  }
  console.log(`Elevation: ${campsites.length - missing.length} of ${campsites.length} campsites already known`);

  if (missing.length && process.env.SKIP_ELEVATION !== '1') {
    const found = await fetchElevations(missing);
    for (const s of missing) if (found[s.id] != null) s.elevation = found[s.id];
    const count = Object.keys(found).length;
    if (count) {
      await mkdir(path.dirname(CACHE_FILE), { recursive: true });
      const updated = { ...cache, ...found };
      // One campsite per line keeps the diffs small when new ones are added.
      const lines = Object.keys(updated).sort().map((id) => `  ${JSON.stringify(id)}: ${updated[id]}`);
      await writeFile(CACHE_FILE, `{\n${lines.join(',\n')}\n}\n`);
    }
    console.log(`Looked up elevation for ${count} of ${missing.length} campsites`);
  }

  await mkdir(path.join(outDir, 'campsites'), { recursive: true });
  await writeFile(path.join(outDir, 'campsites.json'), JSON.stringify(campsites));
  await Promise.all(
    campsites.map((s) =>
      writeFile(path.join(outDir, 'campsites', `${s.id}.json`), JSON.stringify(s))
    )
  );
  console.log(`Wrote ${campsites.length} campsites to ${outDir}`);
};

// Only run when called as a script, so cleanState can be imported in tests.
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('build-data.mjs')) {
  await main();
}
