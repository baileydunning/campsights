import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getWeatherForecast } from './weatherService';
import type { Campsite } from '../../models/campsiteModel';
import type { WeatherPeriod } from '../../models/weatherModel';

const mockCampsite: Campsite = {
    id: 'test-campsite',
    name: 'Test Campsite',
    description: 'A mock campsite for testing purposes.',
    elevation: 5000,
    lat: 40.0,
    lng: -105.0,
} as Campsite;

const mockPeriods: WeatherPeriod[] = [
    { name: 'Tonight', temperature: 50 } as WeatherPeriod,
    { name: 'Tomorrow', temperature: 60 } as WeatherPeriod,
];

function mockFetchImplementation(responses: any[]) {
    let call = 0;
    return vi.fn().mockImplementation(() => {
        const response = responses[call++];
        return Promise.resolve({
            ok: response.ok,
            status: response.status || 200,
            statusText: response.statusText || 'OK',
            json: () => Promise.resolve(response.body),
        });
    });
}

describe('getWeatherForecast', () => {
    let fetchSpy: any;

    beforeEach(() => {
        fetchSpy = vi.spyOn(global as any, 'fetch');
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('returns weather periods on successful fetch', async () => {
        fetchSpy.mockImplementation(
            mockFetchImplementation([
                {
                    ok: true,
                    body: { properties: { forecast: 'https://api.weather.gov/forecast/123' } },
                },
                {
                    ok: true,
                    body: { properties: { periods: mockPeriods } },
                },
            ])
        );

        const result = await getWeatherForecast(mockCampsite);
        expect(result).toEqual(mockPeriods);
        expect(fetchSpy).toHaveBeenCalledTimes(2);
    });

    it('returns empty array if points fetch fails', async () => {
        fetchSpy.mockImplementation(
            mockFetchImplementation([
                {
                    ok: false,
                    status: 404,
                    statusText: 'Not Found',
                },
            ])
        );

        const result = await getWeatherForecast(mockCampsite);
        expect(result).toEqual([]);
        expect(fetchSpy).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
    });

    it('returns empty array if forecast url is missing', async () => {
        fetchSpy.mockImplementation(
            mockFetchImplementation([
                {
                    ok: true,
                    body: { properties: {} },
                },
            ])
        );

        const result = await getWeatherForecast(mockCampsite);
        expect(result).toEqual([]);
        expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it('returns empty array if forecast fetch fails', async () => {
        fetchSpy.mockImplementation(
            mockFetchImplementation([
                {
                    ok: true,
                    body: { properties: { forecast: 'https://api.weather.gov/forecast/123' } },
                },
                {
                    ok: false,
                    status: 500,
                    statusText: 'Internal Server Error',
                },
            ])
        );

        const result = await getWeatherForecast(mockCampsite);
        expect(result).toEqual([]);
        expect(fetchSpy).toHaveBeenCalledTimes(4); // 1 for points + 3 for forecast (with retries)
    });

    it('returns empty array if an exception is thrown', async () => {
        fetchSpy.mockImplementation(() => {
            throw new Error('Network error');
        });

        const result = await getWeatherForecast(mockCampsite);
        expect(result).toEqual([]);
        expect(fetchSpy).toHaveBeenCalledTimes(3); // 3 attempts due to retries
    });
});