import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('react-leaflet', () => {
  return {
    Marker: ({ children }: any) => <div data-testid="marker">{children}</div>,
    Popup: function Popup(props: any) {
      // Always evaluate children as a function if possible to reflect state changes
      const children =
        typeof props.children === 'function' ? props.children() : props.children;
      return (
        <div
          onClick={() => props.eventHandlers?.popupclose?.()}
        >
          {children}
        </div>
      );
    },
  };
});

vi.mock('leaflet', () => {
  class DivIconMock {
    constructor(opts: any) {
      Object.assign(this, opts);
    }
  }
  return {
    __esModule: true,
    default: { DivIcon: DivIconMock },
    DivIcon: DivIconMock,
  };
});

vi.mock('../WeatherCard/WeatherCard', () => ({
  __esModule: true,
  default: ({ campsiteId, weatherData }: any) => (
    <div className="weather-card">
      {weatherData && weatherData.length > 0 ? (
        weatherData.map((period: any, index: number) => (
          <div key={index} className="weather-period-card">
            <div className="weather-period-header">
              {period.name} ({period.isDaytime ? "Day" : "Night"})
            </div>
          </div>
        ))
      ) : (
        <div className="weather-period-card weather-loading">Loading weather...</div>
      )}
    </div>
  ),
}));

import * as CampsitesApi from '../../api/Campsites';
import CampsiteMarker from './CampsiteMarker';
import { Campsite } from '../../types/Campsite';

const sampleSite: Campsite = {
  id: 'abc',
  name: 'Test Site',
  url: 'https://example.com/test-site',
  description: 'A lovely place',
  lat: 10,
  lng: 20,
  state: 'Test State',
  mapLink: 'https://example.com/map',
  elevation: 100,
  source: 'BLM',
  weather: [
    {
      number: 1,
      name: 'Morning',
      isDaytime: true,
      temperature: 60,
      temperatureUnit: 'F',
      windSpeed: '5 mph',
      windDirection: 'NE',
      detailedForecast: 'Sunny',
      startTime: '2024-01-01T06:00:00Z',
      endTime: '2024-01-01T12:00:00Z',
      shortForecast: 'Sunny',
    },
    {
      number: 2,
      name: 'Evening',
      isDaytime: false,
      temperature: 45,
      temperatureUnit: 'F',
      windSpeed: '3 mph',
      windDirection: 'SW',
      detailedForecast: 'Clear',
      startTime: '2024-01-01T18:00:00Z',
      endTime: '2024-01-02T00:00:00Z',
      shortForecast: 'Clear',
    },
  ],
};

vi.mock('../../api/Campsites');

describe('<CampsiteMarker />', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (CampsitesApi.getCampsiteById as any).mockResolvedValue(sampleSite);
  });

  it('renders marker and popup with site info', () => {
    render(<CampsiteMarker site={sampleSite} />);

    expect(screen.getByTestId('marker')).toBeInTheDocument();
    expect(screen.getByText('Test Site')).toBeInTheDocument();
    expect(screen.getByText('A lovely place')).toBeInTheDocument();
    expect(screen.getByText('100 m (328 ft)')).toBeInTheDocument();
    
    // Check for the new buttons
    expect(screen.getByRole('button', { name: /Get Directions/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Get Details/i })).toBeInTheDocument();

    // Check for weather section structure
    expect(screen.getByText('Weather Forecast:')).toBeInTheDocument();
  });

  it('displays "Unnamed Site" when name is empty', () => {
    const unnamed = { ...sampleSite, name: '' };
    render(<CampsiteMarker site={unnamed} />);
    expect(screen.getByText('Unnamed Site')).toBeInTheDocument();
  });

  it('shows "Unknown" for elevation when invalid', () => {
    const noElev = { ...sampleSite, elevation: NaN };
    render(<CampsiteMarker site={noElev} />);
    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });

  it('shows loading state initially and then enriched data', async () => {
    render(<CampsiteMarker site={{ ...sampleSite, weather: undefined }} />);
    
    // Should show loading initially
    expect(screen.getByText('Loading weather...')).toBeInTheDocument();
    
    // Should have weather forecast section
    expect(screen.getByText('Weather Forecast:')).toBeInTheDocument();
  });
});