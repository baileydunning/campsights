# Campsights Client

This is the frontend for the Campsights app, built with React, Vite, and TypeScript. It allows users to view campsites on an interactive map, see weather forecasts, get directions, and search for campsites.

## Tech Stack

- **React**: UI library for building interactive user interfaces.
- **Vite**: Fast development server and build tool for modern web projects.
- **TypeScript**: Strongly-typed JavaScript for safer, more maintainable code.
- **Redux Toolkit**: State management for predictable and scalable app state.
- **React-Leaflet**: Map rendering and interactivity using Leaflet in React.
- **Vitest**: Fast unit and integration testing framework.
- **React Router**: Routes for the map and campsite pages.


## Features

See the [main README](../../README.md#features) for the full list. In short:

- Leaflet map with clustered campsite markers, Streets, Topo and Satellite base maps, and land ownership and wildfire overlays
- Search by name, state, activity and more, with the map zooming to the results
- A page for every campsite at `/campsites/:id` with photos, weather alerts, a 7-day forecast, details, sun times and a map
- Built for phones and installable as a PWA

## PWA Usage

You can install Campsights as a PWA on your device:

- On desktop, click the install icon in your browser address bar or use the browser menu to "Install App".
- On mobile, use "Add to Home Screen" from your browser menu.
- When offline, the app will show an offline indicator and allow you to view any data you've already loaded.

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