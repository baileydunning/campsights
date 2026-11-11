import React, { useEffect, useRef, useState, useMemo, Suspense } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Circle,
  CircleMarker,
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
import type { Origin } from "../../filters";
import MarkerClusterGroup from "./MarkerClusterGroup";
import MapControls from "./MapControls";
import FirePerimeters from "./FirePerimeters";
import FavoritesControl from "./FavoritesControl";
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
    // Lets CSS tuck the side controls away on small phones while a popup is open.
    popupopen: (e) => e.target.getContainer().classList.add("has-popup"),
    popupclose: (e) => e.target.getContainer().classList.remove("has-popup"),
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
  // Changes when the search or filters change; empty when neither is active.
  fitKey?: string;
  origin?: Origin | null;
  radiusMiles?: number | null;
}

const METERS_PER_MILE = 1609.344;

// After the user stops typing or changes a filter, zoom the map to fit the results.
const FitToResults: React.FC<{ campsites: Campsite[]; fitKey: string; origin?: Origin | null }> = ({
  campsites,
  fitKey,
  origin,
}) => {
  const map = useMap();
  const mounted = useRef(false);
  useEffect(() => {
    // Skip the first render so returning to the map keeps the remembered view.
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (!fitKey) return;
    const points = campsites.map((s) => [s.lat, s.lng] as [number, number]);
    if (origin) points.push([origin.lat, origin.lng]);
    if (points.length === 0) return;
    const timer = setTimeout(() => {
      if (points.length === 1) map.flyTo(points[0], Math.max(map.getZoom(), 10), { duration: 0.8 });
      else map.flyToBounds(L.latLngBounds(points), { padding: [60, 60], maxZoom: 11, duration: 0.8 });
    }, 700);
    return () => clearTimeout(timer);
    // Only refit when the search or filters change, not when the same results re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey, map]);
  return null;
};

const MapView: React.FC<MapViewProps> = ({ campsites, fitKey = "", origin = null, radiusMiles = null }) => {
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
        <FavoritesControl />

        <ZoomControl position="bottomright" />
        <MapControls onLocate={setCurrentPosition} />
        <ScaleControl position="bottomleft" imperial metric={false} />
        <FitToResults campsites={campsites} fitKey={fitKey} origin={origin} />

        {origin && radiusMiles != null && (
          <Circle
            center={[origin.lat, origin.lng]}
            radius={radiusMiles * METERS_PER_MILE}
            interactive={false}
            pathOptions={{ className: "search-radius", color: "#226E52", weight: 1.5, dashArray: "6 6", fillOpacity: 0.04 }}
          />
        )}
        {origin && origin.label !== "your location" && (
          <CircleMarker
            center={[origin.lat, origin.lng]}
            radius={6}
            pathOptions={{ className: "search-origin", color: "#FFFFFF", weight: 2, fillColor: "#16563A", fillOpacity: 1 }}
          >
            <Tooltip direction="top" offset={[0, -6]} opacity={1}>
              {origin.label}
            </Tooltip>
          </CircleMarker>
        )}
        {origin && origin.label === "your location" && !currentPosition && (
          <Marker position={[origin.lat, origin.lng]} icon={personIcon} zIndexOffset={1000}>
            <Tooltip direction="top" offset={[0, -12]} opacity={1}>
              You are here
            </Tooltip>
          </Marker>
        )}
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
