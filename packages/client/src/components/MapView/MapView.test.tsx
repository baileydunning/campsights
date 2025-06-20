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
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ children, position }: any) => (
    <div data-testid="marker" data-position={position}>
      {children}
    </div>
  ),
  Popup: ({ children }: any) => <div data-testid="popup">{children}</div>,
}));

vi.mock("leaflet", () => {
  const icon = vi.fn(() => ({}));
  return {
    __esModule: true,
    default: { icon },
    icon,
  };
});

const mockCampsites = [
  {
    id: "1", 
    name: "Test Site",
    description: "A nice place",
    lat: 40,
    lng: -105,
    rating: 3,
    requires_4wd: true,
  },
  {
    id: "2", 
    name: "",
    description: "",
    lat: 41,
    lng: -106,
    rating: null,
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

  it("shows loading state initially", () => {
    const store = createTestStore({ loading: true });
    renderWithProvider(<MapView />, store);
    expect(screen.getByText("Loading campsites...")).toBeInTheDocument();
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

  it("fetches and displays campsite markers with correct popup content", async () => {
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

    const markers = screen.getAllByTestId("marker");
    
    const popup1 = within(markers[0]).getByTestId("popup");
    expect(within(popup1).getByText("Test Site")).toBeInTheDocument();
    expect(within(popup1).getByText("A nice place")).toBeInTheDocument();
    expect(within(popup1).getByText((content) => content.includes("Rating:"))).toBeInTheDocument();
    expect(within(popup1).getAllByText("★")).toHaveLength(3);
    expect(within(popup1).getByText("Requires 4WD:")).toBeInTheDocument();
    expect(within(popup1).getByText("Yes")).toBeInTheDocument();

    const popup2 = within(markers[1]).getByTestId("popup");
    expect(within(popup2).getByText("Unnamed Site")).toBeInTheDocument();
    expect(within(popup2).getByText((content) => content.includes("Rating:"))).toBeInTheDocument();
    expect(within(popup2).getByText("Requires 4WD:")).toBeInTheDocument();
    expect(within(popup2).getByText("No")).toBeInTheDocument();
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

  it("renders correct number of stars for rating", async () => {
    const campsitesWithDifferentRatings = [
      {
        id: "1",
        name: "Five Star Site",
        description: "Amazing",
        lat: 40,
        lng: -105,
        rating: 5,
        requires_4wd: false,
      },
      {
        id: "2",
        name: "One Star Site",
        description: "Poor",
        lat: 41,
        lng: -106,
        rating: 1,
        requires_4wd: false,
      },
      {
        id: "3",
        name: "No Rating Site",
        description: "Unrated",
        lat: 42,
        lng: -107,
        rating: null,
        requires_4wd: false,
      },
    ];

    (getCampsites as any).mockResolvedValue(campsitesWithDifferentRatings);
    
    await act(async () => {
      renderWithProvider(<MapView />);
    });
    
    await waitFor(() => {
      expect(getCampsites).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(screen.getAllByTestId("marker")).toHaveLength(3);
    });
    
    const markers = screen.getAllByTestId("marker");
    
    const popup1 = within(markers[0]).getByTestId("popup");
    expect(within(popup1).getAllByText("★")).toHaveLength(5);
    
    const popup2 = within(markers[1]).getByTestId("popup");
    expect(within(popup2).getAllByText("★")).toHaveLength(1);
    
    const popup3 = within(markers[2]).getByTestId("popup");
    expect(within(popup3).queryByText("★")).not.toBeInTheDocument();
  });

  it("component fetches data and shows markers", async () => {
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
});