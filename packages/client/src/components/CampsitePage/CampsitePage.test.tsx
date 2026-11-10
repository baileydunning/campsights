import { render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import campsiteSlice from "../../store/campsiteSlice";
import { MemoryRouter, Route, Routes } from "react-router";
import CampsitePage from "./CampsitePage";
import * as api from "../../api/Campsites";

vi.mock("./SiteMap", () => ({ __esModule: true, default: () => <div data-testid="site-map" /> }));

const site = {
  id: "abc",
  name: "Desert Wash",
  url: "https://www.blm.gov/visit/desert-wash",
  lat: 38.5,
  lng: -109.5,
  state: "Utah",
  mapLink: "",
  description: "Quiet spot on the mesa.",
  directions: "Drive north on the county road.",
  activities: ["CAMPING", "HIKING"],
  stayLimit: "14 days.",
  images: [{ src: "https://example.com/a.jpg", alt: "The wash at sunset", credit: "BLM" }],
  source: "BLM" as const,
};

const renderPage = () => {
  const store = configureStore({
    reducer: { campsites: campsiteSlice },
    preloadedState: { campsites: { campsites: [site], loading: false, error: null } },
  });
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={["/campsites/abc"]}>
        <Routes>
          <Route path="/campsites/:id" element={<CampsitePage />} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
};

describe("CampsitePage", () => {
  afterEach(() => vi.restoreAllMocks());

  it("shows the campsite right away and fills in weather and location details", async () => {
    vi.spyOn(api, "getCampsiteById").mockResolvedValue({
      ...site,
      elevation: 1500,
      nearestTown: { city: "Moab", state: "UT", distanceMiles: 12.3, direction: "NE" },
      timeZone: "America/Denver",
      alerts: [{ event: "Red Flag Warning", severity: "Severe", description: "Critical fire weather." }],
      weather: [
        { number: 1, name: "Today", isDaytime: true, temperature: 64, temperatureUnit: "F", windSpeed: "5 mph", windDirection: "W", shortForecast: "Sunny", detailedForecast: "Sunny, with a high near 64.", startTime: "", endTime: "" },
      ],
    });

    renderPage();
    expect(screen.getByRole("heading", { level: 1, name: "Desert Wash" })).toBeInTheDocument();
    expect(screen.getByText("Hiking")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /get directions/i })).toHaveAttribute("href", expect.stringContaining("38.5,-109.5"));
    expect(screen.getByRole("img", { name: "The wash at sunset" })).toBeInTheDocument();

    await waitFor(() => expect(screen.getByText(/12.3 mi NE of Moab, UT/)).toBeInTheDocument());
    expect(screen.getByText("4,921 ft")).toBeInTheDocument();
    expect(screen.getByText("Red Flag Warning")).toBeInTheDocument();
    expect(screen.getByText("Sunny, with a high near 64.")).toBeInTheDocument();
    expect(screen.getByText("14 days")).toBeInTheDocument();
  });

  it("shows a not found message for an unknown campsite", async () => {
    vi.spyOn(api, "getCampsiteById").mockResolvedValue(null);
    const store = configureStore({
      reducer: { campsites: campsiteSlice },
      preloadedState: { campsites: { campsites: [], loading: false, error: null } },
    });
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={["/campsites/missing"]}>
          <Routes>
            <Route path="/campsites/:id" element={<CampsitePage />} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );
    expect(await screen.findByText("Campsite not found")).toBeInTheDocument();
  });
});
