import { fetchWithRetry } from '../../utils/fetchWithRetry';
import { Campsite } from '../../models/campsiteModel';
import { WeatherPeriod } from '../../models/weatherModel';

export async function getWeatherForecast(
  campsite: Campsite
): Promise<WeatherPeriod[]> {
  const { lat, lng, id } = campsite;
  const pointsUrl = `https://api.weather.gov/points/${lat},${lng}`;

  try {
    const pointsRes = await fetchWithRetry(pointsUrl, {
      headers: { 'Accept': 'application/geo+json, application/json' }
    });
    if (!pointsRes.ok) throw new Error(`Points API ${pointsRes.status}`);

    const pointsData = (await pointsRes.json()) as { properties?: { forecast?: string } };
    const forecastUrl = pointsData.properties?.forecast;
    if (!forecastUrl) throw new Error('No forecast URL');

    const forecastRes = await fetchWithRetry(forecastUrl, {
      headers: { 'Accept': 'application/geo+json, application/json' }
    });
    if (!forecastRes.ok) throw new Error(`Forecast API ${forecastRes.status}`);

    const forecastData = (await forecastRes.json()) as { properties?: { periods?: WeatherPeriod[] } };
    return forecastData.properties?.periods ?? [];
  } catch (error) {
    console.error('Weather fetch error for campsite %s:', id, error);
    return [];
  }
}