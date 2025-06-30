import { Campsite } from '../../models/campsiteModel';
import { WeatherPeriod } from '../../models/weatherModel';

export async function getWeatherForecast(
  campsite: Campsite
): Promise<WeatherPeriod[]> {
  const { lat, lng, id } = campsite;
  const pointsUrl = `https://api.weather.gov/points/${lat},${lng}`;

  try {
    const pointsRes = await fetch(pointsUrl, {
      headers: { 'Accept': 'application/geo+json, application/json, application/cap+xml' }
    });
    if (!pointsRes.ok) {
      console.error('Error fetching points for campsite %s: %s %s', id, pointsRes.status, pointsRes.statusText);
      return [];
    }

    const pointsData = await pointsRes.json() as { properties?: { forecast?: string } };
    const forecastUrl: string | undefined = pointsData.properties?.forecast;
    if (!forecastUrl) {
      console.error('No forecast URL returned for campsite %s', id);
      return [];
    }

    const forecastRes = await fetch(forecastUrl, {
      headers: { 'Accept': 'application/geo+json, application/json, application/cap+xml' }
    });
    if (!forecastRes.ok) {
      console.error('Error fetching forecast for campsite %s: %s %s', id, forecastRes.status, forecastRes.statusText);
      return [];
    }

    const forecastData = await forecastRes.json() as { properties?: { periods?: WeatherPeriod[] } };
    const periods: WeatherPeriod[] = forecastData.properties?.periods || [];
    return periods;
  } catch (error) {
    console.error('Error fetching weather for campsite %s:', id, error);
    return [];
  }
}