import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as campsitesService from './campsitesService';
import { db } from '../../config/db';
import { Campsite } from '../../models/campsiteModel';
import { getElevation } from '../../services/elevation/elevationService';

vi.mock('../../config/db', () => ({
  db: {
    getRange: vi.fn(),
    put: vi.fn(),
    get: vi.fn(),
    remove: vi.fn(),
  },
}));
vi.mock('../../services/elevation/elevationService', () => ({
  getElevation: vi.fn(),
}));

const fakeCampsite: Campsite = {
  id: '1',
  name: 'Test Site',
  description: 'A test site',
  lat: 10,
  lng: 20,
  requires_4wd: false,
  last_updated: '2025-01-01T00:00:00Z',
};

describe('campsitesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getCampsites returns campsites with elevation', async () => {
    (db.getRange as any).mockReturnValue([{ value: fakeCampsite }]);
    getElevation.mockResolvedValue(100);
    const result = await campsitesService.getCampsites();
    expect(result[0].elevation).toBe(100);
  });

  it('addCampsite adds and returns campsite with elevation', async () => {
    getElevation.mockResolvedValue(200);
    (db.put as any).mockResolvedValue(undefined);
    const result = await campsitesService.addCampsite(fakeCampsite);
    expect(result.elevation).toBe(200);
    expect(db.put).toHaveBeenCalledWith(fakeCampsite.id, expect.objectContaining({ elevation: 200 }));
  });

  it('updateCampsite updates and returns campsite with elevation', async () => {
    (db.get as any).mockResolvedValue(fakeCampsite);
    getElevation.mockResolvedValue(300);
    (db.put as any).mockResolvedValue(undefined);
    const result = await campsitesService.updateCampsite('1', fakeCampsite);
    expect(result?.elevation).toBe(300);
    expect(db.put).toHaveBeenCalledWith('1', expect.objectContaining({ elevation: 300 }));
  });

  it('deleteCampsite removes and returns true if found', async () => {
    (db.get as any).mockResolvedValue(fakeCampsite);
    (db.remove as any).mockResolvedValue(undefined);
    const result = await campsitesService.deleteCampsite('1');
    expect(result).toBe(true);
    expect(db.remove).toHaveBeenCalledWith('1');
  });

  it('deleteCampsite returns false if not found', async () => {
    (db.get as any).mockResolvedValue(null);
    const result = await campsitesService.deleteCampsite('notfound');
    expect(result).toBe(false);
  });

  it('getCampsites throws and logs error if db.getRange fails', async () => {
    (db.getRange as any).mockImplementation(() => { throw new Error('fail'); });
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(campsitesService.getCampsites()).rejects.toThrow('fail');
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('addCampsite throws and logs error if db.put fails', async () => {
    getElevation.mockResolvedValue(100);
    (db.put as any).mockRejectedValue(new Error('fail'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(campsitesService.addCampsite(fakeCampsite)).rejects.toThrow('fail');
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('updateCampsite returns null if not found', async () => {
    (db.get as any).mockResolvedValue(null);
    const result = await campsitesService.updateCampsite('notfound', fakeCampsite);
    expect(result).toBeNull();
  });
});
