import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

const getElevationMock = vi.fn();
const getWeatherForecastMock = vi.fn();

vi.mock('../elevation/elevationService', () => ({ getElevation: getElevationMock }));
vi.mock('../weather/weatherService', () => ({ getWeatherForecast: getWeatherForecastMock }));

let campsitesService: typeof import('./campsitesService');

beforeEach(async () => {
  vi.resetModules();
  mockFetch.mockReset();
  getElevationMock.mockReset();
  getWeatherForecastMock.mockReset();
  campsitesService = await import('./campsitesService');
});

describe('Campsites Service', () => {
  describe('getCampsites', () => {
    it('should return filtered campsites from BLM API', async () => {
      const mockCampsites = [
        { id: '1', lat: 10, lng: 20, name: 'Test Campsite 1' },
        { id: '2', lat: 30, lng: 40, name: 'Test Campsite 2' },
        { id: '3', lat: null, lng: 50, name: 'Invalid Campsite' }, // Should be filtered out
      ];
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCampsites)
      });

      const result = await campsitesService.getCampsites();

      expect(mockFetch).toHaveBeenCalledWith('https://blm-spider.onrender.com/api/v1/campsites', expect.objectContaining({
        signal: expect.any(AbortSignal),
        keepalive: true,
        headers: expect.objectContaining({
          'Connection': 'keep-alive',
          'Accept-Encoding': 'gzip, deflate, br',
          'User-Agent': 'Campsights-API/1.0'
        })
      }));
      expect(result).toEqual([
        { id: '1', lat: 10, lng: 20, name: 'Test Campsite 1' },
        { id: '2', lat: 30, lng: 40, name: 'Test Campsite 2' }
      ]);
    });

    it('should throw error if BLM API fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('API failure'));
      
      await expect(campsitesService.getCampsites()).rejects.toThrow('API failure');
    });
  });

  describe('getCampsiteById', () => {
    it('should return campsite with elevation and weather', async () => {
      const mockCampsite = { id: '123', lat: 10, lng: 20, name: 'Test Campsite', elevation: null };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCampsite)
      });
      
      getElevationMock.mockResolvedValue(100);
      const fakeWeather = [{ 
        number: 1, 
        name: 'Test', 
        startTime: '', 
        endTime: '', 
        isDaytime: true, 
        temperature: 70, 
        temperatureUnit: 'F', 
        windSpeed: '5 mph', 
        windDirection: 'N', 
        shortForecast: 'Sunny', 
        detailedForecast: 'Clear skies' 
      }];
      getWeatherForecastMock.mockResolvedValue(fakeWeather);

      const result = await campsitesService.getCampsiteById('123');

      expect(mockFetch).toHaveBeenCalledWith('https://blm-spider.onrender.com/api/v1/campsites/123', expect.objectContaining({
        signal: expect.any(AbortSignal),
        keepalive: true,
        headers: expect.objectContaining({
          'Connection': 'keep-alive',
          'Accept-Encoding': 'gzip, deflate, br',
          'User-Agent': 'Campsights-API/1.0'
        })
      }));
      expect(getElevationMock).toHaveBeenCalledWith(10, 20);
      expect(getWeatherForecastMock).toHaveBeenCalledWith(mockCampsite);
      expect(result).toEqual({ 
        ...mockCampsite, 
        elevation: 100, 
        weather: fakeWeather 
      });
    });

    it('should use existing elevation if available', async () => {
      const mockCampsite = { id: '123', lat: 10, lng: 20, name: 'Test Campsite', elevation: 50 };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCampsite)
      });
      
      const fakeWeather = [];
      getWeatherForecastMock.mockResolvedValue(fakeWeather);

      const result = await campsitesService.getCampsiteById('123');

      expect(getElevationMock).not.toHaveBeenCalled(); // Should not fetch elevation if already exists
      expect(result).toEqual({ 
        ...mockCampsite, 
        elevation: 50, 
        weather: fakeWeather 
      });
    });

    it('should return null if campsite does not exist', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      });
      
      const result = await campsitesService.getCampsiteById('nope');
      
      expect(result).toBeNull();
    });

    it('should throw on fetch error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('API failure'));
      
      await expect(campsitesService.getCampsiteById('123')).rejects.toThrow('API failure');
    });
  });
});