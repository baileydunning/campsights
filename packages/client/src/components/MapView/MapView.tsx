import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from 'react-redux';
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from "react-leaflet";
import L from "leaflet";
import { fetchCampsites, selectCampsites, selectLoading, selectError } from "../../store/campsiteSlice";
import type { AppDispatch } from "../../store/store";
import "./MapView.css";
import CampsiteMarker from "../CampsiteMarker/CampsiteMarker";

const defaultPosition: [number, number] = [39.2508, -106.2925]; // Leadville

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

const MapView: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const campsites = useSelector(selectCampsites);
  const loading = useSelector(selectLoading);
  const error = useSelector(selectError);
  const [currentPosition, setCurrentPosition] = useState<[number, number] | null>(null);

  useEffect(() => {
    dispatch(fetchCampsites());
  }, [dispatch]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCurrentPosition([pos.coords.latitude, pos.coords.longitude]),
        () => setCurrentPosition(null)
      );
    }
  }, []);

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
        center={currentPosition || defaultPosition}
        zoom={8}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {createCampsiteMarker()}
        {currentPosition && (
          <Marker position={currentPosition} icon={personIcon}>
            <Popup>You are here</Popup>
            <Tooltip direction="top" offset={[0, -40]} opacity={1} permanent={false} sticky>
              You are here
            </Tooltip>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};

export default MapView;
