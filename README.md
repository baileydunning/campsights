# Campsights

Campsights is a map of dispersed campsites on Bureau of Land Management (BLM) public land. You can search the map, check the weather, see who manages the surrounding land, look for nearby wildfires, and open a detailed page for each campsite with photos, a forecast, directions and sun times.

**Live site:** https://campsights.guide

**API docs:** https://campsights.guide/docs

Campsite data comes from my [BLM Spider](https://github.com/baileydunning/blm-spider), which scrapes the BLM website every week and filters out day-use areas and other places that aren't campsites.

> **Disclaimer:** Not every location on the map is a confirmed campsite. Some are trailheads, staging areas or other points of interest. Weather, elevation and land ownership data are approximate. Always check current rules, closures and fire restrictions with the local BLM office before you go.

## Features

### Map

- All 2,000+ BLM campsites on an interactive Leaflet map, grouped into numbered clusters when zoomed out
- Base maps: **Streets** (OpenStreetMap), **Topo** (USGS) and **Satellite** (Esri)
- Overlays you can turn on and off:
  - **Campsites**
  - **Land ownership** from the BLM Surface Management Agency layer (BLM, Forest Service, state, private and so on)
  - **Wildfire perimeters** for current fires from the National Interagency Fire Center. Click a fire for its name, size and containment. The data only downloads when the layer is turned on.
- Show my location, full screen, zoom and a scale bar in miles
- Tapping a campsite opens a small preview card with a photo, short description, top activities, and buttons for directions and details
- The map remembers where you were when you come back from a campsite page

### Search

- Search by name, state, activity or anything else in the campsite listing (for example "Moab", "fishing" or "Utah")
- Multi-word searches match campsites that contain all of the words
- The map zooms to fit the results after you stop typing
- Shows how many campsites match

### Campsite pages

Every campsite has its own page at `/campsites/:id` that can be bookmarked or shared.

- Photo gallery with captions and credits (swipe on phones). Campsites without photos show a satellite view instead.
- Distance and direction from the nearest town
- Active National Weather Service alerts, such as red flag or winter storm warnings
- 7-day forecast with highs, lows, conditions and chance of precipitation
- Description, activities, directions, fees and permits, wildlife and nearby campgrounds when the BLM lists them
- Elevation, coordinates (tap to copy), stay limit, and today's sunrise, sunset and hours of daylight in local time
- A small map with the base map switcher and land ownership overlay, plus links to Google Maps, Apple Maps and CalTopo
- Directions through Google Maps, a link to the official BLM page, and a share button

### Phones and offline use

- Designed for phones first: the search panel, map controls and popups fit screens as narrow as an iPhone SE, buttons meet Apple's 44px touch target size, and the layout respects the notch and home indicator
- Installable as a Progressive Web App (PWA) with an app icon and full screen display
- The app shell is cached by a service worker for faster repeat visits. Campsite data is cached in the browser for 24 hours.
- After a new deploy, open tabs reload themselves once instead of breaking
- The service worker is turned off on `localhost` so local runs always show the latest build

## How it works

```
BLM website ──(weekly scrape)──> blm-spider repo: data/blm-campsites.json
                                          │
                     Deploy to Cloudflare workflow (weekly + manual)
                                          │
                  React app + campsite data files ──> Cloudflare Worker ──> campsights.guide
                                                           │
                                weather.gov (forecast, alerts, nearest town)
                                open-elevation.com (elevation)
```

1. The [BLM Spider](https://github.com/baileydunning/blm-spider) runs every Sunday in GitHub Actions and commits a fresh `data/blm-campsites.json`.
2. The **Deploy to Cloudflare** workflow in this repo builds the React app, downloads that JSON, and splits it into one file with every campsite plus one small file per campsite.
3. Everything is deployed to a **Cloudflare Worker**. The app and data files are served as static assets. The Worker handles the API, adding weather, alerts, nearest town and elevation to single-campsite requests.
4. Wildfire perimeters and map tiles are loaded straight from their public sources in the browser.

Hosting is free on Cloudflare's free plan. The only cost is the domain.

## Tech stack

- **Frontend:** React 19, TypeScript, Vite, Redux Toolkit, React Router, React-Leaflet, Leaflet.markercluster
- **Hosting and API:** Cloudflare Workers with static assets
- **Alternate server:** Express and TypeScript (used for Docker)
- **Data:** BLM Spider, National Weather Service API, Open-Elevation API, BLM Surface Management Agency map tiles, NIFC WFIGS fire perimeters, USGS, Esri and OpenStreetMap tiles
- **Testing:** Vitest and Testing Library
- **Monorepo:** npm workspaces and [Lerna](https://lerna.js.org/)

## Getting started

Requires Node.js 22 or newer.

```sh
npm install
npm start
```

Then open http://localhost:8787.

`npm start` builds the React app, downloads the latest campsite data, and runs the Cloudflare Worker locally with Wrangler, so you see the same thing that runs in production. Rerun it after making changes.

Other commands:

| Command | What it does |
| --- | --- |
| `npm start` | Build everything and run the Worker locally on port 8787 |
| `npm run build:cf` | Build the app and campsite data without starting a server |
| `npm test` | Run the client and server tests |
| `npm run dev --workspace client` | Vite dev server with hot reload on port 5173. The API calls need the Express server running on port 3000. |

### Docker

The Docker setup runs the Express server, which serves the app and the API on one port:

```sh
docker-compose up --build
```

The app is available at http://localhost:4000. Stop it with `Ctrl+C` or `docker-compose down`.

The Express server returns campsites, weather and elevation, but not the newer fields (alerts, nearest town, time zone). Campsite pages still work without them.

## Deployment

Deploys run from the **Deploy to Cloudflare** workflow (`.github/workflows/deploy-cloudflare.yml`). Start it from the Actions tab with **Run workflow**. It also runs every Monday to pick up Sunday's scrape.

One-time setup:

1. Create a Cloudflare API token from the **Edit Cloudflare Workers** template, add **DNS: Edit** and **Zone: Read**, and limit the zone to `campsights.guide`.
2. Add two repository secrets under Settings > Secrets and variables > Actions:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
3. Make sure no other DNS records exist for `campsights.guide` or `www.campsights.guide`. The deploy creates them, and `www` redirects to the bare domain.

Worker settings live in `worker/wrangler.jsonc`.

## API

### `GET /api/v1/campsites`

Returns every campsite as a JSON array. This is the raw BLM data with no weather or elevation, so it loads quickly.

```json
[
  {
    "id": "string",
    "name": "string",
    "url": "string",
    "lat": 0,
    "lng": 0,
    "state": "string",
    "mapLink": "string",
    "description": "string",
    "directions": "string",
    "activities": ["string"],
    "campgrounds": ["string"],
    "wildlife": ["string"],
    "fees": "string",
    "stayLimit": "string",
    "images": [{ "src": "string", "alt": "string", "credit": "string" }],
    "source": "BLM"
  }
]
```

Fields other than `id`, `name`, `url`, `lat`, `lng` and `source` are only present when the BLM lists them.

### `GET /api/v1/campsites/:id`

Returns one campsite with extra data added. Unknown IDs return `404`.

```json
{
  "...": "all of the fields above",
  "elevation": 1310,
  "weather": [
    {
      "number": 1,
      "name": "Today",
      "startTime": "2026-11-10T09:00:00-07:00",
      "endTime": "2026-11-10T18:00:00-07:00",
      "isDaytime": true,
      "temperature": 58,
      "temperatureUnit": "F",
      "probabilityOfPrecipitation": { "unitCode": "wmoUnit:percent", "value": 10 },
      "windSpeed": "5 to 10 mph",
      "windDirection": "SW",
      "shortForecast": "Sunny",
      "detailedForecast": "Sunny, with a high near 58."
    }
  ],
  "alerts": [
    {
      "event": "Red Flag Warning",
      "headline": "string",
      "severity": "Severe",
      "description": "string",
      "instruction": "string",
      "ends": "2026-11-11T02:00:00Z"
    }
  ],
  "nearestTown": { "city": "Moab", "state": "UT", "distanceMiles": 12.3, "direction": "NE" },
  "timeZone": "America/Denver",
  "forecastUrl": "https://forecast.weather.gov/MapClick.php?lat=38.5&lon=-109.5"
}
```

- `elevation` is in meters, or `null` if it couldn't be looked up.
- `weather` is the National Weather Service forecast (alternating day and night periods). It's an empty array if the forecast is unavailable.
- `alerts` lists active NWS alerts for the location.
- `nearestTown.direction` is the direction of the campsite from the town.

### Other routes

- `GET /health` returns `{ "status": "ok", "timestamp": "..." }`
- `GET /docs` serves Swagger UI for `packages/server/openapi.yaml`

API requests from other websites are rejected. Requests without an `Origin` header (curl, server-side code) are allowed.

## Caching

- **Campsite data** is static files on Cloudflare, cached for an hour, and cached in the browser for 24 hours.
- **Forecasts** are cached for 10 minutes, **alerts** for 5 minutes, **NWS location lookups** for a day, and **elevation** for 30 days, all through Cloudflare's cache.
- If weather, alerts or elevation fail, the campsite is still returned with those fields empty.
- The Worker never parses the full 4 MB campsite file at request time, which keeps it under the free plan's 10 ms CPU limit.

## Project structure

```
packages/
  client/            React app
    src/
      components/
        MapView/       Map, layers, clusters, controls, fire perimeters
        CampsiteMarker/ Map marker and preview card
        CampsitePage/  Campsite detail page, gallery, forecast, sun times
        SearchBar/
      store/           Redux slice for campsite data
      pwa.ts           Service worker registration and stale build recovery
  server/            Express server (Docker and local API) and openapi.yaml
worker/
  src/index.ts       Cloudflare Worker API
  scripts/build-data.mjs  Splits the BLM Spider JSON into static data files
  wrangler.jsonc     Worker and custom domain config
.github/workflows/
  deploy-cloudflare.yml   Manual and weekly deploy
```
