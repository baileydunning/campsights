import { db } from '../config/db';
import { Campsite } from '../models/campsiteModel';

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