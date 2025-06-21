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

export const addCampsite = async (campsite: Campsite): Promise<Campsite> => {
  try {
    const response = await fetch('/api/v1/campsites', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(campsite),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error adding campsite:', error);
    throw error;
  }
};