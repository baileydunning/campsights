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
      elevations = await getElevations(locations);
    }

    const result = await Promise.all(
      raw.map(async (site, idx) => {
        let elevation = site.elevation ?? null;
        const batchIdx = sitesNeedingElevation.findIndex(({ idx: i }) => i === idx);
        if (batchIdx !== -1) {
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