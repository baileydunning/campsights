import React, { useRef, useState } from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { Campsite } from "../../types/Campsite";
import { getCampsiteById } from "../../api/Campsites";
import WeatherCard from "../WeatherCard/WeatherCard";
import "./CampsiteMarker.css";

export interface CampsiteMarkerProps {
  site: Campsite;
  map?: any;
}

const CampsiteMarker: React.FC<CampsiteMarkerProps> = ({ site, map }) => {
  if (!site) return null;

  const popupRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [enrichedSite, setEnrichedSite] = useState<Campsite | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFullDescription, setShowFullDescription] = useState(false);

  const fetchEnrichedSite = async () => {
    if (isLoading || enrichedSite) return; // Avoid duplicate requests
    
    setIsLoading(true);
    setError(null);
    
    try {
      const detailed = await getCampsiteById(site.id);
      if (detailed) {
        setEnrichedSite(detailed);
      } else {
        setError("Campsite details not found");
      }
    } catch (err) {
      setError("Failed to load campsite details");
      console.error("Error fetching enriched campsite:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Use enriched site data if available, otherwise fall back to basic site data
  const displaySite = enrichedSite || site;

  // Handle description truncation
  const description = displaySite.description || "";
  const shouldTruncate = description.length > 500;
  const displayDescription = shouldTruncate && !showFullDescription 
    ? description.substring(0, 500) + "..."
    : description;

  const formatActivity = (activity: string) => {
    return activity
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

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
    className: "campsite-tent-marker",
    iconSize: [32, 32],
    iconAnchor: [16, 28],
  });

  return (
    <Marker
      key={site.id}
      position={[site.lat, site.lng] as [number, number]}
      icon={tentIcon}
      ref={markerRef}
      eventHandlers={{
        click: () => {
          // Fetch enriched data when marker is clicked (which opens popup)
          fetchEnrichedSite();
        },
        popupopen: (e) => {
          if (map && markerRef.current) {
            map.panTo(markerRef.current.getLatLng(), { animate: true });
          }
        }
      }}
    >
      <Popup
        data-testid="popup"
        ref={popupRef}
        autoClose={true}
        closeOnClick={true}
      >
        <div>
          <strong>{displaySite.name || "Unnamed Site"}</strong>
          <div>
            {displayDescription}
            {shouldTruncate && (
              <button
                onClick={() => setShowFullDescription(!showFullDescription)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#007bff',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  fontSize: '0.9em',
                  marginLeft: '4px',
                  padding: '0'
                }}
              >
                {showFullDescription ? "See less" : "See more"}
              </button>
            )}
          </div>
          
          <div>
            <strong>Activities:</strong>{" "}
            {displaySite.activities && displaySite.activities.length > 0 
              ? displaySite.activities.map(formatActivity).join(', ')
              : "No activities listed"
            }
          </div>
          
          <div>
            <strong>Elevation:</strong>{" "}
            {displaySite.elevation != null && !isNaN(Number(displaySite.elevation))
              ? `${displaySite.elevation} m (${(displaySite.elevation * 3.28084).toFixed(0)} ft)`
              : isLoading ? "Loading..." : "Unknown"}
          </div>
          
          <div className="weather-section">
            <strong>Weather Forecast:</strong>
            <WeatherCard 
              campsiteId={site.id} 
              weatherData={enrichedSite?.weather}
            />
          </div>
          <div className="buttons-container" style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '8px' }}>
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
  );
};

export default React.memo(CampsiteMarker);
