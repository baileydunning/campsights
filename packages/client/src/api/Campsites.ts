import { Campsite } from '../types/Campsite';

export const getCampsites = async (): Promise<Campsite[]> => {
  try {
    const response = await fetch('/api/v1/campsites');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching campsites:', error);
    throw error;
  }
}

export const getCampsiteById = async (id: string): Promise<Campsite | null> => {
  try {
    const response = await fetch(`/api/v1/campsites/${id}`);
    if (!response.ok) {
      if (response.status === 404) return null; // Not found
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching campsite by ID:', error);
    throw error;
  }
};