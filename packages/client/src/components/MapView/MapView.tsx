import React, { useEffect, useState, useMemo, useCallback, Suspense } from 'react'
import { MapContainer, TileLayer, Marker, Tooltip } from 'react-leaflet'
import L from 'leaflet'

import './MapView.css'
import type { Campsite } from '../../types/Campsite'
const CampsiteMarker = React.lazy(() => import('../CampsiteMarker/CampsiteMarker'))

const defaultPosition: [number, number] = [39.2508, -106.2925]

const personIcon = new L.DivIcon({
  html: `<div style="display: flex; align-items: flex-end; justify-content: center; height: 48px; width: 32px;">
    <svg xmlns='http://www.w3.org/2000/svg' width='28' height='42' viewBox='0 0 32 48' aria-label='You Are Here Person Marker'>
      <circle cx='16' cy='8' r='6' fill='#000000'/>
      <path d='M12 14 L12 26 L20 26 L20 14 Z' fill='#000000'/>
      <path d='M12 16 L4 28 L8 30 L16 18 Z' fill='#000000'/>
      <path d='M20 16 L28 28 L24 30 L16 18 Z' fill='#000000'/>
      <path d='M12 26 L12 46 L16 46 L16 26 Z' fill='#000000'/>
      <path d='M16 26 L16 46 L20 46 L20 26 Z' fill='#000000'/>
    </svg>
  </div>`,
  className: 'you-are-here-marker',
  iconSize: [32, 48],
  iconAnchor: [16, 48],
})

interface MapViewProps {
  campsites: Campsite[]
}

const MapView: React.FC<MapViewProps> = ({ campsites }) => {
  const [currentPosition, setCurrentPosition] = useState<[number, number] | null>(null)
  const [showMap, setShowMap] = useState(false)

  useEffect(() => {
    const timeout = setTimeout(() => setShowMap(true), 0)
    return () => clearTimeout(timeout)
  }, [])

  const [geoRequested, setGeoRequested] = useState(false)
  useEffect(() => {
    if (!geoRequested) return
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCurrentPosition([pos.coords.latitude, pos.coords.longitude]),
        () => setCurrentPosition(null)
      )
    }
  }, [geoRequested])

  const renderCampsiteMarker = useCallback(
    (site: Campsite) => <CampsiteMarker key={site.id} site={site} />,
    []
  )

  const campsiteMarkers = useMemo(
    () => campsites.map(renderCampsiteMarker),
    [campsites, renderCampsiteMarker]
  )

  return (
    <div className="MapView">
      {showMap ? (
        <Suspense fallback={null}>
          <MapContainer
            center={currentPosition || defaultPosition}
            zoom={8}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {campsiteMarkers}
            {currentPosition && (
              <Marker position={currentPosition} icon={personIcon}>
                <Tooltip direction="top" offset={[0, -40]} opacity={1} permanent={false} sticky>
                  You are here
                </Tooltip>
              </Marker>
            )}
          </MapContainer>
          {!geoRequested && (
            <button
              className="popup-button"
              style={{ position: 'absolute', top: 16, right: 16, zIndex: 1000 }}
              onClick={() => setGeoRequested(true)}
              aria-label="Show My Location"
            >
              Show My Location
            </button>
          )}
        </Suspense>
      ) : null}
    </div>
  )
}

export default React.memo(MapView)
