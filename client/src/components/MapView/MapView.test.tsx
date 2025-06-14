import MapView from "./MapView";
import { render, screen, waitFor, within } from "@testing-library/react";
import '@testing-library/jest-dom';

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
    id: 1,
    name: "Test Site",
    description: "A nice place",
    lat: 40,
    lng: -105,
    rating: 3,
    requires_4wd: true,
  },
  {
    id: 2,
    name: "",
    description: "",
    lat: 41,
    lng: -106,
    rating: null,
    requires_4wd: false,
  },
];


beforeEach(() => {
  window.fetch = vi.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve(mockCampsites),
    })
  ) as any;
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
    expect(screen.getAllByTestId("marker").length).toBe(2);
  });

  const markers = screen.getAllByTestId("marker");
  // First marker: Test Site
  const popup1 = within(markers[0]).getByTestId("popup");
  expect(within(popup1).getByText("Test Site")).toBeInTheDocument();
  expect(within(popup1).getByText("A nice place")).toBeInTheDocument();
  expect(within(popup1).getByText("Rating:")).toBeInTheDocument();
  expect(within(popup1).getAllByText("★").length).toBe(3);
  expect(within(popup1).getByText("Requires 4WD:")).toBeInTheDocument();
  expect(within(popup1).getByText("Yes")).toBeInTheDocument();

  // Second marker: Unnamed Site
  const popup2 = within(markers[1]).getByTestId("popup");
  expect(within(popup2).getByText("Unnamed Site")).toBeInTheDocument();
  expect(within(popup2).getByText((content) => content.includes("Rating:"))).toBeInTheDocument();
  expect(within(popup2).getByText("Requires 4WD:")).toBeInTheDocument();
  expect(within(popup2).getByText("No")).toBeInTheDocument();
});

test("refetches when refreshKey changes", async () => {
  render(<MapView refreshKey={0} />);
  await waitFor(() => {
    expect(window.fetch).toHaveBeenCalledTimes(1);
  });
  render(<MapView refreshKey={1} />);
  await waitFor(() => {
    expect(window.fetch).toHaveBeenCalledTimes(2);
  });
});

