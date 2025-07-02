import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fetch from 'node-fetch';
import { getElevation, __clearElevationCache } from './elevationService';

vi.mock('node-fetch', async () => {
    const actual = await vi.importActual<typeof import('node-fetch')>('node-fetch');
    return {
        ...actual,
        default: vi.fn(),
    };
});

const mockedFetch = fetch as unknown as ReturnType<typeof vi.fn>;

describe('getElevation', () => {
    const latitude = 40.7128;
    const longitude = -74.006;

    beforeEach(() => {
        __clearElevationCache();
        vi.clearAllMocks();
        global.fetch = mockedFetch as any;
    });

    afterEach(() => {
        __clearElevationCache();
        vi.clearAllMocks();
        global.fetch = undefined as any;
    });

    it('returns elevation when API responds with valid data', async () => {
        mockedFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                results: [{ elevation: 123 }],
            }),
        } as any);

        const elevation = await getElevation(latitude, longitude);
        expect(elevation).toBe(123);
        expect(mockedFetch).toHaveBeenCalled();
    });

    it('returns null when API response is not ok', async () => {
        mockedFetch.mockResolvedValueOnce({
            ok: false,
            status: 500,
        } as any);

        const elevation = await getElevation(latitude, longitude);
        expect(elevation).toBeNull();
    });

    it('returns null when results array is missing', async () => {
        mockedFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({}),
        } as any);

        const elevation = await getElevation(latitude, longitude);
        expect(elevation).toBeNull();
    });

    it('returns null when results array is empty', async () => {
        mockedFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ results: [] }),
        } as any);

        const elevation = await getElevation(latitude, longitude);
        expect(elevation).toBeNull();
    });

    it('caches batch elevation requests', async () => {
        mockedFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                results: [{ elevation: 123 }],
            }),
        } as any);

        const elevation1 = await getElevation(latitude, longitude);
        const elevation2 = await getElevation(latitude, longitude);
        expect(elevation1).toBe(123);
        expect(elevation2).toBe(123);
        expect(mockedFetch).toHaveBeenCalledTimes(1);
    });

    it('handles multiple coordinates in parallel and caches them', async () => {
        const coords = [
            { lat: 40.7128, lon: -74.006, elevation: 123 },
            { lat: 34.0522, lon: -118.2437, elevation: 456 },
            { lat: 37.7749, lon: -122.4194, elevation: 789 },
        ];

        mockedFetch
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ results: [{ elevation: 123 }] }),
            } as any)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ results: [{ elevation: 456 }] }),
            } as any)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ results: [{ elevation: 789 }] }),
            } as any);

        const elevations = await Promise.all(
            coords.map(c => getElevation(c.lat, c.lon))
        );
        expect(elevations).toEqual([123, 456, 789]);
        expect(mockedFetch).toHaveBeenCalledTimes(3);

        // Second call should hit cache
        const elevationsCached = await Promise.all(
            coords.map(c => getElevation(c.lat, c.lon))
        );
        expect(elevationsCached).toEqual([123, 456, 789]);
        expect(mockedFetch).toHaveBeenCalledTimes(3);
    });

    it('retries on failure and succeeds on second attempt', async () => {
        mockedFetch
            .mockResolvedValueOnce({ ok: false, status: 500 } as any)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ results: [{ elevation: 456 }] }),
            } as any);

        const elevation = await getElevation(latitude, longitude);
        expect(elevation).toBe(456);
        expect(mockedFetch).toHaveBeenCalledTimes(2);
    });
});