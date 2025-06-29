import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getElevationController } from './elevationController';
import * as elevationService from '../../services/elevation/elevationService';

describe('getElevationController', () => {
    let req: any;
    let res: any;
    let jsonMock: any;
    let statusMock: any;

    beforeEach(() => {
        jsonMock = vi.fn();
        statusMock = vi.fn(() => ({ json: jsonMock }));
        res = {
            status: statusMock,
            json: jsonMock,
        };
        req = { query: {} };
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should return 400 if lat or lng is missing', async () => {
        req.query = {};
        await getElevationController(req, res);
        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
            error: 'Query parameters lat and lng must be valid numbers.',
        });
    });

    it('should return 400 if lat or lng is not a number', async () => {
        req.query = { lat: 'abc', lng: 'def' };
        await getElevationController(req, res);
        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
            error: 'Query parameters lat and lng must be valid numbers.',
        });
    });

    it('should return elevation data for valid lat/lng', async () => {
        req.query = { lat: '40.7128', lng: '-74.0060' };
        const mockElevation = 15;
        vi.spyOn(elevationService, 'getElevation').mockResolvedValue(mockElevation);

        await getElevationController(req, res);

        expect(jsonMock).toHaveBeenCalledWith({
            latitude: 40.7128,
            longitude: -74.006,
            elevation: mockElevation,
        });
    });

    it('should return 502 if getElevation throws an error', async () => {
        req.query = { lat: '40.7128', lng: '-74.0060' };
        const error = new Error('Provider error');
        vi.spyOn(elevationService, 'getElevation').mockRejectedValue(error);

        // Mock console.error to suppress error output in test
        const consoleErrorMock = vi.spyOn(console, 'error').mockImplementation(() => {});

        await getElevationController(req, res);

        expect(statusMock).toHaveBeenCalledWith(502);
        expect(jsonMock).toHaveBeenCalledWith({
            error: 'Provider error',
        });

        consoleErrorMock.mockRestore();
    });

    it('should return default error message if error has no message', async () => {
        req.query = { lat: '40.7128', lng: '-74.0060' };
        vi.spyOn(elevationService, 'getElevation').mockRejectedValue({});

        // Mock console.error to suppress error output in test
        const consoleErrorMock = vi.spyOn(console, 'error').mockImplementation(() => {});

        await getElevationController(req, res);

        expect(statusMock).toHaveBeenCalledWith(502);
        expect(jsonMock).toHaveBeenCalledWith({
            error: 'Failed to fetch elevation data from provider.',
        });

        consoleErrorMock.mockRestore();
    });
});