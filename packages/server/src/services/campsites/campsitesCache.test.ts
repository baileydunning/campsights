
import { describe, it, beforeEach, afterEach, vi, expect } from 'vitest';
import * as campsitesCache from './campsitesCache';
import { Campsite } from '../../models/campsiteModel';


const mockCampsites: Campsite[] = [
    { id: '1', name: 'Camp Alpha' } as Campsite,
    { id: '2', name: 'Camp Beta' } as Campsite,
];

let getRangeMock: ReturnType<typeof vi.fn>;

vi.mock('../../config/db', () => ({
    db: {
        getRange: (...args: any[]) => getRangeMock(...args),
    },
}));


describe('getCachedCampsites', () => {
    beforeEach(() => {
        campsitesCache.invalidateCampsitesCache();
        getRangeMock = vi.fn();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('fetches campsites from db and caches them if cache is empty', async () => {
        getRangeMock.mockReturnValue([
            { value: mockCampsites[0] },
            { value: mockCampsites[1] },
        ]);
        const { getCachedCampsites } = await import('./campsitesCache');
        const result = await getCachedCampsites();
        expect(result).toEqual(mockCampsites);
        expect(getRangeMock).toHaveBeenCalledTimes(1);
    });

    it('returns cached campsites if cache is valid', async () => {
        getRangeMock.mockReturnValue([
            { value: mockCampsites[0] },
            { value: mockCampsites[1] },
        ]);
        const { getCachedCampsites } = await import('./campsitesCache');
        await getCachedCampsites();
        const result = await getCachedCampsites();
        expect(result).toEqual(mockCampsites);
        expect(getRangeMock).toHaveBeenCalledTimes(1);
    });

    it('refreshes cache after TTL expires', async () => {
        getRangeMock.mockReturnValue([
            { value: mockCampsites[0] },
            { value: mockCampsites[1] },
        ]);
        const { getCachedCampsites } = await import('./campsitesCache');
        await getCachedCampsites();

        vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 1000 * 60 * 60 * 7);

        await getCachedCampsites();
        expect(getRangeMock).toHaveBeenCalledTimes(2);
    });

    it('returns an empty array if db.getRange returns nothing', async () => {
        getRangeMock.mockReturnValue([]);
        const { getCachedCampsites } = await import('./campsitesCache');
        const result = await getCachedCampsites();
        expect(result).toEqual([]);
        expect(getRangeMock).toHaveBeenCalledTimes(1);
    });
});