# Campsights Client

This is the frontend for the Campsights app, built with React, Vite, and TypeScript. It allows users to view campsites on an interactive map, see weather forecasts, get directions, and add new campsites with details and ratings.

## Tech Stack

- **React**: UI library for building interactive user interfaces.
- **Vite**: Fast development server and build tool for modern web projects.
- **TypeScript**: Strongly-typed JavaScript for safer, more maintainable code.
- **Redux Toolkit**: State management for predictable and scalable app state.
- **React-Leaflet**: Map rendering and interactivity using Leaflet in React.
- **Vitest**: Fast unit and integration testing framework.
- **CSS Modules**: Scoped and maintainable component styles.
- **Axios/Fetch**: For API and weather data requests.

## Features

- View campsites on a Leaflet map with interactive markers
- See multi-day weather forecasts for each campsite (via National Weather Service API)
- Get directions to any campsite via Google Maps (from your current location)
- Add new campsites with name, description, rating, coordinates, and 4WD requirement
- Responsive and modern UI
- Robust error and loading states for weather and data fetching
- All weather and directions UI is styled via CSS for maintainability
- Comprehensive unit and integration tests using Vitest

## Getting Started

1. Install dependencies:
   ```sh
   npm install
   ```

2. Start the development server:
   ```sh
   npm run dev
   ```

3. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Notes

- The client expects the backend API to be running at `http://localhost:3000`.
- API endpoints used:
  - `GET /api/v1/campsites`
  - `POST /api/v1/campsites`
- Weather data is fetched for each campsite and displayed in the marker popup.
- The "Get Directions" button opens Google Maps with directions from your current location to the campsite.