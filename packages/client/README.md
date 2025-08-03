# Campsights Client

This is the frontend for the Campsights app, built with React, Vite, and TypeScript. It allows users to view campsites on an interactive map, see weather forecasts, get directions, and search for campsites.

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
- Search for campsites by name, state, activity, etc.
- See multi-day weather forecasts for each campsite (via National Weather Service API)
- Get directions to any campsite via Google Maps (from your current location)
- See BLM detail page for each campsite
- Works offline: previously loaded data and app shell are available without a network connection

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
