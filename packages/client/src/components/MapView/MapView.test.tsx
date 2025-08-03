import { render, screen, waitFor, act } from '@testing-library/react'
import { vi } from 'vitest'
import MapView from './MapView'
import '@testing-library/jest-dom'

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: any) => <div role="region">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />, // no-op
  Marker: ({ children }: any) => <div data-testid="person-marker">{children}</div>,
  Popup: ({ children }: any) => <div data-testid="person-popup">{children}</div>,
  Tooltip: ({ children }: any) => <div data-testid="person-tooltip">{children}</div>,
}))

vi.mock('../CampsiteMarker/CampsiteMarker', async () => {
  return {
    __esModule: true,
    default: ({ site }: any) => (
      <div data-testid="marker">
        <div data-testid="popup">
          <div>
            <strong>{site.name ? site.name : 'Unnamed Site'}</strong> <i>{site.state}</i>
          </div>
          <div>{site.description}</div>
          <div>
            <strong>Activities:</strong>{' '}
            {site.activities && site.activities.length > 0
              ? site.activities.join(', ')
              : 'No activities listed'}
          </div>
          <div>
            <strong>Elevation:</strong>{' '}
            {site.elevation != null && !isNaN(Number(site.elevation))
              ? `${site.elevation} m (${(site.elevation * 3.28084).toFixed(0)} ft)`
              : 'Unknown'}
          </div>
          <div>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${site.lat},${site.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="popup-button"
              role="button"
            >
              Get Directions
            </a>
            <a
              href={site.url}
              target="_blank"
              rel="noopener noreferrer"
              className="popup-button"
              role="button"
            >
              Get Details
            </a>
          </div>
        </div>
      </div>
    ),
  }
})

const mockCampsites = [
  {
    id: '1',
    name: 'Test Site',
    description: 'A nice place',
    lat: 40,
    lng: -105,
    requires_4wd: true,
    url: 'https://example.com/1',
    state: 'CO',
    mapLink: 'https://maps.example.com/1',
    source: 'BLM' as const,
  },
  {
    id: '2',
    name: '',
    description: '',
    lat: 41,
    lng: -106,
    requires_4wd: false,
    url: 'https://example.com/2',
    state: 'WY',
    mapLink: 'https://maps.example.com/2',
    source: 'BLM' as const,
  },
]

describe('MapView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('displays campsite markers from prop', async () => {
    await act(async () => {
      render(<MapView campsites={mockCampsites} />)
    })
    await waitFor(() => {
      expect(screen.getByRole('region')).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getAllByTestId('marker')).toHaveLength(2)
    })
  })

  it('handles empty campsites array', async () => {
    await act(async () => {
      render(<MapView campsites={[]} />)
    })
    await waitFor(() => {
      expect(screen.getByRole('region')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('marker')).not.toBeInTheDocument()
  })

  it('renders the current location marker and shows tooltip on hover', async () => {
    const mockGeolocation = {
      getCurrentPosition: (success: any) =>
        success({ coords: { latitude: 39.5, longitude: -106.5 } }),
    }
    // @ts-ignore
    global.navigator.geolocation = mockGeolocation

    await act(async () => {
      render(<MapView campsites={mockCampsites} />)
    })

    const showLocationBtn = await screen.findByRole('button', { name: /show my location/i })
    showLocationBtn.click()

    await waitFor(() => {
      expect(screen.getByTestId('person-marker')).toBeInTheDocument()
    })
    expect(screen.getByTestId('person-tooltip')).toHaveTextContent(/You are here/i)
  })
})
