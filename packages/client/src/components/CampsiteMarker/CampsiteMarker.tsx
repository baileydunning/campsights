import React, { useEffect, useState, useRef } from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { Campsite } from "../../types/Campsite";
import { getWeatherForecast } from "../../api/Weather";
import EditCampsiteForm from "../EditCampsiteForm/EditCampsiteForm";
import "./CampsiteMarker.css";

export interface CampsiteMarkerProps {
  site: Campsite;
}

function isValidCoordinate(lat: number, lng: number) {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    !(lat === 0 && lng === 0)
  );
}

const CampsiteMarker: React.FC<CampsiteMarkerProps> = ({ site }) => {
  const [weatherData, setWeatherData] = useState<any>(null);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
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

  useEffect(() => {
    if (!isValidCoordinate(site.lat, site.lng)) {
      setWeatherError("Invalid coordinates");
      setWeatherData(null);
      return;
    }
    const fetchWeather = async () => {
      setWeatherLoading(true);
      setWeatherError(null);
      try {
        const periods = await getWeatherForecast(site);
        setWeatherData(periods);
      } catch (error) {
        setWeatherError("Error fetching weather data");
        setWeatherData(null);
        console.error(`Error fetching weather for site ${site.id}:`, error);
      } finally {
        setWeatherLoading(false);
      }
    };
    fetchWeather();
  }, [site.lat, site.lng]);

  const handlePopupClose = () => {
    setEditing(false);
  };

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
                {weatherLoading && <div className="weather-loading">Loading weather...</div>}
                {weatherError && <div className="weather-error">{weatherError}</div>}
                {weatherData?.length > 0 && (
                  <div className="weather-forecast-list">
                    {weatherData.map((p: any) => (
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
                    ))}
                  </div>
                )}
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
                  onClick={() => setEditing(true)}
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

export default CampsiteMarker;
