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
    it('should return campsites with existing elevation and fetched weather', async () => {
      const campsite = { id: '1', lat: 10, lng: 20, elevation: 50 };
      dbMock.getRange.mockReturnValue([{ value: campsite }]);
      const fakeWeather = [{ number: 1, name: 'Test', startTime: '', endTime: '', isDaytime: true, temperature: 70, temperatureUnit: 'F', windSpeed: '5 mph', windDirection: 'N', shortForecast: 'Sunny', detailedForecast: 'Clear skies' }];
      getWeatherForecastMock.mockResolvedValue(fakeWeather);

      const result = await campsitesService.getCampsites();

      expect(dbMock.getRange).toHaveBeenCalled();
      expect(getWeatherForecastMock).toHaveBeenCalledWith(campsite);
      expect(result).toEqual([{
        ...campsite,
        weather: fakeWeather
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

  describe('updateCampsite', () => {
    it('should return null if campsite does not exist', async () => {
      dbMock.get.mockResolvedValue(null);
      const result = await campsitesService.updateCampsite('nope', { id: '', lat: 0, lng: 0 } as any);
      expect(result).toBeNull();
    });

    it('should reuse existing elevation if lat/lng unchanged', async () => {
      const existing = { id: '3', lat: 5, lng: 6, elevation: 20 };
      dbMock.get.mockResolvedValue(existing);
      const update = { lat: 5, lng: 6 } as any;
      const fakeWeather = [{} as any];
      getWeatherForecastMock.mockResolvedValue(fakeWeather);

      const result = await campsitesService.updateCampsite('3', update);

      expect(getElevationMock).not.toHaveBeenCalled();
      expect(dbMock.put).toHaveBeenCalledWith('3', { ...update, id: '3', elevation: 20 });
      expect(getWeatherForecastMock).toHaveBeenCalledWith({ ...update, id: '3', elevation: 20 });
      expect(result).toEqual({ ...update, id: '3', elevation: 20, weather: fakeWeather });
    });

    it('should fetch new elevation if lat/lng changed', async () => {
      const existing = { id: '4', lat: 1, lng: 2, elevation: 10 };
      dbMock.get.mockResolvedValue(existing);
      const update = { lat: 9, lng: 8 } as any;
      getElevationMock.mockResolvedValue(200);
      const fakeWeather = [];
      getWeatherForecastMock.mockResolvedValue(fakeWeather);

      const result = await campsitesService.updateCampsite('4', update);

      expect(getElevationMock).toHaveBeenCalledWith(9, 8);
      expect(dbMock.put).toHaveBeenCalledWith('4', { ...update, id: '4', elevation: 200 });
      expect(result).toEqual({ ...update, id: '4', elevation: 200, weather: fakeWeather });
    });

    it('should throw on error', async () => {
      dbMock.get.mockResolvedValue({ id: 'x', lat: 0, lng: 0 } as any);
      getElevationMock.mockRejectedValue(new Error('fail'));    
      await expect(campsitesService.updateCampsite('x', { lat:0, lng:0 } as any)).rejects.toThrow('fail');
    });
  });

  describe('deleteCampsite', () => {
    it('should return false if campsite does not exist', async () => {
      dbMock.get.mockResolvedValue(null);
      const result = await campsitesService.deleteCampsite('none');
      expect(result).toBe(false);
    });

    it('should delete and return true if exists', async () => {
      dbMock.get.mockResolvedValue({ id: '5' } as any);
      const result = await campsitesService.deleteCampsite('5');
      expect(dbMock.remove).toHaveBeenCalledWith('5');
      expect(result).toBe(true);
    });

    it('should throw on error', async () => {
      dbMock.get.mockRejectedValue(new Error('db fail'));
      await expect(campsitesService.deleteCampsite('err')).rejects.toThrow('db fail');
    });
  });
});
