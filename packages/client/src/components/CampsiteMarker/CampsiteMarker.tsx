import React, { useEffect, useState } from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { Campsite } from "../../types/Campsite";
import { getWeatherForecast } from "../../api/Weather";
import "./CampsiteMarker.css";

interface CampsiteMarkerProps {
  site: Campsite;
  renderStars: (rating: number | null) => React.ReactNode;
}

function isValidCoordinate(lat: number, lng: number) {
  return (
    typeof lat === "number" && typeof lng === "number" &&
    !isNaN(lat) && !isNaN(lng) &&
    lat >= -90 && lat <= 90 &&
    lng >= -180 && lng <= 180 &&
    !(lat === 0 && lng === 0)
  );
}

const CampsiteMarker: React.FC<CampsiteMarkerProps> = ({ site, renderStars }) => {
  const [weatherData, setWeatherData] = useState<any>(null);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  // Fetch weather data for the campsite based on its coordinates
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
        console.error("Error fetching weather data:", error);
      } finally {
        setWeatherLoading(false);
      }
    };

    fetchWeather();
  }, [site.lat, site.lng]);

  return (
    <Marker
      key={site.id}
      position={[site.lat, site.lng] as [number, number]}
      icon={L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
      })}
    >
      <Popup data-testid="popup">
        <div>
          <strong>{site.name ? site.name : "Unnamed Site"}</strong>
          <div>{site.description}</div>
          <div>
            <span>Rating:</span> {renderStars(site.rating)}
          </div>
          <div>
            <span>Requires 4WD:</span> {site.requires_4wd ? "Yes" : "No"}
          </div>
          {/* Weather section */}
          <div className="weather-section">
            <strong>Weather Forecast:</strong>
            {weatherLoading && <div className="weather-loading">Loading weather...</div>}
            {weatherError && <div className="weather-error">{weatherError}</div>}
            {weatherData && weatherData.length > 0 && (
              <div className="weather-forecast-list">
                {weatherData.map((period: any) => (
                  <div key={period.number} className="weather-period-card">
                    <div className="weather-period-header">
                      {period.name} ({period.isDaytime ? 'Day' : 'Night'})
                    </div>
                    <div className="weather-period-details">
                      <span className="weather-temp">🌡️ {period.temperature}°{period.temperatureUnit}</span>
                      <span className="weather-short">🌤️ {period.shortForecast}</span>
                      <span className="weather-wind">💨 {period.windSpeed} {period.windDirection}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Popup>
    </Marker>
  );
};

export default CampsiteMarker;
