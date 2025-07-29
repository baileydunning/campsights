import { render, screen } from "@testing-library/react";
import { Suspense } from "react";
import { vi } from "vitest";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import App from "./App";
import campsiteSlice from "./store/campsiteSlice";

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
  render(<Provider store={store}><Suspense fallback={null}>{ui}</Suspense></Provider>);

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
});