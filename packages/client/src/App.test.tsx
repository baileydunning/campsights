import { render, screen, fireEvent } from "@testing-library/react";
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

vi.mock("./components/AddCampsiteForm/AddCampsiteForm", () => ({
  __esModule: true,
  default: ({ onSuccess }: { onSuccess: () => void }) => (
    <button onClick={onSuccess} data-testid="campsite-form-success">
      Submit Campsite
    </button>
  ),
}));

const createTestStore = (preloadedState = {}) =>
  configureStore({
    reducer: { campsites: campsiteSlice },
    preloadedState: { campsites: { campsites: [], loading: false, error: null, ...preloadedState } },
  });

const renderWithProvider = (ui, store = createTestStore()) =>
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

  it("shows modal when plus button is clicked", async () => {
    renderWithProvider(<App />);
    fireEvent.click(await screen.findByRole("button", { name: /Add Campsite/i }));
    expect(await screen.findByTestId("campsite-form-success")).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: /Close/i })).toBeInTheDocument();
  });

  it("closes modal when close button is clicked", async () => {
    renderWithProvider(<App />);
    fireEvent.click(await screen.findByRole("button", { name: /Add Campsite/i }));
    fireEvent.click(await screen.findByRole("button", { name: /Close/i }));
    expect(screen.queryByTestId("campsite-form-success")).not.toBeInTheDocument();
  });

  it("closes modal when overlay is clicked", async () => {
    renderWithProvider(<App />);
    fireEvent.click(await screen.findByRole("button", { name: /Add Campsite/i }));
    const overlay = document.querySelector(".modal-overlay")!;
    fireEvent.click(overlay);
    expect(screen.queryByTestId("campsite-form-success")).not.toBeInTheDocument();
  });

  it("calls handleSuccess and closes modal when AddCampsiteForm onSuccess is triggered", async () => {
    renderWithProvider(<App />);
    fireEvent.click(await screen.findByRole("button", { name: /Add Campsite/i }));
    fireEvent.click(await screen.findByTestId("campsite-form-success"));
    expect(screen.queryByTestId("campsite-form-success")).not.toBeInTheDocument();
  });
});