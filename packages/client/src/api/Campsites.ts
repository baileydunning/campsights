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
  if (!id || typeof id !== 'string') {
    console.error('Invalid campsite id:', id);
    return null;
  }
  const cleanId = id.trim();
  try {
    const response = await fetch(`/api/v1/campsites/${encodeURIComponent(cleanId)}`);
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      throw new Error('Invalid response type');
    }
  } catch (error) {
    console.error('Error fetching campsite by ID:', error);
    throw error;
  }
}