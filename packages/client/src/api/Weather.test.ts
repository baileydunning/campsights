import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { getWeatherForecast, WeatherPeriod } from './Weather';
import { Campsite } from '../types/Campsite';
import { act } from 'react';

vi.mock('axios');
const mockedAxios = axios as unknown as {
    get: ReturnType<typeof vi.fn>;
};

describe('getWeatherForecast', () => {
    const mockCampsite: Campsite = {
        id: '1',
        name: 'Test Campsite',
        lat: 40.0,
        lng: -105.0,
        // add other required fields if present in Campsite type
    } as Campsite;

    const pointsResponse = {
        data: {
            properties: {
                forecast: 'https://api.weather.gov/gridpoints/BOU/62,61/forecast'
            }
        }
    };

    const forecastPeriods: WeatherPeriod[] = [
        {
            name: 'Tonight',
            startTime: '2023-06-01T18:00:00-06:00',
            endTime: '2023-06-02T06:00:00-06:00',
            temperature: 55,
            temperatureUnit: 'F',
            windSpeed: '5 mph',
            windDirection: 'NW',
            shortForecast: 'Clear',
            detailedForecast: 'Clear, with a low around 55.'
        }
    ];

    const forecastResponse = {
        data: {
            properties: {
                periods: forecastPeriods
            }
        }
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('fetches weather forecast successfully', async () => {
        mockedAxios.get = vi.fn()
            .mockResolvedValueOnce(pointsResponse)
            .mockResolvedValueOnce(forecastResponse);

        let result;
        await act(async () => {
            result = await getWeatherForecast(mockCampsite);
        });

        expect(mockedAxios.get).toHaveBeenCalledTimes(2);
        expect(mockedAxios.get).toHaveBeenCalledWith(
            `https://api.weather.gov/points/${mockCampsite.lat},${mockCampsite.lng}`,
            expect.objectContaining({ headers: expect.any(Object) })
        );
        expect(result).toEqual(forecastPeriods);
    });

    it('throws if forecast URL is missing', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        mockedAxios.get = vi.fn().mockResolvedValueOnce({ data: { properties: {} } });

        await expect(getWeatherForecast(mockCampsite)).rejects.toThrow('No forecast URL found');
        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(consoleSpy).toHaveBeenCalledWith('Error fetching weather forecast:', expect.any(Error));
        consoleSpy.mockRestore();
    });

    it('throws and logs error if axios fails', async () => {
        const error = new Error('Network error');
        mockedAxios.get = vi.fn().mockRejectedValueOnce(error);

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        await expect(getWeatherForecast(mockCampsite)).rejects.toThrow('Network error');
        expect(consoleSpy).toHaveBeenCalledWith('Error fetching weather forecast:', error);

        consoleSpy.mockRestore();
    });

    it('returns empty array if periods is missing', async () => {
        mockedAxios.get = vi.fn()
            .mockResolvedValueOnce(pointsResponse)
            .mockResolvedValueOnce({ data: { properties: {} } });

        const result = await getWeatherForecast(mockCampsite);
        expect(result).toEqual([]);
    });
});