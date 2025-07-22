# Campsights Server

This is the backend for the Campsights app, built with Express and TypeScript.  
It provides a REST API for managing campsite data, which is stored in an LMDB database.


## Features

- Serves campsite data to the frontend via REST API
- Accepts new campsite submissions via POST requests
- Accepts edit campsite submissions via PUT requests
- JWT authentication for user registration, login, and all protected endpoints (edit/delete campsites)
- Stores campsite data in LMDB (Lightning Memory-Mapped Database)
- Stores user accounts in SQLite (file-based, persistent)
- CORS enabled for local development
- Automatic database seeding from JSON data
- Full TypeScript support with proper error handling


## Architecture Overview

The backend is organized into controllers, services, models, and two separate databases for clarity and maintainability:

- **Controllers**: Handle HTTP requests and responses. Each route (e.g., `/api/v1/campsites`) has a controller that validates input, calls the appropriate service, and formats the response.
- **Services**: Contain business logic and data operations. For example, the Campsites Service manages CRUD operations and attaches elevation and weather data to each campsite, while the Elevation Service handles communication with the Open-Elevation API and caching, and the Weather Service fetches forecasts from the NWS API.
- **Models**: Define TypeScript interfaces for data structures (e.g., `Campsite`, `Elevation`, `Weather`).
- **Databases**:
  - **LMDB**: Used for all campsite data. LMDB is a high-performance, ACID-compliant key-value store. Campsite records are stored and retrieved by ID, and the database is automatically seeded from `data/campsites.json` on startup if empty. Elevation values are also cached in LMDB for fast lookups.
  - **SQLite**: Used for user accounts and authentication. Usernames and password hashes are stored in a file-based SQLite database (`data/users.sqlite3`). All authentication and authorization logic (register, login, password validation) uses this database. The directory is created automatically if it does not exist.

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

- `POST /api/v1/auth/register` — Register a new user (returns JWT)
- `POST /api/v1/auth/login` — Log in as a user (returns JWT)
- `GET /api/v1/campsites` — List all campsites
- `GET /api/v1/campsites/:id` — Get a campsite by id
- `POST /api/v1/campsites` — Add a new campsite (requires authentication)
- `PUT /api/v1/campsites/:id` — Update an existing campsite (requires authentication)
- `DELETE /api/v1/campsites/:id` — Delete a campsite (requires authentication)

### Authentication

**Campsights uses JWT-based authentication for all protected endpoints.**

- Register a user: `POST /api/v1/auth/register` with `{ "username": "yourusername", "password": "yourpassword" }`
- Log in: `POST /api/v1/auth/login` with the same body. Both return `{ token: "<JWT>" }`.
- For any protected route (add, edit, delete campsites), include the JWT in the `Authorization` header:

```http
Authorization: Bearer <your-jwt-token>
```

If the token is missing or invalid, the API will return a 401 Unauthorized error.

#### Example: Register a user

```sh
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"yourusername","password":"yourpassword"}'
```

#### Example: Authenticated request

```sh
curl -X POST http://localhost:3000/api/v1/campsites \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{ ...campsite fields... }'
```

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

- `DELETE /api/v1/campsites/:id` — Delete a campsite by its unique `id`. Requires authentication.

## Scripts

- `npm run dev` — Start development server with hot reload
- `npm start` — Start server with ts-node
- `npm run build` — Compile TypeScript to JavaScript
- `npm run start:prod` — Start production server (requires build first)
- `npm test` — Run tests


## Database Details

### Campsite Data (LMDB)
- **Type**: LMDB (Lightning Memory-Mapped Database)
- **Location**: `data.lmdb/` directory
- **Seeding**: Automatically seeds from `data/campsites.json` on startup
- **Benefits**: High performance, ACID transactions, no separate server process needed
- **Usage**: All campsite CRUD operations, elevation caching, and batch lookups

### User Accounts (SQLite)
- **Type**: SQLite (file-based, persistent)
- **Location**: `data/users.sqlite3`
- **Benefits**: Simple, reliable, and portable; supports unique usernames and secure password hashing
- **Usage**: All user registration, login, and authentication logic
- **Setup**: The database file and parent directory are created automatically if missing


## Elevation & Weather Data

- When a campsite is **created** or its coordinates are **updated**, the backend fetches the elevation for the provided coordinates using the [Open-Elevation API](https://github.com/Jorl17/open-elevation/blob/master/docs/api.md). The elevation (in meters) is stored with each campsite record in the database and included in all API responses. Elevation is only fetched once per campsite (on creation or coordinate change); all reads use the stored value. If the elevation cannot be fetched, it is set to `null`.
- When a campsite is **requested** (GET), the backend fetches the weather forecast for the campsite's coordinates from the [National Weather Service API](https://www.weather.gov/documentation/services-web-api) and includes it in the API response. The weather is always fetched live (not stored in the DB), and if the NWS API is unavailable, weather data is omitted for that campsite.

### Elevation Caching & Batching

- **In-Memory Cache:** Elevation lookups are cached in memory, keyed by coordinate, to avoid redundant API calls for the same location. This cache is used for both single and batch elevation requests.
- **Database Cache:** Once elevation is fetched for a campsite, it is stored in the LMDB database and reused for all future reads, unless the coordinates change.
- **Batching:** When multiple campsites need elevation (e.g., on initial load), the backend batches requests to the Open-Elevation API using the `/lookup` endpoint, which allows multiple coordinates in a single call. This reduces network overhead and speeds up the `/api/v1/campsites` endpoint.
- **Assignment:** Batched elevations are assigned to the correct campsites by index, and any failures are logged. If elevation cannot be fetched, the value is set to `null` for that site.

### Weather Fetching (Detail Only)

- **Weather is only fetched for the detail endpoint** (`GET /api/v1/campsites/:id`). The list endpoint (`GET /api/v1/campsites`) does **not** include weather data for performance reasons.
- **Caching:** Weather responses are cached in memory for a short TTL (default 10 minutes) to reduce load on the NWS API and improve responsiveness for repeated requests.
- **On-Demand:** Weather is fetched on demand when a user requests a specific campsite's details, ensuring up-to-date forecasts without slowing down the list endpoint.
- **Error Handling:** If the weather API fails or rate limits, the response omits weather data for that campsite, but the rest of the data is still returned.

## Retry Logic

Both the Elevation and Weather services implement robust retry logic to handle transient errors and improve reliability when communicating with external APIs:

- **Exponential Backoff:** If a request to the Open-Elevation or National Weather Service API fails (due to network issues, 5xx errors, or timeouts), the service will automatically retry the request after a short delay. The delay increases exponentially with each retry attempt (e.g., 200ms, 400ms, 800ms, etc.), up to a configurable maximum.
- **Retry Limits:** The number of retry attempts is configurable (default: 3 for elevation, 2 for weather). If all retries fail, the service logs the error and returns a fallback value (`null` for elevation, omits weather for weather failures).
- **429 Handling:** If a 429 (Too Many Requests) response is received, the retry logic will not continue retrying, and the error is logged immediately to avoid further rate limiting.
- **Error Logging:** All failed attempts and final errors are logged with details for debugging and monitoring.
- **No Duplicate Requests:** The in-memory cache ensures that repeated requests for the same coordinate or campsite do not trigger redundant retries.

This approach ensures that temporary network issues or API hiccups do not cause user-facing errors, while also respecting external API rate limits and providing clear diagnostics for persistent failures.



