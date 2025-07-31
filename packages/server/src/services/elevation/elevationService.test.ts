import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetchWithRetry = vi.fn();
const mockIsElevationOpen = vi.fn();
const mockRecordElevationFailure = vi.fn();
const mockRecordElevationTimeout = vi.fn();

vi.mock('../../utils/fetchWithRetry', () => ({
  fetchWithRetry: mockFetchWithRetry,
}));

vi.mock('../../utils/circuitBreaker', () => ({
  circuitBreaker: {
    isElevationOpen: mockIsElevationOpen,
    recordElevationFailure: mockRecordElevationFailure,
  },
}));

vi.mock('../../utils/metrics', () => ({
  performanceMetrics: {
    recordElevationTimeout: mockRecordElevationTimeout,
  },
}));

let elevationService: typeof import('./elevationService');

describe('getElevation', () => {
    const lat = 40.123456;
    const lng = -105.123456;
    const cacheKey = '40.123,-105.123';

    beforeEach(async () => {
        elevationService = await import('./elevationService');
        (elevationService as any).elevationCache.clear();
        (elevationService as any).preWarmCache.clear();
        vi.clearAllMocks();
        mockIsElevationOpen.mockReturnValue(false);
    });

    it('returns cached elevation if present and not expired', async () => {
        const now = Date.now();
        (elevationService as any).elevationCache.set(cacheKey, { elevation: 1234, timestamp: now });
        const result = await elevationService.getElevation(lat, lng);
        expect(result).toBe(1234);
        expect(mockFetchWithRetry).not.toHaveBeenCalled();
    });

    it('returns null if circuit breaker is open', async () => {
        mockIsElevationOpen.mockReturnValue(true);
        const result = await elevationService.getElevation(lat, lng);
        expect(result).toBeNull();
        expect(mockFetchWithRetry).not.toHaveBeenCalled();
    });

    it('returns null if preWarmCache has the key', async () => {
        (elevationService as any).preWarmCache.add(cacheKey);
        const result = await elevationService.getElevation(lat, lng);
        expect(result).toBeNull();
        expect(mockFetchWithRetry).not.toHaveBeenCalled();
    });

    it('fetches elevation and caches it if not cached', async () => {
        const mockJson = vi.fn().mockResolvedValue({ results: [{ elevation: 5678 }] });
        mockFetchWithRetry.mockResolvedValue({ json: mockJson });
        const result = await elevationService.getElevation(lat, lng);
        expect(result).toBe(5678);
        expect(mockFetchWithRetry).toHaveBeenCalled();
        const cached = (elevationService as any).elevationCache.get(cacheKey);
        expect(cached.elevation).toBe(5678);
    });

    it('returns null and handles error if fetch fails', async () => {
        mockFetchWithRetry.mockRejectedValue(new Error('Network error'));
        const result = await elevationService.getElevation(lat, lng);
        expect(result).toBeNull();
        expect(mockRecordElevationFailure).toHaveBeenCalled();
        expect(mockRecordElevationTimeout).toHaveBeenCalled();
        expect((elevationService as any).preWarmCache.has(cacheKey)).toBe(true);
    });

    it('returns null if API returns no results', async () => {
        const mockJson = vi.fn().mockResolvedValue({ results: [] });
        mockFetchWithRetry.mockResolvedValue({ json: mockJson });
        const result = await elevationService.getElevation(lat, lng);
        expect(result).toBeNull();
        const cached = (elevationService as any).elevationCache.get(cacheKey);
        expect(cached.elevation).toBeNull();
    });
});