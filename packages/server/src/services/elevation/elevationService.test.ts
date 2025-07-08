import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

let mockDb: any;
let mockFetchWithRetry: any;
let elevationService: typeof import('./elevationService');
let elevationCache: Map<string, number | null>;
let __clearElevationCache: () => void;

beforeEach(async () => {
  mockDb = {
    getMany: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
  };
  mockFetchWithRetry = vi.fn();
  vi.resetModules();
  vi.doMock('../../config/db', () => ({ db: mockDb }));
  vi.doMock('../../utils/fetchWithRetry', () => ({ fetchWithRetry: mockFetchWithRetry }));
  elevationService = await import('./elevationService');
  elevationCache = elevationService.elevationCache;
  __clearElevationCache = elevationService.__clearElevationCache;
});

const sampleLocations = [
    { latitude: 10, longitude: 20 },
    { latitude: 30, longitude: 40 },
];

const sampleElevations = [
    { elevation: 100, latitude: 10, longitude: 20 },
    { elevation: 200, latitude: 30, longitude: 40 },
];

describe('elevationService', () => {
    beforeEach(() => {
        __clearElevationCache();
        vi.clearAllMocks();
    });

    it('returns elevations from in-memory cache', async () => {
        // Prime the cache
        mockDb.getMany.mockResolvedValueOnce([undefined]);
        await elevationService.getElevations([{ latitude: 10, longitude: 20 }]);
        // Manually set cache for test
        __clearElevationCache();
        elevationCache.set('10,20', 123);
        const result = await elevationService.getElevations([{ latitude: 10, longitude: 20 }]);
        expect(result).toEqual([123]);
    });

    it('returns elevations from DB cache', async () => {
        mockDb.getMany.mockResolvedValueOnce([456, null]);
        const result = await elevationService.getElevations([
            { latitude: 10, longitude: 20 },
            { latitude: 30, longitude: 40 },
        ]);
        expect(result).toEqual([456, null]);
        expect(mockDb.getMany).toHaveBeenCalled();
    });

    it('fetches from API when not in cache', async () => {
        mockDb.getMany.mockResolvedValueOnce([undefined, undefined]);
        mockFetchWithRetry.mockResolvedValueOnce({
            json: async () => ({ results: sampleElevations }),
        });
        mockDb.put.mockResolvedValue(undefined);

        const result = await elevationService.getElevations(sampleLocations);
        expect(result).toEqual([100, 200]);
        expect(mockFetchWithRetry).toHaveBeenCalled();
        expect(mockDb.put).toHaveBeenCalledTimes(2);
    });

    it('returns null if API fails', async () => {
        mockDb.getMany.mockResolvedValueOnce([undefined]);
        mockFetchWithRetry.mockRejectedValueOnce(new Error('API error'));
        const result = await elevationService.getElevations([{ latitude: 10, longitude: 20 }]);
        expect(result).toEqual([null]);
    });

    it('getElevation returns single elevation', async () => {
        mockDb.getMany.mockResolvedValueOnce([789]);
        const result = await elevationService.getElevation(10, 20);
        expect(result).toBe(789);
    });

    it('caches API results in memory and DB', async () => {
        mockDb.getMany.mockResolvedValueOnce([undefined]);
        mockFetchWithRetry.mockResolvedValueOnce({
            json: async () => ({ results: [sampleElevations[0]] }),
        });
        mockDb.put.mockResolvedValue(undefined);

        const result1 = await elevationService.getElevations([{ latitude: 10, longitude: 20 }]);
        expect(result1).toEqual([100]);
        // Should now be in in-memory cache
        const result2 = await elevationService.getElevations([{ latitude: 10, longitude: 20 }]);
        expect(result2).toEqual([100]);
        expect(mockFetchWithRetry).toHaveBeenCalledTimes(1);
    });
});