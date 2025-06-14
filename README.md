# Campsights

Campsights is a full-stack web app for discovering and sharing campsites. Users can view campsites on a map, add new ones with ratings and details, and see which require 4WD access.

## Features

- View campsites on an interactive map
- Add new campsites with name, description, rating, coordinates, and 4WD requirement
- Data is stored in a JSON file on the backend

## Project Structure

```mermaid
flowchart TD
  subgraph Docker
    subgraph Client_Container [client]
      A[User]
      B[MapView Component]
      C[CampsiteForm Component]
    end

    subgraph Server_Container [server]
      D[/GET & POST /api/v1/campsites/ Endpoint/]
      E[(campsites.json Storage)]
    end
  end

  A -->|Interacts with| B
  A -->|Interacts with| C
  B -->|Fetch campsites| D
  C -->|Submit campsite| D
  D -->|Reads/Writes| E
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

### 2. Stopping the app

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

- `GET /api/v1/campsites` — List all campsites
- `POST /api/v1/campsites` — Add a new campsite