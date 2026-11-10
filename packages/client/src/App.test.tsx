import { render, screen } from "@testing-library/react";
import { Suspense } from "react";
import { vi } from "vitest";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { MemoryRouter } from "react-router";
import App from "./App";
import campsiteSlice from "./store/campsiteSlice";

vi.mock("./components/CampsitePage/CampsitePage", async () => {
  const { useParams } = await import("react-router");
  return { __esModule: true, default: () => <div data-testid="campsite-page">{useParams().id}</div> };
});

vi.mock("./components/MapView/MapView", () => ({
  __esModule: true,
  default: () => <div data-testid="map-view" />,
}));

const createTestStore = (preloadedState = {}) =>
  configureStore({
    reducer: { campsites: campsiteSlice },
    preloadedState: { campsites: { campsites: [], loading: false, error: null, ...preloadedState } },
  });

const renderWithProvider = (ui: React.ReactElement, store = createTestStore()) =>
  render(<Provider store={store}><MemoryRouter><Suspense fallback={null}>{ui}</Suspense></MemoryRouter></Provider>);

describe("App", () => {
  it("renders the header", async () => {
    renderWithProvider(<App />);
    expect(await screen.findByRole("heading", { name: /Campsights/i })).toBeInTheDocument();
  });

  it("renders MapView", async () => {
    renderWithProvider(<App />);
    expect(await screen.findByTestId("map-view")).toBeInTheDocument();
  });

  it("has main content structure", async () => {
    renderWithProvider(<App />);
    const mainContent = document.querySelector('.main-content');
    expect(mainContent).toBeInTheDocument();
  });

  it("renders the campsite page at /campsites/:id instead of the map", async () => {
    render(
      <Provider store={createTestStore()}>
        <MemoryRouter initialEntries={["/campsites/abc"]}>
          <Suspense fallback={null}><App /></Suspense>
        </MemoryRouter>
      </Provider>
    );
    expect(await screen.findByTestId("campsite-page")).toHaveTextContent("abc");
    expect(screen.queryByTestId("map-view")).not.toBeInTheDocument();
  });
});
