// Downloads the campsite JSON that blm-spider commits each week and writes it
// into the client build as static files the Worker can serve without parsing
// the whole 4 MB file on every request (the free plan has a 10 ms CPU limit).
//
// Usage: node worker/scripts/build-data.mjs <outDir>
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const SOURCE =
  process.env.BLM_DATA_URL ||
  'https://raw.githubusercontent.com/baileydunning/blm-spider/main/data/blm-campsites.json';
const outDir = process.argv[2];
if (!outDir) throw new Error('Usage: node build-data.mjs <outDir>');

const res = await fetch(SOURCE);
if (!res.ok) throw new Error(`Failed to download campsite data: ${res.status}`);
const raw = await res.json();

const campsites = raw.filter(
  (s) =>
    s && typeof s.id === 'string' && /^[a-zA-Z0-9_-]+$/.test(s.id) &&
    typeof s.lat === 'number' && typeof s.lng === 'number' &&
    !Number.isNaN(s.lat) && !Number.isNaN(s.lng)
);
if (campsites.length === 0) throw new Error('No valid campsites in source data');

await mkdir(path.join(outDir, 'campsites'), { recursive: true });
await writeFile(path.join(outDir, 'campsites.json'), JSON.stringify(campsites));
await Promise.all(
  campsites.map((s) =>
    writeFile(path.join(outDir, 'campsites', `${s.id}.json`), JSON.stringify(s))
  )
);
console.log(`Wrote ${campsites.length} campsites to ${outDir}`);
