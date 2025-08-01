import React, { useEffect, useState } from "react";
import { WeatherPeriod } from "../../types/Weather";
import { getCampsiteById } from "../../api/Campsites";
import "./WeatherCard.css";

interface WeatherCardProps {
  campsiteId: string;
  weatherData?: WeatherPeriod[];
}

const WeatherCard: React.FC<WeatherCardProps> = ({ campsiteId, weatherData }) => {
  if (weatherData === undefined) {
    return (
      <div className="weather-period-card weather-loading" role="status" aria-live="polite">
        <div className="spinner" data-testid="weather-spinner" />
      </div>
    );
  }

  if (!weatherData || weatherData.length === 0) {
    return <div className="weather-period-card">No weather data available</div>;
  }

  return (
    <div className="weather-forecast-list">
      {weatherData.map((p: WeatherPeriod) => (
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
