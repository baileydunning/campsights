import { describe, it, expect, vi, beforeEach } from 'vitest';

const dbMock = {
  getRange: vi.fn(),
  put: vi.fn(),
  get: vi.fn(),
  remove: vi.fn(),
};
const getElevationMock = vi.fn();
const getWeatherForecastMock = vi.fn();

vi.mock('../../config/db', () => ({ db: dbMock }));
vi.mock('../elevation/elevationService', () => ({ getElevation: getElevationMock }));
vi.mock('../weather/weatherService', () => ({ getWeatherForecast: getWeatherForecastMock }));

let campsitesService: typeof import('./campsitesService');

beforeEach(async () => {
  vi.resetModules();
  Object.values(dbMock).forEach(fn => fn.mockReset());
  getElevationMock.mockReset();
  getWeatherForecastMock.mockReset();
  campsitesService = await import('./campsitesService');
});

describe('Campsites Service', () => {
  describe('getCampsites', () => {
    it('should return campsites with existing elevation', async () => {
      const campsite = { id: '1', lat: 10, lng: 20, elevation: 50 };
      dbMock.getRange.mockReturnValue([{ value: campsite }]);
      // No weather fetching for list endpoint

      const result = await campsitesService.getCampsites();

      expect(dbMock.getRange).toHaveBeenCalled();
      expect(getWeatherForecastMock).not.toHaveBeenCalled();
      expect(result).toEqual([{
        ...campsite
      }]);
    });

    it('should return empty list if db error', async () => {
      dbMock.getRange.mockImplementation(() => { throw new Error('DB failure'); });
      await expect(campsitesService.getCampsites()).rejects.toThrow('DB failure');
    });
  });

  describe('getCampsiteById', () => {
    it('should return campsite with weather', async () => {
      const campsite = { id: '123', lat: 10, lng: 20, elevation: 50 };
      dbMock.get.mockResolvedValue(campsite);
      const fakeWeather = [{ number: 1, name: 'Test', startTime: '', endTime: '', isDaytime: true, temperature: 70, temperatureUnit: 'F', windSpeed: '5 mph', windDirection: 'N', shortForecast: 'Sunny', detailedForecast: 'Clear skies' }];
      getWeatherForecastMock.mockResolvedValue(fakeWeather);

      const result = await campsitesService.getCampsiteById('123');

      expect(dbMock.get).toHaveBeenCalledWith('123');
      expect(getWeatherForecastMock).toHaveBeenCalledWith(campsite);
      expect(result).toEqual({ ...campsite, weather: fakeWeather });
    });

    it('should return null if campsite does not exist', async () => {
      dbMock.get.mockResolvedValue(null);
      const result = await campsitesService.getCampsiteById('nope');
      expect(result).toBeNull();
    });

    it('should throw on error', async () => {
      dbMock.get.mockRejectedValue(new Error('DB failure'));
      await expect(campsitesService.getCampsiteById('123')).rejects.toThrow('DB failure');
    });
  });

  describe('addCampsite', () => {
    it('should save elevation and return new campsite with weather', async () => {
      const input = { id: '2', lat: 30, lng: 40 };
      getElevationMock.mockResolvedValue(100);
      const fakeWeather = [];
      getWeatherForecastMock.mockResolvedValue(fakeWeather);

      const result = await campsitesService.addCampsite(input as any);

      expect(getElevationMock).toHaveBeenCalledWith(30, 40);
      expect(dbMock.put).toHaveBeenCalledWith('2', { ...input, elevation: 100 });
      expect(getWeatherForecastMock).toHaveBeenCalledWith({ ...input, elevation: 100 });
      expect(result).toEqual({ ...input, elevation: 100, weather: fakeWeather });
    });

    it('should throw on error', async () => {
      const input = { id: 'x', lat: 0, lng: 0 };
      getElevationMock.mockRejectedValue(new Error('elev fail'));
      await expect(campsitesService.addCampsite(input as any)).rejects.toThrow('elev fail');
    });
  });
});