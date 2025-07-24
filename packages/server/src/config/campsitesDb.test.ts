import { db, seedDB } from './campsitesDb';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const TEST_ID = 'test-campsite';
const TEST_CAMPSITE = {
  id: TEST_ID,
  name: 'Test Campsite',
  description: 'A test campsite',
  lat: 1.23,
  lng: 4.56,
  requires_4wd: false,
  last_updated: new Date().toISOString(),
};

describe('campsitesDb', () => {
  beforeAll(async () => {
    await seedDB();
  });

  it('should put and get a campsite', async () => {
    await db.put(TEST_ID, TEST_CAMPSITE);
    const result = await db.get(TEST_ID);
    expect(result).toMatchObject(TEST_CAMPSITE);
  });

  it('should return undefined for missing campsite', async () => {
    const result = await db.get('nonexistent-id');
    expect(result).toBeUndefined();
  });

  it('should delete a campsite', async () => {
    await db.put(TEST_ID, TEST_CAMPSITE);
    await db.remove(TEST_ID);
    const result = await db.get(TEST_ID);
    expect(result).toBeUndefined();
  });
});
