import { open } from "lmdb";
import { Campsite } from '../models/campsiteModel';
import campsites from "../../data/campsites.json" 

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

        await db.put(campsite.id, campsite); 
        successCount++;
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