# Campsights Server

This is the backend for the Campsights app, built with Express and TypeScript.  
It provides a REST API that proxies campsite data from the Bureau of Land Management (BLM) Spider API and enhances it with elevation and weather information.

## Features

- **Read-only API**: Serves campsite data from the BLM Spider API
- **Elevation Enhancement**: Adds elevation data using the Open-Elevation API
- **Weather Integration**: Provides weather forecasts via the National Weather Service API
- **Performance Optimized**: Only fetches elevation/weather for individual campsite requests
- **In-Memory Caching**: Caches elevation and weather data to improve performance
- **CORS Enabled**: Ready for frontend integration
- **Full TypeScript**: Complete type safety with proper error handling

## Data Sources

- **Campsites**: [BLM Spider API](https://blm-spider.onrender.com/api/v1/campsites) - Official Bureau of Land Management data
- **Elevation**: [Open-Elevation API](https://api.open-elevation.com) - SRTM-based elevation data
- **Weather**: [National Weather Service API](https://www.weather.gov/documentation/services-web-api) - Official weather forecasts

## Architecture Overview

The backend acts as a proxy and enhancement layer:

- **Controllers**: Handle HTTP requests and responses
- **Services**: Fetch data from external APIs and manage caching
  - **Campsites Service**: Proxies BLM Spider API
  - **Elevation Service**: Fetches elevation data with in-memory caching
  - **Weather Service**: Fetches weather forecasts with caching
- **Models**: TypeScript interfaces for data structures
- **No Database**: All data is fetched from external APIs or cached in memory

## Getting Started

1. Install dependencies:
   ```sh
   npm install
   ```

2. Start the development server:
   ```sh
   npm run dev
   ```

3. The API will be available at [http://localhost:3000/api/v1/campsites](http://localhost:3000/api/v1/campsites)

## API Endpoints

### Read-Only Endpoints

- `GET /api/v1/campsites` — List all campsites (raw BLM data, fast)
- `GET /api/v1/campsites/:id` — Get detailed campsite with elevation and weather (slower)
- `GET /health` — Health check endpoint
- `GET /docs` — Swagger API documentation

### Response Examples

**GET /api/v1/campsites** - Fast list view:
```json
[
  {
    "id": "28430a4f-ce40-478d-a7b1-0c23d9c49dbb",
    "name": "Middle Fork of the Powder River Campground",
    "url": "https://www.blm.gov/visit/middle-fork-powder-river-campground-0",
    "lat": 43.579304,
    "lng": -107.140476,
    "state": "Wyoming",
    "mapLink": "https://www.openstreetmap.org/export/embed.html?bbox=-107.150476,43.569304,-107.130476,43.589304&layer=mapnik&marker=43.579304,-107.140476",
    "description": "Astride a blue-ribbon trout stream, this remote and picturesque campground features five camping sites with fire rings, restroom and drinking water. Use of the area is free with a 14-day limit on camping.",
    "directions": "From Ten Sleep, the area is reached by driving 20 miles south on State Highway 434 to Big Trails. From there turn left on the graveled Dry Farm Road and drive about 13 miles to the Hazelton Road.",
    "activities": ["CAMPING"],
    "fees": "No fees",
    "stayLimit": "14 days",
    "images": [
      {
        "src": "https://cdn.recreation.gov/public/2023/06/20/22/39/ed4c589b-d3e4-49fb-a0fd-f8bb7a0c4e3d.jpeg",
        "alt": "Campground view with river",
        "credit": "Bureau of Land Management"
      }
    ],
    "wildlife": ["Trout", "Eagles"],
    "source": "BLM"
  }
]
```

**GET /api/v1/campsites/:id** - Detailed view with elevation and weather:
```json
{
  "id": "28430a4f-ce40-478d-a7b1-0c23d9c49dbb",
  "name": "Middle Fork of the Powder River Campground",
  "url": "https://www.blm.gov/visit/middle-fork-powder-river-campground-0",
  "lat": 43.579304,
  "lng": -107.140476,
  "state": "Wyoming",
  "mapLink": "https://www.openstreetmap.org/export/embed.html?bbox=-107.150476,43.569304,-107.130476,43.589304&layer=mapnik&marker=43.579304,-107.140476",
  "description": "Astride a blue-ribbon trout stream, this remote and picturesque campground features five camping sites with fire rings, restroom and drinking water. Use of the area is free with a 14-day limit on camping.",
  "directions": "From Ten Sleep, the area is reached by driving 20 miles south on State Highway 434 to Big Trails. From there turn left on the graveled Dry Farm Road and drive about 13 miles to the Hazelton Road.",
  "activities": ["CAMPING"],
  "fees": "No fees",
  "stayLimit": "14 days",
  "images": [
    {
      "src": "https://cdn.recreation.gov/public/2023/06/20/22/39/ed4c589b-d3e4-49fb-a0fd-f8bb7a0c4e3d.jpeg",
      "alt": "Campground view with river",
      "credit": "Bureau of Land Management"
    }
  ],
  "wildlife": ["Trout", "Eagles"],
  "source": "BLM",
  "elevation": 2134,
  "weather": [
    {
      "name": "Tonight",
      "startTime": "2025-07-28T18:00:00-06:00",
      "endTime": "2025-07-29T06:00:00-06:00",
      "temperature": 45,
      "temperatureUnit": "F",
      "windSpeed": "5 mph",
      "windDirection": "NW",
      "shortForecast": "Clear",
      "detailedForecast": "Clear skies tonight with light winds from the northwest at 5 mph."
    },
    {
      "name": "Tomorrow",
      "startTime": "2025-07-29T06:00:00-06:00",
      "endTime": "2025-07-29T18:00:00-06:00",
      "temperature": 72,
      "temperatureUnit": "F",
      "windSpeed": "10 mph",
      "windDirection": "SW",
      "shortForecast": "Sunny",
      "detailedForecast": "Sunny skies with temperatures reaching 72 degrees. Southwest winds at 10 mph."
    }
  ]
}
```

## Scripts

- `npm run dev` — Start development server with hot reload
- `npm start` — Start server with ts-node  
- `npm run build` — Compile TypeScript to JavaScript
- `npm test` — Run tests

## Performance & Caching

### Two-Tier Data Loading

- **List View** (`GET /campsites`): Returns raw BLM data quickly without elevation/weather
- **Detail View** (`GET /campsites/:id`): Adds elevation and weather data for specific campsites

### Caching Strategy

- **Elevation**: Cached in memory by coordinates to avoid redundant API calls
- **Weather**: Cached in memory with 10-minute TTL for recent forecasts
- **No Persistent Storage**: All data is fetched fresh from authoritative sources

### Error Handling

- **Graceful Degradation**: If elevation or weather APIs fail, core campsite data is still returned
- **Retry Logic**: Automatic retries with exponential backoff for transient failures
- **Rate Limiting**: Respects external API limits to maintain service availability



