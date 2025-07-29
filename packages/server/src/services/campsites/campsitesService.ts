import { Campsite } from '../../models/campsiteModel';
import { getElevation } from '../elevation/elevationService';
import { getWeatherForecast } from '../weather/weatherService';
import { WeatherPeriod } from '../../models/weatherModel';

const weatherCache = new Map<string, WeatherPeriod[]>();
const BLM_API_URL = 'https://blm-spider.onrender.com/api/v1/campsites';

async function attachWeather(
  campsite: Campsite
): Promise<{ weather: WeatherPeriod[] }> {
  if (weatherCache.has(campsite.id)) {
    return { weather: weatherCache.get(campsite.id)! };
  }

  try {
    const forecast = await getWeatherForecast(campsite);
    weatherCache.set(campsite.id, forecast);
    return { weather: forecast };
  } catch (err) {
    console.error(`Error fetching weather for ${campsite.id}:`, err);
    return { weather: [] };
  }
}

export const getCampsites = async (): Promise<Campsite[]> => {
  try {
    const response = await fetch(BLM_API_URL);
    const raw: Campsite[] = await response.json();

    return raw.filter(site =>
      typeof site.lat === 'number' &&
      typeof site.lng === 'number' &&
      !isNaN(site.lat) &&
      !isNaN(site.lng)
    );
  } catch (err) {
    console.error('Error fetching campsites:', err);
    throw err;
  }
};

export const getCampsiteById = async (
  id: string
): Promise<Campsite & { elevation: number | null; weather: WeatherPeriod[] } | null> => {
  try {
    const response = await fetch(`${BLM_API_URL}/${id}`);
    if (!response.ok) {
      console.error('Error fetching campsite by ID:', id);
      return null;
    }

    const raw: Campsite = await response.json();
    const { weather } = await attachWeather(raw);
    let elevation = raw.elevation ?? null;
    if (elevation == null && raw.lat != null && raw.lng != null) {
      elevation = await getElevation(raw.lat, raw.lng);
    }
    return { ...raw, elevation, weather };
  } catch (err) {
    console.error('Error fetching campsite %s:', id, err);
    throw err;
  }
};