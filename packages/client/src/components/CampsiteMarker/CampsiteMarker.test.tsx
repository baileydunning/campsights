import React from "react";
import { render, waitFor, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import CampsiteMarker from "./CampsiteMarker";
import { Campsite } from "../../types/Campsite";

// Mock react-leaflet Marker and Popup for isolation
vi.mock("react-leaflet", () => ({
  Marker: (props: any) => React.createElement("div", { "data-testid": "marker" }, props.children),
  Popup: (props: any) => React.createElement("div", { "data-testid": "popup" }, props.children),
}));

// Mock getWeatherForecast
vi.mock("../../api/Weather", () => ({
  getWeatherForecast: vi.fn(),
}));

import { getWeatherForecast } from "../../api/Weather";

describe("CampsiteMarker", () => {
  const mockCampsite: Campsite = {
    id: "1",
    name: "Test Site",
    description: "A beautiful place",
    lat: 40,
    lng: -105,
    rating: 4,
    requires_4wd: true,
    last_updated: "2025-06-27T00:00:00Z",
  };

  const renderStars = (rating: number | null) =>
    rating ? <span data-testid="stars">{"★".repeat(rating)}</span> : null;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders marker and popup with campsite info", () => {
    (getWeatherForecast as any).mockResolvedValue([]);
    const { getByTestId, getByText } = render(
      <CampsiteMarker site={mockCampsite} renderStars={renderStars} />
    );
    expect(getByTestId("marker")).toBeInTheDocument();
    expect(getByTestId("popup")).toBeInTheDocument();
    expect(getByText("Test Site")).toBeInTheDocument();
    expect(getByText("A beautiful place")).toBeInTheDocument();
    expect(getByText("Requires 4WD:")).toBeInTheDocument();
    expect(getByText("Yes")).toBeInTheDocument();
    expect(getByTestId("stars")).toHaveTextContent("★★★★");
  });

  it("shows loading state while fetching weather", async () => {
    let resolveWeather: any;
    (getWeatherForecast as any).mockImplementation(
      () => new Promise((resolve) => { resolveWeather = resolve; })
    );
    render(<CampsiteMarker site={mockCampsite} renderStars={renderStars} />);
    expect(screen.getByText(/loading weather/i)).toBeInTheDocument();
    resolveWeather([]);
    await waitFor(() => expect(screen.queryByText(/loading weather/i)).not.toBeInTheDocument());
  });

  it("shows error if weather fetch fails", async () => {
    (getWeatherForecast as any).mockRejectedValue(new Error("fail"));
    render(<CampsiteMarker site={mockCampsite} renderStars={renderStars} />);
    await waitFor(() => expect(screen.getByText(/error fetching weather/i)).toBeInTheDocument());
  });

  it("renders weather data if available", async () => {
    (getWeatherForecast as any).mockResolvedValue([
      {
        number: 1,
        name: "Tonight",
        isDaytime: false,
        temperature: 55,
        temperatureUnit: "F",
        shortForecast: "Mostly Clear",
        windSpeed: "5 mph",
        windDirection: "N",
        detailedForecast: "Clear and cool."
      },
    ]);
    render(<CampsiteMarker site={mockCampsite} renderStars={renderStars} />);
    await waitFor(() => expect(screen.getByText("Tonight (Night)")).toBeInTheDocument());
    expect(screen.getByText(/55°F/)).toBeInTheDocument();
    expect(screen.getByText(/Mostly Clear/)).toBeInTheDocument();
    expect(screen.getByText(/5 mph N/)).toBeInTheDocument();
  });

  it("shows 'Invalid coordinates' if lat/lng are not valid", () => {
    (getWeatherForecast as any).mockResolvedValue([]);
    const badCampsite = { ...mockCampsite, lat: 0, lng: 0 };
    render(<CampsiteMarker site={badCampsite} renderStars={renderStars} />);
    expect(screen.getByText(/invalid coordinates/i)).toBeInTheDocument();
  });
});
