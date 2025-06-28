import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

import CampsiteMarker from "./CampsiteMarker";
import { getWeatherForecast } from "../../api/Weather";
import { putCampsite } from "../../store/campsiteSlice";

// --- mocks ---
vi.mock("react-leaflet", () => {
  const React = require("react");
  return {
    Marker: ({ children }: any) =>
      React.createElement("div", { "data-testid": "marker" }, children),
    Popup: ({ children }: any) =>
      React.createElement("div", { "data-testid": "popup" }, children),
  };
});

vi.mock("../../api/Weather", () => ({
  getWeatherForecast: vi.fn(),
}));

const mockDispatch = vi.fn();
vi.mock("../../store/store", () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: (fn: any) => fn({ campsites: { status: "idle", error: null } }),
}));

beforeEach(() => {
  mockDispatch.mockClear();
  (getWeatherForecast as any).mockClear();
});

describe("CampsiteMarker", () => {
  const site = {
    id: "1",
    name: "Test Site",
    description: "A lovely place",
    lat: 10,
    lng: 20,
    rating: 5,
    requires_4wd: true,
    last_updated: "2025-01-01T00:00:00Z",
  };
  const renderStars = (n: number|null) => <span data-testid="stars">{n}</span>;
  const fakeForecast = [
    { number: 1, name: "Today", isDaytime: true,
      temperature: 70, temperatureUnit: "F",
      shortForecast: "Sunny",
      windSpeed: "5 mph", windDirection: "NW" },
  ];

  it("renders site info and loads weather", async () => {
    (getWeatherForecast as any).mockResolvedValue(fakeForecast);

    render(<CampsiteMarker site={site} renderStars={renderStars} />);

    // basic info
    expect(screen.getByText("Test Site")).toBeInTheDocument();
    expect(screen.getByText("A lovely place")).toBeInTheDocument();
    expect(screen.getByTestId("stars")).toHaveTextContent("5");
    expect(screen.getByText("Requires 4WD:")).toBeInTheDocument();
    expect(screen.getByText("Yes")).toBeInTheDocument();

    // weather loading → forecast
    expect(screen.getByText("Loading weather...")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByText("Temperature: 70°F")).toBeInTheDocument()
    );
    expect(screen.getByText(/Forecast: Sunny/)).toBeInTheDocument();

    // “Get Directions” is an <a role="button">
    const dirButton = screen.getByRole("button", { name: /Get Directions/ });
    expect(dirButton).toHaveAttribute(
      "href",
      expect.stringContaining("destination=10,20")
    );
  });

  it("shows invalid coordinate error", () => {
    render(
      <CampsiteMarker
        site={{ ...site, lat: 0, lng: 0 }}
        renderStars={renderStars}
      />
    );
    expect(screen.getByText("Invalid coordinates")).toBeInTheDocument();
  });

  it("toggles edit form and dispatches update", async () => {
    (getWeatherForecast as any).mockResolvedValue(fakeForecast);

    // simulate a successful thunk result
    mockDispatch.mockResolvedValue({ type: putCampsite.fulfilled.type });

    render(<CampsiteMarker site={site} renderStars={renderStars} />);

    // open edit form
    await userEvent.click(
      screen.getByRole("button", { name: /Edit Campsite/ })
    );
    const nameInput = screen.getByPlaceholderText("Name");
    expect(nameInput).toHaveValue("Test Site");

    // change name and submit
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, "New Name");
    await userEvent.click(screen.getByRole("button", { name: /Save/ }));

    // dispatch should be called exactly once with a thunk function
    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledTimes(1);
      const firstArg = mockDispatch.mock.calls[0][0];
      expect(typeof firstArg).toBe("function");
    });

    // success banner
    expect(screen.getByText("Campsite updated!")).toBeInTheDocument();
  });
});
