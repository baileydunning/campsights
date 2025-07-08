import { db } from '../../config/db';
import { Campsite } from '../../models/campsiteModel';
import { getElevation, getElevations } from '../elevation/elevationService';
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
  (Campsite & { elevation: number | null })[]
> => {
  try {
    const raw: Campsite[] = [];
    for (const { value } of db.getRange({})) {
      raw.push(value as Campsite);
    }

    const sitesNeedingElevation = raw
      .map((site, idx) => ({ site, idx }))
      .filter(({ site }) => (site.elevation == null && site.lat != null && site.lng != null));

    const locations = sitesNeedingElevation.map(({ site }) => ({ latitude: site.lat, longitude: site.lng }));
    let elevations: (number | null)[] = [];
    if (locations.length > 0) {
      console.log(`[campsitesService] Requesting batch elevations for ${locations.length} locations`);
      elevations = await getElevations(locations);
      console.log(`[campsitesService] Received elevations:`, elevations);
    }

    const result = await Promise.all(
      raw.map(async (site, idx) => {
        let elevation = site.elevation ?? null;
        const batchIdx = sitesNeedingElevation.findIndex(({ idx: i }) => i === idx);
        if (batchIdx !== -1) {
          console.log(`[campsitesService] Assigning batch elevation for site ${site.id}: ${elevations[batchIdx]}`);
          elevation = elevations[batchIdx];
        }
        return { ...site, elevation };
      })
    );

    return result.filter(site =>
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
    const campsite = await db.get(id);
    if (!campsite) return null;

    const { weather } = await attachWeather(campsite);
    let elevation = campsite.elevation ?? null;
    if (elevation == null && campsite.lat != null && campsite.lng != null) {
      elevation = await getElevation(campsite.lat, campsite.lng);
    }
    return { ...campsite, elevation, weather };
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