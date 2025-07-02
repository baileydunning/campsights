import { db } from '../../config/db';
import { Campsite } from '../../models/campsiteModel';
import { getElevation } from '../elevation/elevationService';
import { getWeatherForecast } from '../weather/weatherService';
import { WeatherPeriod } from '../../models/weatherModel';

const weatherCache = new Map<string, WeatherPeriod[]>();

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

export const getCampsites = async (): Promise<
  (Campsite & { elevation: number | null; weather: WeatherPeriod[] })[]
> => {
  try {
    const raw: Campsite[] = [];
    for (const { value } of db.getRange({})) {
      raw.push(value as Campsite);
    }

    return await Promise.all(
      raw.map(async (site) => {
        const { weather } = await attachWeather(site);
        return { ...site, elevation: site.elevation ?? null, weather };
      })
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
    const campsite = await db.get(id);
    if (!campsite) return null;

    const { weather } = await attachWeather(campsite);
    return { ...campsite, elevation: campsite.elevation ?? null, weather };
  } catch (err) {
    console.error('Error fetching campsite %s:', id, err);
    throw err;
  }
};

export const addCampsite = async (
  campsite: Campsite
): Promise<Campsite & { elevation: number | null; weather: WeatherPeriod[] }> => {
  try {
    const elevation = await getElevation(campsite.lat, campsite.lng);
    const newSite = { ...campsite, elevation };
    await db.put(newSite.id, newSite);

    const weather = await getWeatherForecast(newSite);
    return { ...newSite, weather };
  } catch (err) {
    console.error('Error creating campsite:', err);
    throw err;
  }
};

export const updateCampsite = async (
  id: string,
  campsite: Campsite
): Promise<(Campsite & { elevation: number | null; weather: WeatherPeriod[] }) | null> => {
  try {
    const existing = await db.get(id);
    if (!existing) return null;

    let elevation = existing.elevation ?? null;
    if (
      existing.lat !== campsite.lat ||
      existing.lng !== campsite.lng ||
      elevation == null
    ) {
      elevation = await getElevation(campsite.lat, campsite.lng);
    }

    const updatedSite = { ...campsite, id, elevation };
    await db.put(id, updatedSite);

    const weather = await getWeatherForecast(updatedSite);
    return { ...updatedSite, weather };
  } catch (err) {
    console.error('Error updating campsite:', err);
    throw err;
  }
};

export const deleteCampsite = async (id: string): Promise<boolean> => {
  try {
    const exists = await db.get(id);
    if (!exists) return false;
    await db.remove(id);
    weatherCache.delete(id);
    return true;
  } catch (err) {
    console.error('Error deleting campsite %s:', id, err);
    throw err;
  }
};