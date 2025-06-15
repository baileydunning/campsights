import fs from 'fs/promises';
import path from 'path';
import { Campsite } from '../types/campsite';

const filePath = path.join(__dirname, '../../data/campsites.json');

export async function getAllCampsites(): Promise<Campsite[]> {
  const data = await fs.readFile(filePath, 'utf8');
  return JSON.parse(data);
}

export async function addCampsite(newCampsite: Campsite): Promise<Campsite> {
  const campsites = await getAllCampsites();
  campsites.push(newCampsite);
  await fs.writeFile(filePath, JSON.stringify(campsites, null, 2));
  return newCampsite;
}