import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getCampsites, addCampsite, updateCampsite } from '../campsitesController';
import * as campsitesService from '../../services/campsites/campsitesService';
import { Request, Response } from 'express';

describe('campsitesController', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let statusMock: vi.Mock;
    let jsonMock: vi.Mock;
    let sendMock: vi.Mock;

    beforeEach(() => {
        statusMock = vi.fn().mockReturnThis();
        jsonMock = vi.fn().mockReturnThis();
        sendMock = vi.fn().mockReturnThis();
        req = {};
        res = {
            status: statusMock,
            json: jsonMock,
            send: sendMock,
        };
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.clearAllMocks();
        vi.restoreAllMocks();
    });

    describe('getCampsites', () => {
        it('should return campsites with status 200', async () => {
            const fakeCampsites = [{ id: '1', name: 'Test', description: '', lat: 0, lng: 0, requires_4wd: false, last_updated: '2024-01-01' }];
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

    describe('updateCampsite', () => {
        const validBody = {
            name: 'Updated Test Site',
            description: 'An updated nice place',
            lat: 2.34,
            lng: 5.67,
            requires_4wd: false,
            last_updated: '2024-01-02'
        };

        beforeEach(() => {
            req.params = { id: 'test-id' };
        });

        it('should update a campsite and return status 200', async () => {
            req.body = { ...validBody };
            const updatedCampsite = { id: 'test-id', ...validBody };
            vi.spyOn(campsitesService, 'updateCampsite').mockResolvedValue(updatedCampsite);

            await updateCampsite(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith(updatedCampsite);
            expect(campsitesService.updateCampsite).toHaveBeenCalledWith('test-id', updatedCampsite);
        });

        it('should return 404 if campsite does not exist', async () => {
            req.body = { ...validBody };
            vi.spyOn(campsitesService, 'updateCampsite').mockResolvedValue(null);

            await updateCampsite(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(404);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Campsite not found' });
        });

        it('should validate required fields and return 400 for missing name', async () => {
            req.body = { ...validBody, name: undefined };
            await updateCampsite(req as Request, res as Response);
            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'name is required and must be a string' });
        });

        it('should validate required fields and return 400 for missing description', async () => {
            req.body = { ...validBody, description: undefined };
            await updateCampsite(req as Request, res as Response);
            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'description is required and must be a string' });
        });

        it('should validate lat as number and return 400 for invalid lat', async () => {
            req.body = { ...validBody, lat: 'not-a-number' };
            await updateCampsite(req as Request, res as Response);
            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'lat is required and must be a valid number' });
        });

        it('should validate lng as number and return 400 for invalid lng', async () => {
            req.body = { ...validBody, lng: 'not-a-number' };
            await updateCampsite(req as Request, res as Response);
            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'lng is required and must be a valid number' });
        });

        it('should validate requires_4wd as boolean', async () => {
            req.body = { ...validBody, requires_4wd: 'no' };
            await updateCampsite(req as Request, res as Response);
            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'requires_4wd is required and must be a boolean' });
        });

        it('should validate last_updated as string', async () => {
            req.body = { ...validBody, last_updated: undefined };
            await updateCampsite(req as Request, res as Response);
            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'last_updated is required and must be a string' });
        });

        it('should handle errors and return status 500', async () => {
            req.body = { ...validBody };
            vi.spyOn(campsitesService, 'updateCampsite').mockRejectedValue(new Error('update fail'));
            await updateCampsite(req as Request, res as Response);
            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                error: 'Unable to update campsite',
                message: 'update fail'
            }));
        });
    });

    describe('deleteCampsite', () => {
        beforeEach(() => {
            req.params = { id: 'test-id' };
        });

        it('should delete a campsite and return status 204', async () => {
            vi.spyOn(campsitesService, 'deleteCampsite').mockResolvedValue(true);
            const { deleteCampsite } = await import('../campsitesController');
            await deleteCampsite(req as Request, res as Response);
            expect(statusMock).toHaveBeenCalledWith(204);
            expect(sendMock).toHaveBeenCalledWith();
            expect(campsitesService.deleteCampsite).toHaveBeenCalledWith('test-id');
        });

        it('should return 404 if campsite does not exist', async () => {
            vi.spyOn(campsitesService, 'deleteCampsite').mockResolvedValue(false);
            const { deleteCampsite } = await import('../campsitesController');
            await deleteCampsite(req as Request, res as Response);
            expect(statusMock).toHaveBeenCalledWith(404);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Campsite not found' });
        });

        it('should handle errors and return status 500', async () => {
            vi.spyOn(campsitesService, 'deleteCampsite').mockRejectedValue(new Error('delete fail'));
            const { deleteCampsite } = await import('../campsitesController');
            await deleteCampsite(req as Request, res as Response);
            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                error: 'Unable to delete campsite',
                message: 'delete fail'
            }));
        });
    });
});