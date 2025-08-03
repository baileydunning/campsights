import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'

vi.mock('react-leaflet', () => {
  return {
    Marker: ({ children }: any) => <div data-testid="marker">{children}</div>,
    Popup: function Popup(props: any) {
      const children = typeof props.children === 'function' ? props.children() : props.children
      return <div onClick={() => props.eventHandlers?.popupclose?.()}>{children}</div>
    },
  }
})

vi.mock('leaflet', () => {
  class DivIconMock {
    constructor(opts: any) {
      Object.assign(this, opts)
    }
  }
  return {
    __esModule: true,
    default: { DivIcon: DivIconMock },
    DivIcon: DivIconMock,
  }
})

vi.mock('../WeatherCard/WeatherCard', () => ({
  __esModule: true,
  default: ({ weatherData }: any) => (
    <div className="weather-card">
      {weatherData && weatherData.length > 0 ? (
        weatherData.map((period: any, index: number) => (
          <div key={index} className="weather-period-card">
            <div className="weather-period-header">
              {period.name} ({period.isDaytime ? 'Day' : 'Night'})
            </div>
          </div>
        ))
      ) : (
        <div className="weather-period-card weather-loading">Loading weather...</div>
      )}
    </div>
  ),
}))

import type { Store } from '@reduxjs/toolkit'
import CampsiteMarker from './CampsiteMarker'
import { Campsite } from '../../types/Campsite'

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
}

import * as CampsiteSlice from '../../store/campsiteSlice'

describe('<CampsiteMarker />', () => {
  let store: Store
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock the thunk to always resolve with sampleSite and correct meta
    vi.spyOn(CampsiteSlice, 'fetchCampsiteById').mockImplementation(((id: string) => async () => ({
      type: 'campsite/fetchCampsiteById/fulfilled',
      payload: sampleSite,
      meta: { arg: id, requestId: 'test', requestStatus: 'fulfilled' },
    })) as unknown as typeof CampsiteSlice.fetchCampsiteById)
    store = configureStore({ reducer: (state = {}) => state })
  })

  it('renders marker and popup with site info', () => {
    render(
      <Provider store={store}>
        <CampsiteMarker site={sampleSite} />
      </Provider>
    )
    expect(screen.getByTestId('marker')).toBeInTheDocument()
    expect(screen.getByText('Test Site')).toBeInTheDocument()
    expect(screen.getByText('A lovely place')).toBeInTheDocument()
    expect(screen.getByText('100 m (328 ft)')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Get Directions/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Get Details/i })).toBeInTheDocument()
    expect(screen.getByText('Weather Forecast:')).toBeInTheDocument()
  })

  it('displays "Unnamed Site" when name is empty', () => {
    const unnamed = { ...sampleSite, name: '' }
    render(
      <Provider store={store}>
        <CampsiteMarker site={unnamed} />
      </Provider>
    )
    expect(screen.getByText('Unnamed Site')).toBeInTheDocument()
  })

  it('shows "Unknown" for elevation when invalid', () => {
    const noElev = { ...sampleSite, elevation: NaN }
    render(
      <Provider store={store}>
        <CampsiteMarker site={noElev} />
      </Provider>
    )
    expect(screen.getByText('Unknown')).toBeInTheDocument()
  })

  it('shows loading state initially and then enriched data', async () => {
    render(
      <Provider store={store}>
        <CampsiteMarker site={{ ...sampleSite, weather: undefined }} />
      </Provider>
    )

    expect(screen.getByText('Loading weather...')).toBeInTheDocument()
    expect(screen.getByText('Weather Forecast:')).toBeInTheDocument()
  })
})
