import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import CampsiteMarker from "./CampsiteMarker";
import { getWeatherForecast } from "../../api/Weather";

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
    requires_4wd: true,
    last_updated: "2025-01-01T00:00:00Z",
  };

  const fakeForecast = [
    { number: 1, name: "Today", isDaytime: true,
      temperature: 70, temperatureUnit: "F",
      shortForecast: "Sunny",
      detailedForecast: "Sunny",
      windSpeed: "5 mph", windDirection: "NW" },
  ];

  it("renders site info and loads weather", async () => {
    (getWeatherForecast as any).mockResolvedValue(fakeForecast);

    const { container } = render(<CampsiteMarker site={site} />);

    expect(screen.getByText("Test Site")).toBeInTheDocument();
    expect(screen.getByText("A lovely place")).toBeInTheDocument();
    expect(screen.getByText("Requires 4WD:")).toBeInTheDocument();
    expect(screen.getByText("Yes")).toBeInTheDocument();

    expect(screen.getByText("Loading weather...")).toBeInTheDocument();
    await waitFor(() => {
      // Find all .weather-temp spans and check their text content for temperature and unit
      const tempSpans = container.querySelectorAll(".weather-temp");
      expect(
        Array.from(tempSpans).some((span) => {
          const text = span.textContent?.replace(/\s/g, "");
          return text && text.includes("Temp:70°F");
        })
      ).toBe(true);
    });
    await waitFor(() => {
      // Find all .weather-short spans and check their text content for forecast
      const shortSpans = container.querySelectorAll(".weather-short");
      expect(
        Array.from(shortSpans).some((span) => {
          const text = span.textContent;
          return text && text.includes("Forecast:") && text.includes("Sunny");
        })
      ).toBe(true);
    });

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
      />
    );
    expect(screen.getByText("Invalid coordinates")).toBeInTheDocument();
  });
});
