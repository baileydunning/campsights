import request from 'supertest';
import express from 'express';
import elevationRouter from '../elevationRoutes';

vi.mock('../controllers/elevationController', () => ({
    getElevationController: vi.fn((req, res) => {
        res.status(200).json({ elevation: 123 });
    }),
}));

describe('elevationRouter', () => {
    const app = express();
    app.use(express.json());
    app.use('/elevation', elevationRouter);

    it('should return elevation data on GET /elevation', async () => {
        const res = await request(app).get('/elevation');
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ elevation: 123 });
    });

    it('should handle errors from getElevationController', async () => {
        const { getElevationController } = await import('../controllers/elevationController');
        (getElevationController as any).mockImplementationOnce((_req: any, _res: any) => {
            throw new Error('Test error');
        });

        // Add error handler to catch the error
        app.use((err: any, _req: any, res: any, _next: any) => {
            res.status(500).json({ error: err.message });
        });

        const res = await request(app).get('/elevation');
        expect(res.status).toBe(500);
        expect(res.body).toEqual({ error: 'Test error' });
    });

    it('should handle async rejection from getElevationController', async () => {
        const { getElevationController } = await import('../controllers/elevationController');
        (getElevationController as any).mockImplementationOnce((_req: any, _res: any) => {
            return Promise.reject(new Error('Async error'));
        });

        // Add error handler to catch the error
        app.use((err: any, _req: any, res: any, _next: any) => {
            res.status(500).json({ error: err.message });
        });

        const res = await request(app).get('/elevation');
        expect(res.status).toBe(500);
        expect(res.body).toEqual({ error: 'Async error' });
    });
});