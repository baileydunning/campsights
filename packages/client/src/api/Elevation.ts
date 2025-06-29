import axios from 'axios';
import { Campsite } from '../types/Campsite';

export async function fetchElevationForCampsite(campsite: Campsite): Promise<number | null> {
  try {
    const response = await axios.post('/api/v1/elevation', {
      lat: campsite.lat,
      lng: campsite.lng
    });
    const elevation = response.data?.elevation;
    return typeof elevation === 'number' ? elevation : null;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Elevation API error:', error.response?.data || error.message);
    } else {
      console.error('Unknown error fetching elevation:', error);
    }
    return null;
  }
}
