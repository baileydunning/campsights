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

    afterEach(() => {
        vi.clearAllMocks();
        __clearElevationCache();
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

    it('throws error when API response is not ok', async () => {
        mockedFetch.mockResolvedValueOnce({
            ok: false,
            status: 500,
        } as any);

        await expect(getElevation(latitude, longitude)).rejects.toThrow(
            'Open-Elevation API responded with status 500'
        );
    });

    it('throws error when results array is missing', async () => {
        mockedFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({}),
        } as any);

        await expect(getElevation(latitude, longitude)).rejects.toThrow(
            'Elevation data missing or mismatched for requested coordinates.'
        );
    });

    it('throws error when results array is empty', async () => {
        mockedFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ results: [] }),
        } as any);

        await expect(getElevation(latitude, longitude)).rejects.toThrow(
            'Elevation data missing or mismatched for requested coordinates.'
        );
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
});