import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';
import { Provider } from 'react-redux';
import * as reduxHooks from 'react-redux';
import { fetchCampsites } from './store/campsiteSlice';
import React from 'react';
import type { Campsite } from './types/Campsite';

vi.mock('./components/Loading/Loading', () => ({
  default: () => <div data-testid="loading-spinner">Loading...</div>,
}));

vi.mock('./components/SearchBar/SearchBar', () => ({
  default: ({ onSearchResults }: any) => {
    React.useEffect(() => {
      onSearchResults(mockCampsites);
    }, []);
    return <div data-testid="searchbar">SearchBar</div>;
  },
}));

vi.mock('./components/MapView/MapView', () => ({
  default: ({ campsites }: any) => (
    <div data-testid="mapview">{`MapView: ${campsites?.length || 0}`}</div>
  ),
}));

const mockDispatch = vi.fn();

const mockCampsites: Campsite[] = [
  {
    id: '1',
    name: 'Mock Camp',
    url: 'https://example.com/campsite',
    lat: 39.25,
    lng: -106.29,
    state: 'Colorado',
    mapLink: 'https://maps.example.com/mockcamp',
    elevation: 9500,
    description: 'Beautiful remote camp.',
    directions: 'Take the trail to the fork, then west.',
    activities: ['hiking', 'fishing'],
    campgrounds: ['Main Loop'],
    wildlife: ['elk', 'eagle'],
    fees: '$10/night',
    stayLimit: '14 days',
    images: [
      {
        src: 'https://example.com/image.jpg',
        alt: 'Mock campsite image',
        credit: 'Photo by NPS',
      },
    ],
    source: 'BLM',
  },
];

const mockGetCurrentPosition = vi.fn();
Object.defineProperty(global.navigator, 'geolocation', {
  value: {
    getCurrentPosition: mockGetCurrentPosition,
  },
});


afterEach(() => {
  mockGetCurrentPosition.mockReset();
});

import { configureStore } from '@reduxjs/toolkit';
import campsiteSlice from './store/campsiteSlice';

const renderApp = () => {
  const store = configureStore({
    reducer: { campsites: campsiteSlice },
    preloadedState: {
      campsites: {
        campsites: mockCampsites,
        loading: false,
        error: null,
      },
    },
  });
  const dispatchSpy = vi.spyOn(store, 'dispatch');
  return {
    ...render(
      <Provider store={store}>
        <App />
      </Provider>
    ),
    store,
    dispatchSpy,
  };
};

describe('App Component', () => {
  it('renders headers and SearchBar', () => {
    renderApp();
    expect(screen.getByText(/Campsights/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Explore Dispersed Campsites on Public Lands/i)
    ).toBeInTheDocument();
    expect(screen.getByTestId('searchbar')).toBeInTheDocument();
  });

  it('dispatches fetchCampsites on mount', () => {
    const { dispatchSpy } = renderApp();
    expect(dispatchSpy).toHaveBeenCalled();
    const dispatched = dispatchSpy.mock.calls[0][0];
    expect(typeof dispatched).toBe('function');
  });

  it('renders MapView with filtered data', async () => {
    renderApp();
    await waitFor(() =>
      expect(screen.getByTestId('mapview')).toHaveTextContent(/MapView: 1/)
    );
  });

  it('renders "Show My Location" button initially', () => {
    renderApp();
    const button = screen.getByRole('button', { name: /Show My Location/i });
    expect(button).toBeInTheDocument();
  });

  it('clicking "Show My Location" triggers geolocation', async () => {
    renderApp();
    const button = screen.getByRole('button', { name: /Show My Location/i });
    fireEvent.click(button);
    await waitFor(() =>
      expect(mockGetCurrentPosition).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function)
      )
    );
  });

  it('contains GitHub link with correct href', () => {
    renderApp();
    const link = screen.getByRole('link', { name: /View on GitHub/i });
    expect(link).toHaveAttribute(
      'href',
      'https://github.com/baileydunning/campsights'
    );
  });
});
