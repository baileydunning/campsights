import fetch from 'node-fetch';
import { Elevation } from '../../models/elevationModel';

export const getElevation = async (
  latitude: number,
  longitude: number
): Promise<number> => {
  const lookupUrl = `https://api.open-elevation.com/api/v1/lookup?locations=${latitude},${longitude}`;

  const response = await fetch(lookupUrl);
  if (!response.ok) {
    throw new Error(`Open-Elevation API responded with status ${response.status}`);
  }

  const payload: { results: Elevation[] } = await response.json();
  if (!Array.isArray(payload.results) || payload.results.length === 0) {
    throw new Error('No elevation data returned for those coordinates.');
  }

  return payload.results[0].elevation;
};