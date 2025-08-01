import React, { useEffect, useState, useMemo, useCallback, Suspense } from "react";
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from "react-leaflet";
import "./MapView.css";
import type { Campsite } from '../../types/Campsite';
import L from "leaflet";

const CampsiteMarker = React.lazy(() => import("../CampsiteMarker/CampsiteMarker"));

interface MapViewProps {
  campsites: Campsite[];
  currentPosition?: [number, number] | null;
  defaultPosition: [number, number];
}

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
  </div>` ,
  className: 'you-are-here-marker',
  iconSize: [32, 48],
  iconAnchor: [16, 48],
});

const MapView: React.FC<MapViewProps> = ({ campsites, currentPosition, defaultPosition }) => {
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setShowMap(true), 0); 
    return () => clearTimeout(timeout);
  }, []);

  const renderCampsiteMarker = useCallback(
    (site: Campsite) => <CampsiteMarker key={site.id} site={site} />, 
    []
  );

  const campsiteMarkers = useMemo(
    () => campsites.map(renderCampsiteMarker),
    [campsites, renderCampsiteMarker]
  );

  const initialCenter = useMemo(() => currentPosition || defaultPosition, [currentPosition, defaultPosition]);

  return (
    <div className="MapView">
      {showMap ? (
        <Suspense fallback={null}>
          <MapContainer
            center={initialCenter}
            zoom={8}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {campsiteMarkers}
            {currentPosition && (
              <Marker position={currentPosition} icon={personIcon}>
                <Popup data-testid="person-popup">You are here</Popup>
                <Tooltip data-testid="person-tooltip" direction="top" offset={[0, -40]} opacity={1} permanent={false} sticky>
                  You are here
                </Tooltip>
                <div data-testid="person-marker" style={{ display: "none" }} />
              </Marker>
            )}
          </MapContainer>
        </Suspense>
      ) : (
        null
      )}
    </div>
  );
};

export default React.memo(MapView);
