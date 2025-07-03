import React from 'react';
import { render, screen, waitFor, within, act } from "@testing-library/react";
import { vi } from 'vitest';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import MapView from "./MapView";
import campsiteSlice from "../../store/campsiteSlice";

vi.mock("../../api/Campsites", () => ({
  getCampsites: vi.fn(),
}));

import { getCampsites } from "../../api/Campsites";

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
    (getCampsites as any).mockResolvedValue(mockCampsites);
    vi.clearAllMocks();
  });

  it("shows error state when there's an error", async () => {
    (getCampsites as any).mockRejectedValue(new Error("API Error"));
    await act(async () => {
      renderWithProvider(<MapView />);
    });
    await waitFor(() => {
      expect(getCampsites).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
    });
  });

  it("fetches and displays campsite markers", async () => {
    await act(async () => {
      renderWithProvider(<MapView />);
    });
    await waitFor(() => {
      expect(getCampsites).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(screen.getByRole("region")).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getAllByTestId("marker")).toHaveLength(2);
    });
  });

  it("calls fetchCampsites Redux action on mount", async () => {
    await act(async () => {
      renderWithProvider(<MapView />);
    });
    await waitFor(() => {
      expect(getCampsites).toHaveBeenCalledTimes(1);
    });
  });

  it("displays campsites from Redux store after fetch", async () => {
    await act(async () => {
      renderWithProvider(<MapView />);
    });
    await waitFor(() => {
      expect(getCampsites).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(screen.getAllByTestId("marker")).toHaveLength(2);
    });
  });

  it("handles empty campsites array", async () => {
    (getCampsites as any).mockResolvedValue([]);
    await act(async () => {
      renderWithProvider(<MapView />);
    });
    await waitFor(() => {
      expect(getCampsites).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(screen.getByRole("region")).toBeInTheDocument();
    });
    expect(screen.queryByTestId("marker")).not.toBeInTheDocument();
  });

  it("handles API error gracefully", async () => {
    (getCampsites as any).mockRejectedValue(new Error("API Error"));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await act(async () => {
      renderWithProvider(<MapView />);
    });
    await waitFor(() => {
      expect(getCampsites).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
    });
    consoleSpy.mockRestore();
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