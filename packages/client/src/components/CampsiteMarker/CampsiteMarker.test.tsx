import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import campsiteReducer from '../../store/campsiteSlice';
import userReducer, { setUser } from '../../store/userSlice';

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

vi.mock('../EditCampsiteForm/EditCampsiteForm', () => ({
  __esModule: true,
  default: ({ onCancel }: any) => (
    <button data-testid="edit-form" onClick={onCancel}>
      Mock Edit Form
    </button>
  ),
}));

import * as CampsitesApi from '../WeatherCard/../../api/Campsites';
import CampsiteMarker from './CampsiteMarker';
import { Campsite } from '../../types/Campsite';

const sampleSite: Campsite & { weather: any[] } = {
  id: 'abc',
  name: 'Test Site',
  description: 'A lovely place',
  lat: 10,
  lng: 20,
  elevation: 100,
  requires_4wd: true,
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
  last_updated: '2024-01-01T00:00:00Z',
};

vi.mock('../WeatherCard/../../api/Campsites');

function renderWithProvider(ui: React.ReactElement, { user }: { user?: { token: string; username: string } } = {}) {
  const store = configureStore({
    reducer: { campsites: campsiteReducer, user: userReducer },
  });
  if (user) {
    store.dispatch(setUser(user));
  }
  return render(<Provider store={store}>{ui}</Provider>);
}

describe('<CampsiteMarker />', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (CampsitesApi.getCampsiteById as any).mockResolvedValue({ weather: sampleSite.weather });
  });

  it('renders marker and popup with site info', async () => {
    renderWithProvider(<CampsiteMarker site={sampleSite} />, { user: { token: 'abc', username: 'testuser' } });

    expect(screen.getByTestId('marker')).toBeInTheDocument();
    expect(screen.getByText('Test Site')).toBeInTheDocument();
    expect(screen.getByText('A lovely place')).toBeInTheDocument();
    expect(screen.getByText('100 m (328 ft)')).toBeInTheDocument();
    expect(screen.getByText('Yes')).toBeInTheDocument();

    await screen.findByText((content, node) =>
      node?.textContent?.replace(/\s+/g, '') === 'Morning(Day)'
    );
    expect(screen.getByText((content, node) =>
      node?.textContent?.replace(/\s+/g, '') === 'Morning(Day)'
    )).toBeInTheDocument();
    expect(screen.getByText((content, node) =>
      node?.textContent?.replace(/\s+/g, '') === 'Evening(Night)'
    )).toBeInTheDocument();
  });

  it('toggles edit mode when clicking Edit Campsite button', async () => {
    renderWithProvider(<CampsiteMarker site={sampleSite} />, { user: { token: 'abc', username: 'testuser' } });
    const editButton = screen.getByRole('button', { name: /Edit Campsite/i });
    fireEvent.click(editButton);

    // Wait for the edit form to appear
    expect(await screen.findByTestId('edit-form')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('edit-form'));
    expect(screen.queryByTestId('edit-form')).not.toBeInTheDocument();
  });

  it('displays "Unnamed Site" when name is empty', () => {
    const unnamed = { ...sampleSite, name: '' };
    renderWithProvider(<CampsiteMarker site={unnamed} />, { user: { token: 'abc', username: 'testuser' } });
    expect(screen.getByText('Unnamed Site')).toBeInTheDocument();
  });

  it('shows "Unknown" for elevation when invalid', () => {
    const noElev = { ...sampleSite, elevation: NaN };
    renderWithProvider(<CampsiteMarker site={noElev} />, { user: { token: 'abc', username: 'testuser' } });
    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });
});