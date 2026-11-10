// Campsights API on Cloudflare Workers. Replaces the Express server in
// packages/server for production. Static files (the React app and the
// campsite data under /data) are served by Workers static assets; this
// handles /api/*, /docs and /health.

interface Env {
  ASSETS: { fetch(input: Request | string | URL, init?: RequestInit): Promise<Response> };
}

const ALLOWED_ORIGINS = [
  'https://campsights.guide',
  'https://www.campsights.guide',
  'http://localhost:5173',
  'http://localhost:8787',
];

const UPSTREAM_HEADERS = {
  Accept: 'application/geo+json, application/json',
  // weather.gov rejects requests without a User-Agent.
  'User-Agent': 'campsights.guide',
};

const json = (body: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...extra },
  });

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;

    // Send www to the bare domain.
    if (url.hostname === 'www.campsights.guide') {
      url.hostname = 'campsights.guide';
      return Response.redirect(url.toString(), 301);
    }

    if (pathname === '/health') {
      return json({ status: 'ok', timestamp: new Date().toISOString() });
    }

    if (pathname === '/docs' || pathname === '/docs/') {
      return new Response(DOCS_HTML, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }

    if (pathname.startsWith('/api/')) {
      const origin = request.headers.get('Origin');
      if (origin && !ALLOWED_ORIGINS.includes(origin)) {
        return json({ error: 'API access denied: invalid origin' }, 403);
      }
      if (request.method !== 'GET') return json({ error: 'Method Not Allowed' }, 405);

      if (pathname === '/api/v1/campsites' || pathname === '/api/v1/campsites/') {
        return getCampsites(request, env);
      }
      const match = pathname.match(/^\/api\/v1\/campsites\/([^/]+)\/?$/);
      if (match) return getCampsiteById(decodeURIComponent(match[1]), request, env);
    }

    return json({ error: 'Not Found' }, 404);
  },
};

async function getCampsites(request: Request, env: Env): Promise<Response> {
  const res = await env.ASSETS.fetch(new URL('/data/campsites.json', request.url));
  if (!res.ok) return json({ error: 'Unable to fetch campsites' }, 500);
  // Pass the body straight through; parsing 4 MB of JSON would blow the CPU limit.
  return new Response(res.body, {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600' },
  });
}

async function getCampsiteById(id: string, request: Request, env: Env): Promise<Response> {
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
    return json({ error: 'id is required and must be a string' }, 400);
  }
  const res = await env.ASSETS.fetch(new URL(`/data/campsites/${id}.json`, request.url));
  // A missing file falls back to index.html (SPA mode), so check the content type too.
  if (!res.ok || !res.headers.get('Content-Type')?.includes('json')) {
    return json({ error: 'Campsite not found' }, 404);
  }
  const site = (await res.json()) as { lat: number; lng: number; elevation?: number | null };

  const [weather, elevation] = await Promise.all([
    getWeather(site.lat, site.lng),
    site.elevation != null ? Promise.resolve(site.elevation) : getElevation(site.lat, site.lng),
  ]);

  return json({ ...site, elevation, weather }, 200, { 'Cache-Control': 'public, max-age=600' });
}

// Cloudflare's cache (cf.cacheTtl) stands in for the in-memory caches the Express server used.
async function getWeather(lat: number, lng: number): Promise<unknown[]> {
  try {
    const points = await fetch(`https://api.weather.gov/points/${round(lat, 4)},${round(lng, 4)}`, {
      headers: UPSTREAM_HEADERS,
      signal: AbortSignal.timeout(8000),
      cf: { cacheTtl: 86400, cacheEverything: true },
    } as RequestInit);
    if (!points.ok) throw new Error(`Points API ${points.status}`);
    const forecastUrl = ((await points.json()) as any)?.properties?.forecast;
    if (!forecastUrl) throw new Error('No forecast URL');

    const forecast = await fetch(forecastUrl, {
      headers: UPSTREAM_HEADERS,
      signal: AbortSignal.timeout(8000),
      cf: { cacheTtl: 600, cacheEverything: true },
    } as RequestInit);
    if (!forecast.ok) throw new Error(`Forecast API ${forecast.status}`);
    return ((await forecast.json()) as any)?.properties?.periods ?? [];
  } catch (err) {
    console.error('Weather fetch error', lat, lng, err);
    return [];
  }
}

async function getElevation(lat: number, lng: number): Promise<number | null> {
  try {
    const res = await fetch(
      `https://api.open-elevation.com/api/v1/lookup?locations=${round(lat, 4)},${round(lng, 4)}`,
      {
        headers: UPSTREAM_HEADERS,
        signal: AbortSignal.timeout(6000),
        cf: { cacheTtl: 2592000, cacheEverything: true },
      } as RequestInit
    );
    if (!res.ok) throw new Error(`Elevation API ${res.status}`);
    return ((await res.json()) as any)?.results?.[0]?.elevation ?? null;
  } catch (err) {
    console.error('Elevation fetch error', lat, lng, err);
    return null;
  }
}

const round = (n: number, places: number) => Math.round(n * 10 ** places) / 10 ** places;

// Swagger UI for the OpenAPI spec the workflow copies to /openapi.yaml.
const DOCS_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Campsights API Docs</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.17.14/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.17.14/swagger-ui-bundle.js"></script>
  <script>SwaggerUIBundle({ url: '/openapi.yaml', dom_id: '#swagger-ui' });</script>
</body>
</html>`;
