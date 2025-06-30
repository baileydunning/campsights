import { db } from '../../config/db';
import { Campsite } from '../../models/campsiteModel';
import { getElevation } from '../elevation/elevationService';
import { getWeatherForecast } from '../weather/weatherService';
import { WeatherPeriod } from '../../models/weatherModel';

// in-memory cache for weather only
const weatherCache = new Map<string, WeatherPeriod[]>();

// Attach weather forecast to a campsite record
async function attachWeather(
  campsite: Campsite
): Promise<{ weather: WeatherPeriod[] }> {
  // Use cached value if available
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

// Fetch all campsites with elevation and weather
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

// Create a new campsite, persisting elevation (weather not stored)
export const addCampsite = async (
  campsite: Campsite
): Promise<Campsite & { elevation: number | null; weather: WeatherPeriod[] }> => {
  try {
    // Fetch elevation once, store in DB
    const elevation = await getElevation(campsite.lat, campsite.lng);
    const newSite = { ...campsite, elevation };
    await db.put(newSite.id, newSite);

    // Optionally fetch weather on creation (not persisted)
    const weather = await getWeatherForecast(newSite);
    return { ...newSite, weather };
  } catch (err) {
    console.error('Error creating campsite:', err);
    throw err;
  }
};

// Update existing campsite
export const updateCampsite = async (
  id: string,
  campsite: Campsite
): Promise<(Campsite & { elevation: number | null; weather: WeatherPeriod[] }) | null> => {
  try {
    const existing = await db.get(id);
    if (!existing) return null;

    let elevation = existing.elevation ?? null;
    // Only fetch if lat/lng changed or elevation missing
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

// Delete a campsite
export const deleteCampsite = async (id: string): Promise<boolean> => {
  try {
    const exists = await db.get(id);
    if (!exists) return false;
    await db.remove(id);
    // clear weather cache
    weatherCache.delete(id);
    return true;
  } catch (err) {
    console.error(`Error deleting campsite ${id}:`, err);
    throw err;
  }
};