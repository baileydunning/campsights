# Campsights

Campsights is a full-stack web app for discovering dispersed campsites on public land. It features an interactive map where users can explore campsite locations, check real-time weather forecasts and elevation data, get directions, and access official BLM detail pages.

Campsite data is powered by my custom [BLM Spider API](https://github.com/baileydunning/blm-spider), which scrapes the Bureau of Land Management website and filters out sites restricted to day use or that don’t meet certain criteria. Each site is enriched with weather data from the National Weather Service and elevation data from Open-Elevation API, based on its coordinates.

*Disclaimer:* Not all locations shown on the map are confirmed campsites. Some may be trailheads, parking areas, or general points of interest. Elevation and weather data are approximate and may not reflect current or exact conditions. Always verify site details and local regulations before heading out.

**Live project link:** https://campsights.onrender.com/

**Interactive API docs and schema:** https://campsights.onrender.com/docs

**Spider docs:** https://blm-spider.onrender.com/docs

## Tech Stack

- **Frontend:** React, Vite, TypeScript, Redux Toolkit, React-Leaflet, Vitest, CSS Modules
- **Backend:** Express, TypeScript, BLM Spider API, National Weather Service API integration, Open Elevation API integration
- **Monorepo:** Managed with [Lerna](https://lerna.js.org/)
- **Testing:** Vitest (client & server)
- **Containerization:** Docker, Docker Compose

## Features

- Search and view campsites scraped from the BLM website on an interactive Leaflet map
- See multi-day weather forecasts and elevation data for each campsite
- Get directions to any campsite via Google Maps
- Comprehensive unit and integration tests using Vitest
- Installable as a **Progressive Web App (PWA)** for offline use:
  - Add to your home screen or desktop for a native app experience
  - Works offline: previously loaded data and the app shell are available without a network connection
  - Caches static assets and API responses for fast repeat visits

## Monorepo & Lerna

This project uses a **monorepo** structure managed by [Lerna](https://lerna.js.org/).  
Lerna helps manage multiple packages (the frontend and backend) in a single repository. Install all the dependencies for both packages by running `npm i` at root.

**Packages:**
- `packages/client` — The React frontend
- `packages/server` — The Express backend

## Running with Docker

Docker in this app is used to package both the frontend (React) and backend (Express) into a single container.

### Build and start the app

From the project root, run:

```sh
docker-compose up --build
```

- The app will be available at [http://localhost:4000](http://localhost:4000)
- Both the frontend (React) and backend API are served from this address.

### Stopping the app

Press `Ctrl+C` in the terminal running Docker Compose, or run:

```sh
docker-compose down
```

## Local Development (without Docker)

You can still run the client and server separately for development:

```sh
# In one terminal
cd server
npm install
npm run dev

# In another terminal
cd client
npm install
npm run dev
```

- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend API: [http://localhost:3000/api/v1/campsites](http://localhost:3000/api/v1/campsites)

## API

### `GET /api/v1/campsites`
- **Description:** Returns a list of all campsites from the BLM Spider API.
- **Response:**
  - Status: `200 OK`
  - Body: Array of campsite objects (elevation data only attached for individual campsite requests)
    ```json
    [
      {
        "id": "string",
        "name": "string",
        "url": "string",
        "lat": number,
        "lng": number,
        "state": "string",
        "mapLink": "string",
        "description?": "string",
        "directions?": "string",
        "activities?": ["string"],
        "campgrounds?": ["string"],
        "wildlife?": ["string"],
        "fees?": "string",
        "stayLimit?": "string",
        "images?": [
          {
            "src": "string",
            "alt": "string",
            "credit": "string"
          }
        ],
        "source": "BLM"
      },
      ...
    ]
    ```

### `GET /api/v1/campsites/:id`
- **Description:** Returns a specific campsite by ID with enriched elevation and weather data.
- **Response:**
  - Status: `200 OK`
  - Body: Campsite object with weather and elevation data attached
```json
    {
      "id": "string",
      "name": "string",
      "url": "string",
      "lat": number,
      "lng": number,
      "state": "string",
      "mapLink": "string",
      "elevation?": number,
      "description?": "string",
      "directions?": "string",
      "activities?": ["string"],
      "campgrounds?": ["string"],
      "wildlife?": ["string"],
      "fees?": "string",
      "stayLimit?": "string",
      "images?": [
        {
          "src": "string",
          "alt": "string",
          "credit": "string"
        }
      ],
      "source": "BLM",
      "weather?": [
        {
              "number": number,
              "name": "string",
              "startTime": "string",
              "endTime": "string",
              "isDaytime": boolean,
              "temperature": number,
              "temperatureUnit": "string",
              "temperatureTrend": "string",
              "probabilityOfPrecipitation": {
                  "unitCode": "string",
                  "value": number
              },
              "windSpeed": "string",
              "windDirection": "string",
              "icon": "string",
              "shortForecast": "string",
              "detailedForecast": "string"
          },
          ...
      ] 
    }
```

## Elevation Data

Campsights uses the [Open-Elevation API](https://github.com/Jorl17/open-elevation/blob/master/docs/api.md) to fetch elevation data for campsites based on their latitude and longitude.

- **How it works:**
  - Elevation data is only fetched and attached when requesting individual campsites via `/api/v1/campsites/:id`.
  - The backend queries the Open-Elevation API using the campsite's coordinates and caches the result in memory.
  - Elevation data is cached by coordinate pair to avoid redundant API calls for the same location.
  - The elevation (in meters) is included in the API response for individual campsite requests.
  - If the Open-Elevation API is unavailable or returns an error, the elevation is set to `null` and displayed as "Unknown" in the UI.

## Weather Data

Campsights uses the [National Weather Service (NWS) API](https://www.weather.gov/documentation/services-web-api) to provide detailed weather forecasts for campsite locations.

- **How it works:**
  - Weather data is only fetched and attached when requesting individual campsites via `/api/v1/campsites/:id`.
  - The backend queries the NWS `/points/{lat},{lng}` endpoint to get the appropriate forecast URL for the location, then fetches the multi-day forecast.
  - Weather data is cached in memory with a 10-minute TTL to reduce API calls and improve performance.
  - The weather forecast is included in the API response for individual campsite requests.
  - The frontend displays the weather data provided by the backend.
  - If the NWS API is unavailable or returns an error, a user-friendly error message is shown and weather data is omitted for that campsite.

- **NWS API Reference:**
  - [API Documentation](https://www.weather.gov/documentation/services-web-api)
  - Example forecast request:
    `GET https://api.weather.gov/points/39.7392,-104.9903`
  - Example forecast response (truncated):
    ```json
    {
      "properties": {
        "forecast": "https://api.weather.gov/gridpoints/BOU/62,61/forecast"
      }
    }
    ```
    Then:
    `GET https://api.weather.gov/gridpoints/BOU/62,61/forecast`
    ```json
    {
      "properties": {
        "periods": [
          {
            "name": "Today",
            "startTime": "2025-06-29T06:00:00-06:00",
            "temperature": 75,
            "temperatureUnit": "F",
            "windSpeed": "10 mph",
            "windDirection": "NW",
            "shortForecast": "Sunny",
            "detailedForecast": "Sunny, with a high near 75. Northwest wind 10 mph."
          },
          // ...more periods...
        ]
      }
    }
    ```

## Performance, Optimization & Caching

**Two-Tier Data Loading**
+ GET /api/v1/campsites returns raw BLM data instantly—no elevation or weather—for fast list rendering.
+ GET /api/v1/campsites/:id fetches and caches elevation and weather on demand for detailed views.

**In-Memory Caching**
+ Elevation is cached by coordinates with no expiration.
+ Weather is cached per campsite with a 10-minute TTL.
+ All caching is in-memory for fast access with no database or disk usage.

**Rate Limiting and Retries**
+ External APIs are called within documented rate limits.
+ Transient errors are retried automatically with exponential backoff.

**Graceful Degradation**
+ If enrichment APIs fail, core campsite data is still returned.

**Type Safety and Error Handling**
+ Fully typed with TypeScript.
+ Clear error messages and fallback logic ensure reliability.