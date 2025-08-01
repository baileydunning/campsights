import React, { useEffect, useState } from "react";
import { WeatherPeriod } from "../../types/Weather";
import { getCampsiteById } from "../../api/Campsites";
import "./WeatherCard.css";

interface WeatherCardProps {
  campsiteId: string;
  weatherData?: WeatherPeriod[];
}

const WeatherCard: React.FC<WeatherCardProps> = ({ campsiteId, weatherData }) => {
  const [weather, setWeather] = useState<WeatherPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (weatherData && weatherData.length > 0) {
      setWeather(weatherData);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);
    getCampsiteById(campsiteId)
      .then((site) => {
        if (isMounted) {
          if (site && Array.isArray(site.weather)) {
            setWeather(site.weather);
          } else {
            setWeather([]);
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError("Failed to fetch weather");
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [campsiteId, weatherData]);

  if (loading) {
    return (
      <div className="weather-period-card weather-loading">
        <div className="spinner" />
      </div>
    );
  }
  if (error) return <div className="weather-period-card error">{error}</div>;
  if (!weather || weather.length === 0) {
    return <div className="weather-period-card">No weather data available</div>;
  }
  return (
    <div className="weather-forecast-list">
      {weather.map((p: WeatherPeriod) => (
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
  );
};

export default WeatherCard;
