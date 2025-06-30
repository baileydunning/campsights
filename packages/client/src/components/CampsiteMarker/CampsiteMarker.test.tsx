import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('react-leaflet', () => ({
  Marker: ({ children }: any) => <div data-testid="marker">{children}</div>,
  Popup: ({ children, eventHandlers }: any) => (
    <div
      data-testid="popup"
      onClick={() => eventHandlers?.popupclose?.()}
    >
      {children}
    </div>
  ),
}));

vi.mock('leaflet', () => ({
  DivIcon: class {},
}));

vi.mock('../EditCampsiteForm/EditCampsiteForm', () => ({
  __esModule: true,
  default: ({ onCancel }: any) => (
    <button data-testid="edit-form" onClick={onCancel}>
      Mock Edit Form
    </button>
  ),
}));

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
    },
  ],
  last_updated: '2024-01-01T00:00:00Z',
};

describe('<CampsiteMarker />', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders marker and popup with site info', () => {
    render(<CampsiteMarker site={sampleSite} />);

    expect(screen.getByTestId('marker')).toBeInTheDocument();
    expect(screen.getByText('Test Site')).toBeInTheDocument();
    expect(screen.getByText('A lovely place')).toBeInTheDocument();
    expect(screen.getByText('100 m (328 ft)')).toBeInTheDocument();
    expect(screen.getByText('Yes')).toBeInTheDocument();
    expect(screen.getByText('Morning (Day)')).toBeInTheDocument();
    expect(screen.getByText('Evening (Night)')).toBeInTheDocument();
  });

  it('toggles edit mode when clicking Edit Campsite button', () => {
    render(<CampsiteMarker site={sampleSite} />);

    const editButton = screen.getByRole('button', { name: /Edit Campsite/i });
    fireEvent.click(editButton);

    expect(screen.getByTestId('edit-form')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('edit-form'));
    expect(screen.queryByTestId('edit-form')).not.toBeInTheDocument();
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
});