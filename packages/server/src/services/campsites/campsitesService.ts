import { db } from '../../config/db';
import { Campsite } from '../../models/campsiteModel';
import { getElevation } from '../elevation/elevationService';

// Simple in-memory cache for elevation lookups
const elevationCache = new Map<string, number | null>();

async function attachElevation(campsite: Campsite): Promise<Campsite & { elevation: number | null }> {
  // If elevation is already present, use it
  if (typeof campsite.elevation === 'number') {
    return { ...campsite, elevation: campsite.elevation };
  }
  try {
    const elevation = await getElevation(campsite.lat, campsite.lng);
    // Persist elevation in the campsite record
    const updatedCampsite = { ...campsite, elevation };
    await db.put(campsite.id, updatedCampsite);
    return updatedCampsite;
  } catch (error) {
    // Log error but don't fail the whole request
    console.error(`Error fetching elevation for campsite ${campsite.id}:`, error);
    return { ...campsite, elevation: null };
  }
}

export const getCampsites = async (): Promise<(Campsite & { elevation: number | null })[]> => {
  try {
    const campsites: Campsite[] = [];
    for (const { value } of db.getRange({})) {
      campsites.push(value as Campsite);
    }
    // Attach elevation to each campsite, but handle errors per-campsite
    return await Promise.all(campsites.map(attachElevation));
  } catch (error) {
    console.error('Error fetching campsites:', error);
    throw error;
  }
};

export const addCampsite = async (campsite: Campsite): Promise<Campsite> => {
  try {
    // Fetch and persist elevation on add
    const elevation = await getElevation(campsite.lat, campsite.lng);
    const campsiteWithElevation = { ...campsite, elevation };
    await db.put(campsite.id, campsiteWithElevation);
    return campsiteWithElevation;
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
    // Fetch and persist elevation on update
    const elevation = await getElevation(campsite.lat, campsite.lng);
    const updatedCampsite = { ...campsite, id, elevation };
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