import axios from 'axios';
import { Campsite } from '../types/Campsite';

export async function getWeatherForecast(campsite: Campsite) {
  const lat = campsite.lat;
  const lng = campsite.lng;
  const pointsUrl = `https://api.weather.gov/points/${lat},${lng}`;

  try {
    // Step 1: Get forecast URL
    const pointsRes = await axios.get(pointsUrl, {
      headers: {
        'Accept': 'application/geo+json, application/json, application/cap+xml'
      }
    });
    const forecastUrl = pointsRes.data.properties?.forecast;
    if (!forecastUrl) throw new Error("No forecast URL found");
    // Step 2: Get forecast data
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
