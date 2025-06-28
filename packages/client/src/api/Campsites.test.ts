import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getCampsites, addCampsite, editCampsite } from './Campsites';
import type { Campsite } from '../types/Campsite';

const mockCampsites: Campsite[] = [
    { id: '1', name: 'Sunny Camp', description: 'Nice place', lat: 40, lng: -105, rating: 4, requires_4wd: false, last_updated: '2025-06-27T00:00:00Z' },
    { id: '2', name: 'Lakeview', description: 'By the water', lat: 41, lng: -106, rating: 5, requires_4wd: true, last_updated: '2025-06-27T00:00:00Z' },
];

const mockCampsite: Campsite = { id: '3', name: 'Mountain Base', description: 'High up', lat: 39, lng: -104, rating: 3, requires_4wd: false, last_updated: '2025-06-27T00:00:00Z' };

describe('Campsites API', () => {
    const globalAny: any = global;

    beforeEach(() => {
        globalAny.fetch = vi.fn();
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    describe('getCampsites', () => {
        it('should fetch and return campsites', async () => {
            globalAny.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockCampsites,
            });

            const campsites = await getCampsites();
            expect(globalAny.fetch).toHaveBeenCalledWith('/api/v1/campsites');
            expect(campsites).toEqual(mockCampsites);
        });

        it('should throw error if response is not ok', async () => {
            globalAny.fetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
            });

            await expect(getCampsites()).rejects.toThrow('HTTP error! status: 500');
        });
    });

    describe('addCampsite', () => {
        it('should POST and return the new campsite', async () => {
            globalAny.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockCampsite,
            });

            const result = await addCampsite(mockCampsite);
            expect(globalAny.fetch).toHaveBeenCalledWith('/api/v1/campsites', expect.objectContaining({
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(mockCampsite),
            }));
            expect(result).toEqual(mockCampsite);
        });

        it('should throw error if POST fails', async () => {
            globalAny.fetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
            });

            await expect(addCampsite(mockCampsite)).rejects.toThrow('HTTP error! status: 400');
        });
    });

    describe('editCampsite', () => {
        it('should PUT and return the updated campsite', async () => {
            const updated = { name: 'Updated', description: 'Updated desc', lat: 42, lng: -107, rating: 2, requires_4wd: true, last_updated: '2025-06-28T00:00:00Z' };
            globalAny.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ ...updated, id: '1' }),
            });

            const result = await editCampsite('1', updated);
            expect(globalAny.fetch).toHaveBeenCalledWith('/api/v1/campsites/1', expect.objectContaining({
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updated),
            }));
            expect(result).toEqual({ ...updated, id: '1' });
        });

        it('should throw error if PUT fails', async () => {
            globalAny.fetch.mockResolvedValueOnce({
                ok: false,
                statusText: 'Bad Request',
            });

            await expect(editCampsite('1', { name: '', description: '', lat: 0, lng: 0, rating: 0, requires_4wd: false, last_updated: '' }))
                .rejects.toThrow('Failed to update campsite: Bad Request');
        });
    });
});