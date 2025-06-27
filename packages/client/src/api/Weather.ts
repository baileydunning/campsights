import axios from 'axios';
import { Campsite } from '../types/Campsite';

export interface WeatherPeriod {
  name: string;
  startTime: string;
  endTime: string;
  temperature: number;
  temperatureUnit: string;
  windSpeed: string;
  windDirection: string;
  shortForecast: string;
  detailedForecast: string;
}

export async function getWeatherForecast(campsite: Campsite): Promise<WeatherPeriod[]> {
  const lat = campsite.lat;
  const lng = campsite.lng;
  const pointsUrl = `https://api.weather.gov/points/${lat},${lng}`;

  try {
    const pointsRes = await axios.get(pointsUrl, {
      headers: {
        'Accept': 'application/geo+json, application/json, application/cap+xml'
      }
    });
    const forecastUrl = pointsRes.data.properties?.forecast;
    if (!forecastUrl) throw new Error("No forecast URL found");
    const forecastRes = await axios.get(forecastUrl, {
      headers: {
        'Accept': 'application/geo+json, application/json, application/cap+xml'
      }
    });
    return forecastRes.data.properties?.periods || [];
  } catch (error) {
    console.error('Error fetching weather forecast:', error);
    throw error;
  }
}
