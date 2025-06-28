import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../config/db', () => ({
    db: {
        getRange: vi.fn(),
        put: vi.fn(),
    },
}));

import * as campsitesService from './campsitesService';
import { Campsite } from '../models/campsiteModel';
import { db } from '../config/db';

describe('campsitesService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getCampsites', () => {
        it('should return an array of campsites', async () => {
            const fakeCampsites: Campsite[] = [
                { id: '1', name: 'Camp A' } as Campsite,
                { id: '2', name: 'Camp B' } as Campsite,
            ];
            // Simulate db.getRange returning an iterable of { value }
            (db.getRange as any).mockReturnValue([
                { value: fakeCampsites[0] },
                { value: fakeCampsites[1] },
            ]);

            const result = await campsitesService.getCampsites();
            expect(result).toEqual(fakeCampsites);
            expect(db.getRange).toHaveBeenCalledWith({});
        });

        it('should throw and log error if db.getRange fails', async () => {
            const error = new Error('DB error');
            (db.getRange as any).mockImplementation(() => { throw error; });
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            await expect(campsitesService.getCampsites()).rejects.toThrow('DB error');
            expect(consoleSpy).toHaveBeenCalledWith('Error fetching campsites:', error);

            consoleSpy.mockRestore();
        });
    });

    describe('addCampsite', () => {
        it('should add a campsite and return it', async () => {
            const campsite: Campsite = { id: '123', name: 'Test Camp' } as Campsite;
            (db.put as any).mockResolvedValue(undefined);

            const result = await campsitesService.addCampsite(campsite);
            expect(result).toEqual(campsite);
            expect(db.put).toHaveBeenCalledWith(campsite.id, campsite);
        });

        it('should throw and log error if db.put fails', async () => {
            const campsite: Campsite = { id: '123', name: 'Test Camp' } as Campsite;
            const error = new Error('Put error');
            (db.put as any).mockRejectedValue(error);
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            await expect(campsitesService.addCampsite(campsite)).rejects.toThrow('Put error');
            expect(consoleSpy).toHaveBeenCalledWith('Error creating campsite:', error);

            consoleSpy.mockRestore();
        });
    });
});