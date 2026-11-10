import { render, screen, waitFor, act, fireEvent } from "@testing-library/react";
import { vi } from 'vitest';
import '@testing-library/jest-dom';
import MapView from "./MapView";

vi.mock("react-leaflet", () => {
  const Passthrough = ({ children }: any) => <>{children}</>;
  const LayersControl: any = ({ children }: any) => <div data-testid="layers-control">{children}</div>;
  LayersControl.BaseLayer = ({ name, children }: any) => <div data-testid="base-layer" data-name={name}>{children}</div>;
  LayersControl.Overlay = ({ name, children }: any) => <div data-testid="overlay" data-name={name}>{children}</div>;
  return {
    MapContainer: ({ children }: any) => <div role="region">{children}</div>,
    TileLayer: () => <div data-testid="tile-layer" />,
    Marker: ({ children }: any) => <div data-testid="person-marker">{children}</div>,
    Popup: Passthrough,
    Tooltip: ({ children }: any) => <div data-testid="person-tooltip">{children}</div>,
    LayersControl,
    ScaleControl: () => null,
    ZoomControl: () => null,
    useMap: () => ({ flyToBounds: vi.fn() }),
  };
});

vi.mock("./MarkerClusterGroup", () => ({
  __esModule: true,
  default: ({ children }: any) => <div data-testid="cluster-group">{children}</div>,
}));

vi.mock("./FirePerimeters", () => ({
  __esModule: true,
  default: () => <div data-testid="fire-perimeters" />,
}));

vi.mock("./MapControls", () => ({
  __esModule: true,
  default: ({ onLocate }: any) => (
    <button onClick={() => onLocate([39.5, -106.5])}>Show my location</button>
  ),
}));

vi.mock("../CampsiteMarker/CampsiteMarker", () => ({
  __esModule: true,
  default: ({ site }: any) => <div data-testid="marker">{site.name || "Unnamed Site"}</div>,
}));

const mockCampsites = [
  {
    id: "1",
    name: "Test Site",
    description: "A nice place",
    lat: 40,
    lng: -105,
    url: "https://example.com/1",
    state: "CO",
    mapLink: "https://maps.example.com/1",
    source: "BLM" as const,
  },
  {
    id: "2",
    name: "",
    description: "",
    lat: 41,
    lng: -106,
    url: "https://example.com/2",
    state: "WY",
    mapLink: "https://maps.example.com/2",
    source: "BLM" as const,
  },
];

describe("MapView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders campsite markers inside the cluster group", async () => {
    await act(async () => {
      render(<MapView campsites={mockCampsites} />);
    });
    await waitFor(() => {
      expect(screen.getAllByTestId("marker")).toHaveLength(2);
    });
    expect(screen.getByTestId("cluster-group")).toContainElement(screen.getAllByTestId("marker")[0]);
  });

  it("handles empty campsites array", async () => {
    await act(async () => {
      render(<MapView campsites={[]} />);
    });
    expect(screen.getByRole("region")).toBeInTheDocument();
    expect(screen.queryByTestId("marker")).not.toBeInTheDocument();
  });

  it("offers the base maps and overlays in the layer switcher", async () => {
    await act(async () => {
      render(<MapView campsites={[]} />);
    });
    const baseNames = screen.getAllByTestId("base-layer").map((el) => el.getAttribute("data-name"));
    expect(baseNames).toEqual(["Topo", "OpenTopoMap", "Satellite"]);
    const overlayNames = screen.getAllByTestId("overlay").map((el) => el.getAttribute("data-name"));
    expect(overlayNames).toEqual(["Campsites", "Land ownership", "Wildfire perimeters"]);
    expect(screen.getByTestId("fire-perimeters")).toBeInTheDocument();
  });

  it("shows a you-are-here marker after locating the user", async () => {
    await act(async () => {
      render(<MapView campsites={mockCampsites} />);
    });
    expect(screen.queryByTestId("person-marker")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /show my location/i }));
    await waitFor(() => {
      expect(screen.getByTestId("person-tooltip")).toHaveTextContent(/You are here/i);
    });
  });
});
