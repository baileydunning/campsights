import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import CampsiteMarker from './CampsiteMarker';
import type { Campsite } from '../../types/Campsite';
import * as api from '../../api/Campsites';

// Render the popup contents directly and fire popupopen on mount.
vi.mock('react-leaflet', async () => {
  const { useEffect } = await import('react');
  return {
    Marker: ({ children, eventHandlers }: any) => {
      useEffect(() => eventHandlers?.popupopen?.(), []);
      return <div data-testid="marker">{children}</div>;
    },
    Popup: ({ children }: any) => <div data-testid="popup">{children}</div>,
  };
});

vi.mock('../MapView/icons', () => ({ tentIcon: {} }));

const site: Campsite = {
  id: 'abc',
  name: 'Test Site',
  url: 'https://example.com/test-site',
  lat: 40,
  lng: -105,
  state: 'Colorado',
  mapLink: '',
  description: 'A lovely place',
  activities: ['CAMPING', 'HIKING', 'FISHING', 'BIKING', 'BOATING', 'HUNTING', 'OHV'],
  stayLimit: '14 days.',
  images: [{ src: 'https://example.com/a.jpg', alt: 'The view' }],
  source: 'BLM',
};

const renderMarker = (s: Campsite) =>
  render(
    <MemoryRouter>
      <CampsiteMarker site={s} />
    </MemoryRouter>
  );

describe('<CampsiteMarker />', () => {
  afterEach(() => vi.restoreAllMocks());

  it('shows the campsite preview and fills in today\'s weather when opened', async () => {
    vi.spyOn(api, 'getCampsiteById').mockResolvedValue({
      ...site,
      elevation: 2000,
      nearestTown: { city: 'Salida', state: 'CO', distanceMiles: 8.4, direction: 'N' },
      weather: [
        { number: 1, name: 'Today', isDaytime: true, temperature: 61, temperatureUnit: 'F', windSpeed: '5 mph', windDirection: 'W', shortForecast: 'Sunny', detailedForecast: '', startTime: '', endTime: '' },
        { number: 2, name: 'Tonight', isDaytime: false, temperature: 29, temperatureUnit: 'F', windSpeed: '5 mph', windDirection: 'W', shortForecast: 'Clear', detailedForecast: '', startTime: '', endTime: '' },
      ],
    });

    renderMarker(site);
    expect(screen.getByText('Test Site')).toBeInTheDocument();
    expect(screen.getByText('A lovely place')).toBeInTheDocument();
    expect(screen.getByText('Camping')).toBeInTheDocument();
    expect(screen.getByText('+2 more')).toBeInTheDocument();
    expect(screen.getByText('Stay limit: 14 days')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'The view' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Get Details/i })).toHaveAttribute('href', '/campsites/abc');

    expect(await screen.findByText('61°')).toBeInTheDocument();
    expect(screen.getByText('29°')).toBeInTheDocument();
    expect(screen.getByText('Today: Sunny')).toBeInTheDocument();
    expect(screen.getByText('6,562 ft')).toBeInTheDocument();
    expect(screen.getByText('Colorado · 8 mi N of Salida')).toBeInTheDocument();
  });

  it('says the forecast is unavailable when the request fails', async () => {
    vi.spyOn(api, 'getCampsiteById').mockRejectedValue(new Error('offline'));
    renderMarker({ ...site, id: 'def', name: '', images: undefined });
    expect(screen.getByText('Unnamed Site')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Forecast unavailable')).toBeInTheDocument());
  });
});
