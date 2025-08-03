import React, { useRef, useState } from 'react'
import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { useDispatch } from 'react-redux'
import { Campsite } from '../../types/Campsite'
import { fetchCampsiteById } from '../../store/campsiteSlice'
import WeatherCard from '../WeatherCard/WeatherCard'

import './CampsiteMarker.css'

export interface CampsiteMarkerProps {
  site: Campsite
  map?: any
}

const CampsiteMarker: React.FC<CampsiteMarkerProps> = ({ site, map }) => {
  const popupRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const [enrichedSite, setEnrichedSite] = useState<Campsite | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showFullDescription, setShowFullDescription] = useState(false)
  const dispatch = useDispatch()

  if (!site) return null

  const fetchEnrichedSite = async () => {
    if (isLoading || enrichedSite) return

    setIsLoading(true)
    setError(null)

    try {
      const resultAction = await dispatch(fetchCampsiteById(site.id) as any)
      if (fetchCampsiteById.fulfilled.match(resultAction)) {
        setEnrichedSite(resultAction.payload)
      } else {
        setError('Campsite details not found')
      }
    } catch (err) {
      setError('Failed to load campsite details: ' + (err instanceof Error ? err.message : 'Unknown error'))
      console.error('Error fetching enriched campsite:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const displaySite = enrichedSite || site

  const description = displaySite.description || ''
  const shouldTruncate = description.length > 250
  const displayDescription =
    shouldTruncate && !showFullDescription ? description.substring(0, 250) + '...' : description

  const formatActivity = (activity: string) => {
    return activity
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const tentIcon = new L.DivIcon({
    html: `<div style="display: flex; align-items: flex-end; justify-content: center; height: 50px; width: 50px;">
      <svg xmlns="http://www.w3.org/2000/svg"
     width="32" height="32" viewBox="0 0 32 32"
     aria-label="Campsite Tent Marker">
      <polygon points="6,26 16,6 16,26"
          fill="#2E8B57"/>
      <polygon points="16,6 26,26 16,26"
          fill="#226E52"/>
      <polygon points="14,26 14,14 18,14 18,26"
          fill="#16563A"/>
      </svg>
    </div>`,
    className: 'campsite-tent-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 28],
  })

  return (
    <Marker
      key={site.id}
      position={[site.lat, site.lng] as [number, number]}
      icon={tentIcon}
      ref={markerRef}
      eventHandlers={{
        click: () => {
          fetchEnrichedSite()
        },
        popupopen: (_e) => {
          if (map && markerRef.current) {
            const markerLatLng = markerRef.current.getLatLng()
            map.panTo(markerLatLng, { animate: true })
            setTimeout(() => {
              map.panBy([0, -100], { animate: true })
            }, 300)
          }
        },
      }}
    >
      <Popup data-testid="popup" ref={popupRef} autoClose={true} closeOnClick={true}>
        <div>
          <strong>{displaySite.name || 'Unnamed Site'}</strong> <i>{displaySite.state}</i>
          <div>
            {displayDescription}
            {shouldTruncate && (
              <button
                onClick={() => setShowFullDescription(!showFullDescription)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#16563A',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  fontSize: '0.9em',
                  marginLeft: '4px',
                  padding: '0',
                }}
              >
                {showFullDescription ? 'See less' : 'See more'}
              </button>
            )}
          </div>
          <div>
            {displaySite.activities && (
              <>
                <strong>Activities:</strong>{' '}
                {displaySite.activities && displaySite.activities.length > 0
                  ? displaySite.activities.map(formatActivity).join(', ')
                  : 'None listed'}
              </>
            )}
          </div>
          <div>
            <strong>Elevation:</strong>{' '}
            {displaySite.elevation != null && !isNaN(Number(displaySite.elevation))
              ? `${displaySite.elevation} m (${(displaySite.elevation * 3.28084).toFixed(0)} ft)`
              : isLoading
                ? 'Loading...'
                : 'Unknown'}
          </div>
          <div className="weather-section">
            <strong>Weather Forecast:</strong>
            <WeatherCard campsiteId={site.id} weatherData={enrichedSite?.weather} />
          </div>
          <div
            className="buttons-container"
            style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '8px' }}
          >
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${site.lat},${site.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="popup-button"
              role="button"
            >
              Get Directions
            </a>
            <a
              href={site.url}
              target="_blank"
              rel="noopener noreferrer"
              className="popup-button"
              role="button"
            >
              Get Details
            </a>
          </div>
        </div>
      </Popup>
    </Marker>
  )
}

export default React.memo(CampsiteMarker)
