import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { Campsite } from "../../types/Campsite"; 
import "./MapView.css"; 

const defaultPosition: [number, number] = [39.7392, -104.9903]; // Denver

interface MapViewProps {
  refreshKey: number;
}

const MapView: React.FC<MapViewProps> = ({ refreshKey }) => {
  const [campsites, setCampsites] = useState<Campsite[]>([]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/campsites`)
      .then((res) => res.json())
      .then((data: Campsite[]) => setCampsites(data))
      .catch((err) => console.error(err));
  }, [refreshKey]);

  const createCampsiteMarker = () => {
    return campsites.map((site) => (
      <Marker
        key={site.id}
        position={[site.lat, site.lng] as [number, number]}
        icon={L.icon({
          iconUrl:
            "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
        })}
      >
        <Popup>
          <br />
          <br />
        </Popup>
      </Marker>
    ));
  };

  return (
    <div className="MapView">
      <MapContainer
        center={defaultPosition}
        zoom={8}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {createCampsiteMarker()}
      </MapContainer>
    </div>
  );
};

export default MapView;
