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

export async function editCampsite(id: string, data: Omit<Campsite, 'id'>) {
  const response = await fetch(`/api/v1/campsites/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(`Failed to update campsite: ${response.statusText}`);
  }
  return response.json();
}

export async function deleteCampsite(id: string) {
  const response = await fetch(`/api/v1/campsites/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok && response.status !== 204) {
    throw new Error(`Failed to delete campsite: ${response.statusText}`);
  }
  return true;
}