import { Campsite } from '../../models/campsiteModel';
import { WeatherModel } from '../../models/weatherModel';

export async function getWeatherForecast(
  campsite: Campsite
): Promise<WeatherModel[]> {
  const { lat, lng, id } = campsite;
  const pointsUrl = `https://api.weather.gov/points/${lat},${lng}`;

  try {
    // Discover forecast endpoint
    const pointsRes = await fetch(pointsUrl, {
      headers: { 'Accept': 'application/geo+json, application/json, application/cap+xml' }
    });
    if (!pointsRes.ok) {
      console.error(`Error fetching points for campsite ${id}: ${pointsRes.status} ${pointsRes.statusText}`);
      return [];
    }

    const pointsData = await pointsRes.json() as { properties?: { forecast?: string } };
    const forecastUrl: string | undefined = pointsData.properties?.forecast;
    if (!forecastUrl) {
      console.error(`No forecast URL returned for campsite ${id}`);
      return [];
    }

    // Fetch the actual forecast periods
    const forecastRes = await fetch(forecastUrl, {
      headers: { 'Accept': 'application/geo+json, application/json, application/cap+xml' }
    });
    if (!forecastRes.ok) {
      console.error(`Error fetching forecast for campsite ${id}: ${forecastRes.status} ${forecastRes.statusText}`);
      return [];
    }

    const forecastData = await forecastRes.json() as { properties?: { periods?: WeatherModel[] } };
    const periods: WeatherModel[] = forecastData.properties?.periods || [];
    return periods;
  } catch (error) {
    console.error(`Error fetching weather for campsite ${id}:`, error);
    return [];
  }
}