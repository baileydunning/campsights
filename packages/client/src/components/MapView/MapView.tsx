import React, { useEffect } from "react";
import { useSelector, useDispatch } from 'react-redux';
import { MapContainer, TileLayer } from "react-leaflet";
import { fetchCampsites, selectCampsites, selectLoading, selectError } from "../../store/campsiteSlice";
import type { AppDispatch } from "../../store/store";
import "./MapView.css";
import CampsiteMarker from "../CampsiteMarker/CampsiteMarker";

const defaultPosition: [number, number] = [39.2508, -106.2925]; // Leadville

const MapView: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const campsites = useSelector(selectCampsites);
  const loading = useSelector(selectLoading);
  const error = useSelector(selectError);

  useEffect(() => {
    dispatch(fetchCampsites());
  }, [dispatch]);

  const renderStars = (rating: number | null) => {
    if (!rating || rating < 1) return null;
    return (
      <>
        {Array.from({ length: rating }).map((_, i) => (
          <span key={i}>★</span>
        ))}
      </>
    );
  };

  const createCampsiteMarker = () => {
    return campsites.map((site) => (
      <CampsiteMarker key={site.id} site={site} renderStars={renderStars} />
    ));
  };

  if (loading) {
    return (
      <div className="MapView">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          Loading campsites...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="MapView">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          Error: {error}
        </div>
      </div>
    );
  }

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
