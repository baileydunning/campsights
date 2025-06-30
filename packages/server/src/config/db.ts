import { open } from "lmdb";
import { Campsite } from '../models/campsiteModel';
import campsites from "../../data/campsites.json" 
import { isValidCoordinate } from "../utils/isValidCoordinate";

export const db = open({
  path: "./data.lmdb",
  name: "campsites",
  compression: true,
});

export async function seedDB() {
  try {
    let successCount = 0;

    await db.transaction(async () => {
      for (const raw of campsites) {
        const campsite: Campsite = raw;
        if (isValidCoordinate(campsite.lat, campsite.lng)) {
          await db.put(campsite.id, campsite);
          successCount++;
        }
      }
    });

    console.log(
      `[INFO] Seeded ${successCount} campsites`
    );
  } catch (err) {
    console.error("[ERROR] Failed to seed database:", err);
    throw err;
  }
}