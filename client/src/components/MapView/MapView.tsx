import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Campsite } from "../../types/Campsite";
import L from "leaflet";
import "./MapView.css"; 

const defaultPosition: [number, number] = [39.7392, -104.9903]; // Denver

interface MapViewProps {
  refreshKey: number;
}

const MapView: React.FC<MapViewProps> = ({ refreshKey }) => {
  const [campsites, setCampsites] = useState<Campsite[]>([]);

  useEffect(() => {
    fetch(`http://localhost:3000/api/v1/campsites`)
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
          <strong>{site.name || "Unnamed Site"}</strong>
          <br />
          {site.description && (
            <span>
              {site.description}
              <br />
            </span>
          )}
          <span>
            Rating:{" "}
            {site.rating
              ? [...Array(site.rating)].map((_, i) => (
                  <span key={i} className="star">
                    ★
                  </span>
                ))
              : "No rating"}
          </span>
          <br />
          <span>
            Requires 4WD:{" "}
            {site.requires_4wd ? (
              <span className="requires-4wd-yes">Yes</span>
            ) : (
              <span className="requires-4wd-no">No</span>
            )}
          </span>
        </Popup>
      </Marker>
    ));
  };

  return (
    <MapContainer
      center={defaultPosition}
      zoom={8}
      style={{ height: "60vh", width: "100vw" }}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {createCampsiteMarker()}
    </MapContainer>
  );
};

export default MapView;
