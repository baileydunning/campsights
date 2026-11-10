import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import CampsiteMarker from './CampsiteMarker';
import type { Campsite } from '../../types/Campsite';

vi.mock('react-leaflet', () => ({
  Marker: ({ children }: any) => <div data-testid="marker">{children}</div>,
  Popup: ({ children }: any) => <div data-testid="popup">{children}</div>,
}));

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
  activities: ['CAMPING', 'HIKING', 'FISHING', 'BIKING'],
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
  it('renders a preview card with photo, details and actions', () => {
    renderMarker(site);
    expect(screen.getByText('Test Site')).toBeInTheDocument();
    expect(screen.getByText('Colorado')).toBeInTheDocument();
    expect(screen.getByText('A lovely place')).toBeInTheDocument();
    expect(screen.getByText('Camping · Hiking · Fishing')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'The view' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Get Directions/i })).toHaveAttribute(
      'href',
      'https://www.google.com/maps/dir/?api=1&destination=40,-105'
    );
    expect(screen.getByRole('button', { name: /Get Details/i })).toHaveAttribute('href', '/campsites/abc');
  });

  it('shows "Unnamed Site" and no photo when those are missing', () => {
    renderMarker({ ...site, name: '', images: undefined });
    expect(screen.getByText('Unnamed Site')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
