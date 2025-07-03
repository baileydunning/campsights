import { render, screen, fireEvent } from "@testing-library/react";
import { Suspense } from "react";
import { vi } from "vitest";
import App from "./App";

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

describe("App", () => {
  it("renders the header", async () => {
    render(<Suspense fallback={null}><App /></Suspense>);
    expect(await screen.findByRole("heading", { name: /Campsights/i })).toBeInTheDocument();
  });

  it("renders MapView", async () => {
    render(<Suspense fallback={null}><App /></Suspense>);
    expect(await screen.findByTestId("map-view")).toBeInTheDocument();
  });

  it("shows modal when plus button is clicked", async () => {
    render(<Suspense fallback={null}><App /></Suspense>);
    fireEvent.click(await screen.findByRole("button", { name: /Add Campsite/i }));
    expect(await screen.findByTestId("campsite-form-success")).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: /Close/i })).toBeInTheDocument();
  });

  it("closes modal when close button is clicked", async () => {
    render(<Suspense fallback={null}><App /></Suspense>);
    fireEvent.click(await screen.findByRole("button", { name: /Add Campsite/i }));
    fireEvent.click(await screen.findByRole("button", { name: /Close/i }));
    expect(screen.queryByTestId("campsite-form-success")).not.toBeInTheDocument();
  });

  it("closes modal when overlay is clicked", async () => {
    render(<Suspense fallback={null}><App /></Suspense>);
    fireEvent.click(await screen.findByRole("button", { name: /Add Campsite/i }));
    const overlay = document.querySelector(".modal-overlay")!;
    fireEvent.click(overlay);
    expect(screen.queryByTestId("campsite-form-success")).not.toBeInTheDocument();
  });

  it("calls handleSuccess and closes modal when AddCampsiteForm onSuccess is triggered", async () => {
    render(<Suspense fallback={null}><App /></Suspense>);
    fireEvent.click(await screen.findByRole("button", { name: /Add Campsite/i }));
    fireEvent.click(await screen.findByTestId("campsite-form-success"));
    expect(screen.queryByTestId("campsite-form-success")).not.toBeInTheDocument();
  });
});