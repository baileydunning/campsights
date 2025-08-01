import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import * as CampsitesApi from '../../api/Campsites';
import { Campsite } from '../../types/Campsite';

vi.mock('leaflet', () => {
  return {
    __esModule: true,
    default: { DivIcon: vi.fn().mockImplementation((opts) => opts) },
    DivIcon: vi.fn().mockImplementation((opts) => opts),
  };
});

import CampsiteMarker from './CampsiteMarker';

vi.mock('../WeatherCard/WeatherCard', () => ({
  default: ({ weatherData }: any) => (
    <div>
      {weatherData ? (
        weatherData.map((w: any, i: number) => (
          <div key={i}>{`${w.name} (${w.isDaytime ? 'Day' : 'Night'})`}</div>
        ))
      ) : (
        <div>Loading weather...</div>
      )}
    </div>
  ),
}));

vi.mock('../../api/Campsites');

const mockSite: Campsite = {
  id: 'site-1',
  name: 'Mock Site',
  url: 'https://example.com',
  description: 'Short description',
  lat: 39.7392,
  lng: -104.9903,
  state: 'Colorado',
  mapLink: 'https://maps.example.com',
  elevation: 2000,
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
      shortForecast: 'Sunny',
      startTime: '',
      endTime: '',
    },
  ],
};

vi.mock('react-leaflet', () => ({
  Marker: ({ children }: any) => <div data-testid="marker">{children}</div>,
  Popup: ({ children }: any) => <div>{children}</div>,
}));

describe('<CampsiteMarker />', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (CampsitesApi.getCampsiteById as any).mockResolvedValue(mockSite);
  });

  it('renders basic info and buttons', () => {
    render(<CampsiteMarker site={mockSite} />);
    expect(screen.getByText('Mock Site')).toBeInTheDocument();
    expect(screen.getByText('Colorado')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Get Directions/i })).toHaveAttribute(
      'href',
      expect.stringContaining(`${mockSite.lat},${mockSite.lng}`)
    );
    expect(screen.getByRole('button', { name: /Get Details/i })).toHaveAttribute('href', mockSite.url);
    expect(screen.getByText('Weather Forecast:')).toBeInTheDocument();
  });

  it('renders "Unnamed Site" if name is empty', () => {
    render(<CampsiteMarker site={{ ...mockSite, name: '' }} />);
    expect(screen.getByText('Unnamed Site')).toBeInTheDocument();
  });

  it('renders "Unknown" if elevation is invalid', () => {
    render(<CampsiteMarker site={{ ...mockSite, elevation: NaN }} />);
    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });
});