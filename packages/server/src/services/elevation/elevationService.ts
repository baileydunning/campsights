import fetch from 'node-fetch';
import { Elevation } from '../../models/elevationModel';

export const getElevations = async (
  locations: { latitude: number; longitude: number }[]
): Promise<number[]> => {

  const response = await fetch('https://api.open-elevation.com/api/v1/lookup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ locations }),
  });

  if (!response.ok) {
    throw new Error(`Open-Elevation API responded with status ${response.status}`);
  }
  const payload = (await response.json()) as { results: Elevation[] };
  if (!Array.isArray(payload.results) || payload.results.length !== locations.length) {
    throw new Error('Elevation data missing or mismatched for requested coordinates.');
  }
  return payload.results.map(r => r.elevation);
};

export const getElevation = async (
  latitude: number,
  longitude: number
): Promise<number> => {
  const [elevation] = await getElevations([{ latitude, longitude }]);
  return elevation;
};