# Campsights Client

This is the frontend for the Campsights app, built with React, Vite, and TypeScript.  It allows users to view campsites on an interactive map and add new campsites with details and ratings.

## Features

- View campsites on a Leaflet map
- Add new campsites with name, description, rating, coordinates, and 4WD requirement
- Responsive and modern UI

## Project Structure

```
client/
  src/
    components/      # React components (MapView, CampsiteForm, etc.)
    types/           # TypeScript interfaces
    App.tsx          # Main app component
    main.tsx         # Entry point
  public/
  App.css            # Global styles
  ...
```

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