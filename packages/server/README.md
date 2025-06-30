# Campsights Server

This is the backend for the Campsights app, built with Express and TypeScript.  
It provides a REST API for managing campsite data, which is stored in an LMDB database.

## Features

- Serves campsite data to the frontend via REST API
- Accepts new campsite submissions via POST requests
- Accepts edit campsite submissions via PUT requests
- Stores all data in LMDB (Lightning Memory-Mapped Database)
- CORS enabled for local development
- Automatic database seeding from JSON data
- Full TypeScript support with proper error handling

## Getting Started

1. Install dependencies:
   ```sh
   npm install
   ```

2. Start the development server:
   ```sh
   npm run dev
   ```

3. Or start the production server:
   ```sh
   npm start
   ```

4. The API will be available at [http://localhost:3000/api/v1/campsites](http://localhost:3000/api/v1/campsites)

## API Endpoints

- `GET /api/v1/campsites` — List all campsites
- `POST /api/v1/campsites` — Add a new campsite
- `PUT /api/v1/campsites/:id` — Update an existing campsite
- `DELETE /api/v1/campsites/:id` — Delete a campsite

### POST Request Format

```json
{
  "id": "unique-string-id",
  "name": "Campsite Name",
  "description": "Description of the campsite",
  "lat": 39.7392,
  "lng": -104.9903,
  "requires_4wd": false,
  "last_updated": "2025-06-19T12:00:00.000Z"
}
```

### PUT Request Format

Send a request to `/api/v1/campsites/{id}` (replace `{id}` with the campsite's id). The body must include all fields except `id` (which is taken from the URL):

```json
{
  "name": "Updated Campsite Name",
  "description": "Updated description of the campsite",
  "lat": 39.7392,
  "lng": -104.9903,
  "requires_4wd": true,
  "last_updated": "2025-06-28T15:30:00Z"
}
```

### DELETE

- `DELETE /api/v1/campsites/:id` — Delete a campsite by its unique `id`.

## Scripts

- `npm run dev` — Start development server with hot reload
- `npm start` — Start server with ts-node
- `npm run build` — Compile TypeScript to JavaScript
- `npm run start:prod` — Start production server (requires build first)
- `npm test` — Run tests

## Database

- **Type**: LMDB (Lightning Memory-Mapped Database)
- **Location**: `data.lmdb/` directory
- **Seeding**: Automatically seeds from `data/campsites.json` on startup
- **Benefits**: High performance, ACID transactions, no separate server process needed

## Elevation & Weather Data

- When a campsite is **created** or its coordinates are **updated**, the backend automatically fetches the elevation for the provided coordinates using the [Open-Elevation API](https://github.com/Jorl17/open-elevation/blob/master/docs/api.md). The elevation (in meters) is stored with each campsite record in the database and included in all API responses. Elevation is only fetched once per campsite (on creation or coordinate change); all reads use the stored value. If the elevation cannot be fetched, it is set to `null`.
- When a campsite is **requested** (GET), the backend fetches the weather forecast for the campsite's coordinates from the [National Weather Service API](https://www.weather.gov/documentation/services-web-api) and includes it in the API response. The weather is always fetched live (not stored in the DB), and if the NWS API is unavailable, weather data is omitted for that campsite.
- The backend caches elevation lookups in memory to reduce redundant API calls, and caches weather data in memory for the duration of the process to reduce repeated requests for the same campsite.

## Architecture Overview

The backend is organized into controllers, services, and models for clarity and maintainability:

- **Controllers**: Handle HTTP requests and responses. Each route (e.g., `/api/v1/campsites`) has a controller that validates input, calls the appropriate service, and formats the response.
- **Services**: Contain business logic and data operations. For example, the Campsites Service manages CRUD operations and attaches elevation and weather data to each campsite, while the Elevation Service handles communication with the Open-Elevation API and caching, and the Weather Service fetches forecasts from the NWS API.
- **Models**: Define TypeScript interfaces for data structures (e.g., `Campsite`, `Elevation`, `Weather`).
- **Database**: Uses LMDB for fast, persistent key-value storage. Data is seeded from JSON on startup.

### Example Flow

1. **POST /api/v1/campsites**: Controller validates the request and calls the Campsites Service.
2. **Campsites Service**: Stores the campsite, fetches elevation (if not already present or if coordinates changed), and updates the record.
3. **Elevation Service**: Checks the cache, then queries the Open-Elevation API if needed.
4. **Weather Service**: When a campsite is requested, fetches the weather forecast from the NWS API and attaches it to the response.
5. **Response**: The created or requested campsite, including elevation and weather, is returned to the client.
