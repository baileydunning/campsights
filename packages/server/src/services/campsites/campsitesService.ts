import { db } from '../../config/db';
import { Campsite } from '../../models/campsiteModel';

export const getCampsites = async (): Promise<Campsite[]> => {
  try {
    const campsites: Campsite[] = [];
    for (const { value } of db.getRange({})) {
      campsites.push(value as Campsite);
    }
    return campsites;
  } catch (error) {
    console.error('Error fetching campsites:', error);
    throw error;
  }
};

export const addCampsite = async (campsite: Campsite): Promise<Campsite> => {
  try {
    await db.put(campsite.id, campsite);
    return campsite;
  } catch (error) {
    console.error('Error creating campsite:', error);
    throw error;
  }
};

export const updateCampsite = async (id: string, campsite: Campsite): Promise<Campsite | null> => {
  try {
    const existingCampsite = await db.get(id);
    if (!existingCampsite) {
      return null;
    }
    
    const updatedCampsite = { ...campsite, id };
    await db.put(id, updatedCampsite);
    return updatedCampsite;
  } catch (error) {
    console.error('Error updating campsite:', error);
    throw error;
  }
};

export const deleteCampsite = async (id: string): Promise<boolean> => {
  try {
    const existingCampsite = await db.get(id);
    if (!existingCampsite) {
      return false;
    }
    await db.remove(id);
    return true;
  } catch (error) {
    console.error('Error deleting campsite:', error);
    throw error;
  }
};