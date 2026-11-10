import React from "react";
import { MapContainer, TileLayer, Marker, LayersControl, ScaleControl } from "react-leaflet";
import { BASE_LAYERS, LAND_OWNERSHIP_LAYER, MAX_ZOOM } from "../MapView/mapLayers";
import { tentIcon } from "../MapView/icons";

interface SiteMapProps {
  lat: number;
  lng: number;
  zoom?: number;
  // "hero": a still satellite view used as the header image when there are no photos
  variant?: "detail" | "hero";
}

const satellite = BASE_LAYERS.find((l) => l.name === "Satellite")!;

const SiteMap: React.FC<SiteMapProps> = ({ lat, lng, zoom = 12, variant = "detail" }) => {
  const position: [number, number] = [lat, lng];

  if (variant === "hero") {
    return (
      <MapContainer
        center={position}
        zoom={zoom}
        maxZoom={MAX_ZOOM}
        zoomControl={false}
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        touchZoom={false}
        boxZoom={false}
        keyboard={false}
        className="site-map site-map--hero"
      >
        <TileLayer url={satellite.url} attribution={satellite.attribution} maxNativeZoom={satellite.maxNativeZoom} maxZoom={MAX_ZOOM} />
        <Marker position={position} icon={tentIcon} interactive={false} />
      </MapContainer>
    );
  }

  return (
    <MapContainer center={position} zoom={zoom} maxZoom={MAX_ZOOM} scrollWheelZoom={false} className="site-map">
      <LayersControl position="topright" collapsed>
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
        <LayersControl.Overlay name={LAND_OWNERSHIP_LAYER.name}>
          <TileLayer
            url={LAND_OWNERSHIP_LAYER.url}
            attribution={LAND_OWNERSHIP_LAYER.attribution}
            maxNativeZoom={LAND_OWNERSHIP_LAYER.maxNativeZoom}
            maxZoom={MAX_ZOOM}
            opacity={LAND_OWNERSHIP_LAYER.opacity}
          />
        </LayersControl.Overlay>
      </LayersControl>
      <ScaleControl position="bottomleft" imperial metric={false} />
      <Marker position={position} icon={tentIcon} />
    </MapContainer>
  );
};

export default SiteMap;
