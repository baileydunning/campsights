import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getCampsites, addCampsite } from './campsitesController';
import * as campsitesService from '../services/campsitesService';
import { Request, Response } from 'express';

describe('campsitesController', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let statusMock: vi.Mock;
    let jsonMock: vi.Mock;

    beforeEach(() => {
        statusMock = vi.fn().mockReturnThis();
        jsonMock = vi.fn().mockReturnThis();
        req = {};
        res = {
            status: statusMock,
            json: jsonMock,
        };
    });

    afterEach(() => {
        vi.clearAllMocks();
        vi.restoreAllMocks();
    });

    describe('getCampsites', () => {
        it('should return campsites with status 200', async () => {
            const fakeCampsites = [{ id: '1', name: 'Test', description: '', lat: 0, lng: 0, rating: 5, requires_4wd: false, last_updated: '2024-01-01' }];
            vi.spyOn(campsitesService, 'getCampsites').mockResolvedValue(fakeCampsites);

            await getCampsites(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith(fakeCampsites);
        });

        it('should handle errors and return status 500', async () => {
            vi.spyOn(campsitesService, 'getCampsites').mockRejectedValue(new Error('fail'));

            await getCampsites(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                error: 'Unable to fetch campsites',
                message: 'fail'
            }));
        });
    });

    describe('addCampsite', () => {
        const validBody = {
            id: 'abc',
            name: 'Test Site',
            description: 'A nice place',
            lat: 1.23,
            lng: 4.56,
            rating: 4,
            requires_4wd: true,
            last_updated: '2024-01-01'
        };

        it('should add a campsite and return status 201', async () => {
            req.body = { ...validBody };
            const fakeCampsite = { ...validBody };
            vi.spyOn(campsitesService, 'addCampsite').mockResolvedValue(fakeCampsite);

            await addCampsite(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(201);
            expect(jsonMock).toHaveBeenCalledWith(fakeCampsite);
        });

        it('should validate required fields and return 400 for missing id', async () => {
            req.body = { ...validBody, id: undefined };
            await addCampsite(req as Request, res as Response);
            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'id is required and must be a string' });
        });

        it('should validate required fields and return 400 for missing name', async () => {
            req.body = { ...validBody, name: undefined };
            await addCampsite(req as Request, res as Response);
            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'name is required and must be a string' });
        });

        it('should validate required fields and return 400 for missing description', async () => {
            req.body = { ...validBody, description: undefined };
            await addCampsite(req as Request, res as Response);
            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'description is required and must be a string' });
        });

        it('should validate lat as number and return 400 for invalid lat', async () => {
            req.body = { ...validBody, lat: 'not-a-number' };
            await addCampsite(req as Request, res as Response);
            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'lat is required and must be a valid number' });
        });

        it('should validate lng as number and return 400 for invalid lng', async () => {
            req.body = { ...validBody, lng: 'not-a-number' };
            await addCampsite(req as Request, res as Response);
            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'lng is required and must be a valid number' });
        });

        it('should validate rating as number between 0 and 5', async () => {
            req.body = { ...validBody, rating: 6 };
            await addCampsite(req as Request, res as Response);
            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'rating is required and must be a number between 0 and 5' });
        });

        it('should validate requires_4wd as boolean', async () => {
            req.body = { ...validBody, requires_4wd: 'yes' };
            await addCampsite(req as Request, res as Response);
            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'requires_4wd is required and must be a boolean' });
        });

        it('should validate last_updated as string', async () => {
            req.body = { ...validBody, last_updated: undefined };
            await addCampsite(req as Request, res as Response);
            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'last_updated is required and must be a string' });
        });

        it('should handle errors and return status 500', async () => {
            req.body = { ...validBody };
            vi.spyOn(campsitesService, 'addCampsite').mockRejectedValue(new Error('fail'));
            await addCampsite(req as Request, res as Response);
            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                error: 'Unable to create campsite',
                message: 'fail'
            }));
        });
    });
});