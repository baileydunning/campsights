import React, { useEffect, useRef, useState, useMemo, Suspense } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Tooltip,
  LayersControl,
  ScaleControl,
  ZoomControl,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "./MapView.css";
import type { Campsite } from "../../types/Campsite";
import MarkerClusterGroup from "./MarkerClusterGroup";
import MapControls from "./MapControls";
import FirePerimeters from "./FirePerimeters";
import { BASE_LAYERS, LAND_OWNERSHIP_LAYER, MAX_ZOOM } from "./mapLayers";

const CampsiteMarker = React.lazy(() => import("../CampsiteMarker/CampsiteMarker"));

const defaultPosition: [number, number] = [39.2508, -106.2925];

// Remember where the map was so coming back from a campsite page lands in the same place.
let lastView: { center: [number, number]; zoom: number } = { center: defaultPosition, zoom: 8 };

const RememberView: React.FC = () => {
  useMapEvents({
    moveend: (e) => {
      const c = e.target.getCenter();
      lastView = { center: [c.lat, c.lng], zoom: e.target.getZoom() };
    },
  });
  return null;
};

const personIcon = new L.DivIcon({
  html: `<span class="you-are-here-dot"></span>`,
  className: "you-are-here-marker",
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

interface MapViewProps {
  campsites: Campsite[];
  searchQuery?: string;
}

// After the user stops typing, zoom the map to fit whatever the search matched.
const FitToResults: React.FC<{ campsites: Campsite[]; query: string }> = ({ campsites, query }) => {
  const map = useMap();
  const mounted = useRef(false);
  useEffect(() => {
    // Skip the first render so returning to the map keeps the remembered view.
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (!query || campsites.length === 0) return;
    const timer = setTimeout(() => {
      const bounds = L.latLngBounds(campsites.map((s) => [s.lat, s.lng] as [number, number]));
      map.flyToBounds(bounds, { padding: [60, 60], maxZoom: 11, duration: 0.8 });
    }, 700);
    return () => clearTimeout(timer);
  }, [campsites, query, map]);
  return null;
};

const MapView: React.FC<MapViewProps> = ({ campsites, searchQuery = "" }) => {
  const [currentPosition, setCurrentPosition] = useState<[number, number] | null>(null);

  const campsiteMarkers = useMemo(
    () => campsites.map((site) => <CampsiteMarker key={site.id} site={site} />),
    [campsites]
  );

  return (
    <div className="MapView">
      <MapContainer
        center={lastView.center}
        zoom={lastView.zoom}
        maxZoom={MAX_ZOOM}
        zoomControl={false}
        style={{ height: "100%", width: "100%" }}
      >
        <LayersControl position="topright">
          {BASE_LAYERS.map((layer, i) => (
            <LayersControl.BaseLayer key={layer.name} name={layer.name} checked={i === 0}>
              <TileLayer
                url={layer.url}
                attribution={layer.attribution}
                maxNativeZoom={layer.maxNativeZoom}
                maxZoom={MAX_ZOOM}
                {...(layer.subdomains ? { subdomains: layer.subdomains } : {})}
              />
            </LayersControl.BaseLayer>
          ))}

          <LayersControl.Overlay name="Campsites" checked>
            <MarkerClusterGroup>
              <Suspense fallback={null}>{campsiteMarkers}</Suspense>
            </MarkerClusterGroup>
          </LayersControl.Overlay>

          <LayersControl.Overlay name={LAND_OWNERSHIP_LAYER.name}>
            <TileLayer
              url={LAND_OWNERSHIP_LAYER.url}
              attribution={LAND_OWNERSHIP_LAYER.attribution}
              maxNativeZoom={LAND_OWNERSHIP_LAYER.maxNativeZoom}
              maxZoom={MAX_ZOOM}
              opacity={LAND_OWNERSHIP_LAYER.opacity}
            />
          </LayersControl.Overlay>

          <LayersControl.Overlay name="Wildfire perimeters">
            <FirePerimeters />
          </LayersControl.Overlay>
        </LayersControl>

        <ZoomControl position="bottomright" />
        <MapControls onLocate={setCurrentPosition} />
        <ScaleControl position="bottomleft" imperial metric={false} />
        <FitToResults campsites={campsites} query={searchQuery} />
        <RememberView />

        {currentPosition && (
          <Marker position={currentPosition} icon={personIcon} zIndexOffset={1000}>
            <Tooltip direction="top" offset={[0, -12]} opacity={1}>
              You are here
            </Tooltip>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};

export default React.memo(MapView);
