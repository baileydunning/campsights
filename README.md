# Campsights

Campsights is a full-stack web app for discovering and sharing campsites. Users can view campsites on a map, see weather forecasts, get directions, add new ones with ratings and details, and see which require 4WD access.

**Live project link:** https://campsights.onrender.com/

## Tech Stack

- **Frontend:** React, Vite, TypeScript, Redux Toolkit, React-Leaflet, Vitest, CSS Modules
- **Backend:** Express, TypeScript, LMDB (for fast key-value storage), National Weather Service API integration
- **Monorepo:** Managed with [Lerna](https://lerna.js.org/)
- **Testing:** Vitest (client & server)
- **Containerization:** Docker, Docker Compose

## Features

- View campsites on an interactive Leaflet map
- See multi-day weather forecasts for each campsite
- Get directions to any campsite via Google Maps
- Add new campsites with name, description, rating, coordinates, and 4WD requirement
- Edit and delete campsites
- Data is stored in LMDB (server) and served via REST API
- All weather and directions UI is styled via CSS for maintainability
- Comprehensive unit and integration tests using Vitest

## Monorepo & Lerna

This project uses a **monorepo** structure managed by [Lerna](https://lerna.js.org/).  
Lerna helps manage multiple packages (the frontend and backend) in a single repository. Install all the dependencies for both packages by running `npm i` at root.

**Packages:**
- `packages/client` — The React frontend
- `packages/server` — The Express backend

### Client

```mermaid
flowchart TD
    A[User's Browser] --> B[Redux Provider]
    B --> C[Redux Store]
    B --> D[React App Component]
    
    D --> E[MapView Component]
    D --> F[CampsiteForm Component]
    D --> G[CampsiteMarker Component]
    
    E --> C
    F --> C
    G --> C
    
    C --> H[campsiteSlice]
    H --> I[fetchCampsites thunk]
    H --> J[postCampsite thunk]
    H --> K[putCampsite thunk]
    
    I --> L[API Client Layer]
    J --> L
    K --> L
    
    L --> M[GET /api/v1/campsites]
    L --> N[POST /api/v1/campsites]
    L --> O[PUT /api/v1/campsites/:id]
    
    G --> P[Weather API Client]
    P --> Q[National Weather Service API]
    
    M --> R[Backend Server]
    N --> R
    O --> R
```

### Server

```mermaid
flowchart TD
    A[HTTP Requests] --> B[Express Server]
    B --> C[Router Layer]
    
    C --> D[GET /api/v1/campsites]
    C --> E[POST /api/v1/campsites]
    C --> F[PUT /api/v1/campsites/:id]
    
    D --> G[Campsites Controller]
    E --> G
    F --> G
    
    G --> H[Campsites Service]
    H --> I[Campsite Model]
    I --> J[(LMDB Database)]
    
    B --> K[Database Seeder]
    K --> J
    
    J --> L[Data Persistence]
```

## Running with Docker

Docker in this app is used to package both the frontend (React) and backend (Express) into a single container.

### Build and start the app

From the project root, run:

```sh
docker-compose up --build
```

- The app will be available at [http://localhost:3000](http://localhost:3000)
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
- **Description:** Returns a list of all campsites.
- **Response:**
  - Status: `200 OK`
  - Body: Array of campsite objects
    ```json
    [
      {
        "id": "string",
        "name": "string",
        "description": "string",
        "lat": number,
        "lng": number,
        "rating": number,
        "requires_4wd": boolean,
        "last_updated": "ISO8601 string"
      },
      ...
    ]
    ```

### `POST /api/v1/campsites`
- **Description:** Add a new campsite.
- **Request Body:**
  - JSON object with the following fields:
    ```json
    {
      "id": "string", // required, unique
      "name": "string",
      "description": "string",
      "lat": number,
      "lng": number,
      "rating": number,
      "requires_4wd": boolean,
      "last_updated": "ISO8601 string"
    }
    ```
- **Response:**
  - Status: `201 Created`
  - Body: The created campsite object

### `PUT /api/v1/campsites/:id`
- **Description:** Update an existing campsite by ID.
- **Request Body:**
  - JSON object with the following fields (same as POST, except `id` is in the URL):
    ```json
    {
      "name": "string",
      "description": "string",
      "lat": number,
      "lng": number,
      "rating": number,
      "requires_4wd": boolean,
      "last_updated": "ISO8601 string"
    }
    ```
- **Response:**
  - Status: `200 OK`
  - Body: The updated campsite object

###  `DELETE /api/v1/campsites/:id`
- **Description:** Delete an existing campsite by ID.
- **Response:**
  - Status: `204 No Content`
  - Body: N/A

## Attribution

Weather data provided by the [National Weather Service (NWS) API](https://www.weather.gov/documentation/services-web-api).

This product uses the NWS API but is not endorsed or certified by the National Weather Service.