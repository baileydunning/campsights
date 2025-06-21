import React from 'react';
import { render, screen, waitFor, within } from "@testing-library/react";
import { vi } from 'vitest';
import '@testing-library/jest-dom';
import MapView from "./MapView";

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

describe("MapView", () => {
  beforeEach(() => {
    (getCampsites as any).mockResolvedValue(mockCampsites);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test("renders map container", () => {
    render(<MapView refreshKey={0} />);
    expect(screen.getByRole("region")).toBeInTheDocument();
  });

  test("fetches and displays campsite markers with correct popup content", async () => {
    render(<MapView refreshKey={0} />);
    
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

  test("calls getCampsites on mount", async () => {
    render(<MapView refreshKey={0} />);
    
    await waitFor(() => {
      expect(getCampsites).toHaveBeenCalledTimes(1);
    });
  });

  test("refetches when refreshKey changes", async () => {
    const { rerender } = render(<MapView refreshKey={0} />);
    
    await waitFor(() => {
      expect(getCampsites).toHaveBeenCalledTimes(1);
    });

    rerender(<MapView refreshKey={1} />);
    
    await waitFor(() => {
      expect(getCampsites).toHaveBeenCalledTimes(2);
    });
  });

  test("handles empty campsites array", async () => {
    (getCampsites as any).mockResolvedValue([]);
    
    render(<MapView refreshKey={0} />);
    
    await waitFor(() => {
      expect(getCampsites).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByRole("region")).toBeInTheDocument();
    expect(screen.queryByTestId("marker")).not.toBeInTheDocument();
  });

  test("renders correct number of stars for rating", async () => {
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
    
    render(<MapView refreshKey={0} />);
    
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
});

