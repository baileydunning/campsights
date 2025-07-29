import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

let mockFetchWithRetry: any;
let elevationService: typeof import('./elevationService');
let elevationCache: Map<string, number | null>;
let __clearElevationCache: () => void;

beforeEach(async () => {
  mockFetchWithRetry = vi.fn();
  vi.resetModules();
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
        // Manually set cache for test
        elevationCache.set('10,20', 123);
        const result = await elevationService.getElevations([{ latitude: 10, longitude: 20 }]);
        expect(result).toEqual([123]);
        expect(mockFetchWithRetry).not.toHaveBeenCalled();
    });

    it('fetches from API when not in cache', async () => {
        mockFetchWithRetry.mockResolvedValueOnce({
            json: async () => ({ results: sampleElevations }),
        });

        const result = await elevationService.getElevations(sampleLocations);
        expect(result).toEqual([100, 200]);
        expect(mockFetchWithRetry).toHaveBeenCalledWith(
            'https://api.open-elevation.com/api/v1/lookup',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ locations: sampleLocations }),
            }
        );
        
        // Should now be cached
        expect(elevationCache.get('10,20')).toBe(100);
        expect(elevationCache.get('30,40')).toBe(200);
    });

    it('returns null if API fails', async () => {
        mockFetchWithRetry.mockRejectedValueOnce(new Error('API error'));
        const result = await elevationService.getElevations([{ latitude: 10, longitude: 20 }]);
        expect(result).toEqual([null]);
        
        // Should not cache failed results to allow retries
        expect(elevationCache.has('10,20')).toBe(false);
    });

    it('getElevation returns single elevation', async () => {
        elevationCache.set('10,20', 789);
        const result = await elevationService.getElevation(10, 20);
        expect(result).toBe(789);
    });

    it('caches API results in memory', async () => {
        mockFetchWithRetry.mockResolvedValueOnce({
            json: async () => ({ results: [sampleElevations[0]] }),
        });

        const result1 = await elevationService.getElevations([{ latitude: 10, longitude: 20 }]);
        expect(result1).toEqual([100]);
        
        // Should now be in in-memory cache
        const result2 = await elevationService.getElevations([{ latitude: 10, longitude: 20 }]);
        expect(result2).toEqual([100]);
        expect(mockFetchWithRetry).toHaveBeenCalledTimes(1); // Only called once due to caching
    });

    it('handles mixed cached and uncached locations', async () => {
        // Pre-populate cache with one location
        elevationCache.set('10,20', 500);
        
        mockFetchWithRetry.mockResolvedValueOnce({
            json: async () => ({ results: [sampleElevations[1]] }), // Only returns elevation for 30,40
        });

        const result = await elevationService.getElevations([
            { latitude: 10, longitude: 20 }, // cached
            { latitude: 30, longitude: 40 }, // will be fetched
        ]);
        
        expect(result).toEqual([500, 200]);
        expect(mockFetchWithRetry).toHaveBeenCalledWith(
            'https://api.open-elevation.com/api/v1/lookup',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ locations: [{ latitude: 30, longitude: 40 }] }),
            }
        );
    });
});