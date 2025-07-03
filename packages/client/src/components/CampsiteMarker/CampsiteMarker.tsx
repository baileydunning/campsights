import React, { useEffect, useState, useRef, useMemo } from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { Campsite } from "../../types/Campsite";
import EditCampsiteForm from "../EditCampsiteForm/EditCampsiteForm";
import "./CampsiteMarker.css";

export interface CampsiteMarkerProps {
  site: Campsite;
}

const CampsiteMarker: React.FC<CampsiteMarkerProps> = ({ site }) => {
  if (!site) return null;

  const [editing, setEditing] = useState(false);
  const popupRef = useRef<any>(null);

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

  const handlePopupClose = () => {
    setEditing(false);
  };

  const weatherCards = useMemo(
    () => site.weather.map((p: any) => (
      <div key={p.number} className="weather-period-card">
        <div className="weather-period-header">
          {p.name} ({p.isDaytime ? "Day" : "Night"})
        </div>
        <div className="weather-period-details">
          <span className="weather-temp">
            <strong>Temp:</strong> {p.temperature}°{p.temperatureUnit}
          </span>
          <span className="weather-wind">
            <strong>Wind:</strong> {p.windSpeed} {p.windDirection}
          </span>
          <span className="weather-short">
            <strong>Forecast:</strong> {p.detailedForecast}
          </span>
        </div>
      </div>
    )),
    [site.weather]
  );

  return (
    <Marker
      key={site.id}
      position={[site.lat, site.lng] as [number, number]}
      icon={tentIcon}
    >
      <Popup
        data-testid="popup"
        ref={popupRef}
        autoClose={false}
        closeOnClick={false}
        eventHandlers={{ popupclose: handlePopupClose }}
      >
        <div>
          {!editing ? (
            <>
              <strong>{site.name || "Unnamed Site"}</strong>
              <div>{site.description}</div>
              <div>
                <strong>Elevation:</strong>{" "}
                {site.elevation != null && !isNaN(Number(site.elevation))
                  ? `${site.elevation} m (${(site.elevation * 3.28084).toFixed(0)} ft)`
                  : "Unknown"}
              </div>
              <div>
                <strong>Requires 4WD:</strong> {site.requires_4wd ? "Yes" : "No"}
              </div>
              <div className="weather-section">
                <strong>Weather Forecast:</strong>
                <div className="weather-forecast-list">
                  {weatherCards}
                </div>
              </div>
              <div className="directions-btn-container" style={{ gap: 8 }}>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${site.lat},${site.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="popup-button"
                  role="button"
                >
                  Get Directions
                </a>
                <button
                  className="popup-button"
                  type="button"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    setEditing(true);
                  }}
                >
                  Edit Campsite
                </button>
              </div>
            </>
          ) : (
            <EditCampsiteForm site={site} onCancel={() => setEditing(false)} />
          )}
        </div>
      </Popup>
    </Marker>
  );
};

export default React.memo(CampsiteMarker);
