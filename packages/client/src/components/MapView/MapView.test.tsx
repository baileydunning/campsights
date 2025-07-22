import React from 'react';
import { render, screen, waitFor, within, act } from "@testing-library/react";
import { vi } from 'vitest';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import MapView from "./MapView";
import campsiteSlice from "../../store/campsiteSlice";

vi.mock("react-leaflet", () => ({
  MapContainer: ({ children }: any) => <div role="region">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />, // no-op
  Marker: ({ children }: any) => <div data-testid="person-marker">{children}</div>,
  Popup: ({ children }: any) => <div data-testid="person-popup">{children}</div>,
  Tooltip: ({ children }: any) => <div data-testid="person-tooltip">{children}</div>,
}));

vi.mock("../CampsiteMarker/CampsiteMarker", async () => {
  return {
    __esModule: true,
    default: ({ site }: any) => (
      <div data-testid="marker">
        <div data-testid="popup">
          <div>{site.name ? site.name : "Unnamed Site"}</div>
          <div>{site.description}</div>
          <div>Requires 4WD: {site.requires_4wd ? "Yes" : "No"}</div>
        </div>
      </div>
    ),
  };
});

const mockCampsites = [
  {
    id: "1", 
    name: "Test Site",
    description: "A nice place",
    lat: 40,
    lng: -105,
    requires_4wd: true,
  },
  {
    id: "2", 
    name: "",
    description: "",
    lat: 41,
    lng: -106,
    requires_4wd: false,
  },
];

const createTestStore = (preloadedState = {}) => {
  return configureStore({
    reducer: {
      campsites: campsiteSlice,
    },
    preloadedState: {
      campsites: {
        campsites: [],
        loading: false,
        error: null,
        ...preloadedState,
      },
    },
  });
};

const renderWithProvider = (component: React.ReactElement, store = createTestStore()) => {
  return render(
    <Provider store={store}>
      {component}
    </Provider>
  );
};

describe("MapView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows error state when there's an error in Redux", async () => {
    const store = createTestStore({ error: "API Error" });
    await act(async () => {
      renderWithProvider(<MapView />, store);
    });
    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
    });
  });

  it("displays campsite markers from Redux store", async () => {
    const store = createTestStore({ campsites: mockCampsites });
    await act(async () => {
      renderWithProvider(<MapView />, store);
    });
    await waitFor(() => {
      expect(screen.getByRole("region")).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getAllByTestId("marker")).toHaveLength(2);
    });
  });





  it("handles empty campsites array", async () => {
    const store = createTestStore({ campsites: [] });
    await act(async () => {
      renderWithProvider(<MapView />, store);
    });
    await waitFor(() => {
      expect(screen.getByRole("region")).toBeInTheDocument();
    });
    expect(screen.queryByTestId("marker")).not.toBeInTheDocument();
  });



  it("renders the current location marker and shows tooltip on hover", async () => {
    const mockGeolocation = {
      getCurrentPosition: (success: any) => success({ coords: { latitude: 39.5, longitude: -106.5 } })
    };
    // @ts-ignore
    global.navigator.geolocation = mockGeolocation;

    await act(async () => {
      renderWithProvider(<MapView />);
    });

    const showLocationBtn = await screen.findByRole('button', { name: /show my location/i });
    showLocationBtn.click();

    await waitFor(() => {
      expect(screen.getByTestId("person-marker")).toBeInTheDocument();
    });
    expect(screen.getByTestId("person-tooltip")).toHaveTextContent(/You are here/i);
    expect(screen.getByTestId("person-popup")).toHaveTextContent(/You are here/i);
  });
});