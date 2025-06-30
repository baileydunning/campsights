import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import App from "./App";

vi.mock("./components/MapView/MapView", () => ({
  default: () => <div data-testid="map-view" />,
}));
vi.mock("./components/AddCampsiteForm/AddCampsiteForm", () => ({
  default: ({ onSuccess }: { onSuccess: () => void }) => (
    <button onClick={onSuccess} data-testid="campsite-form-success">
      Submit Campsite
    </button>
  ),
}));

describe("App", () => {
  it("renders the header", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: /Campsights/i })).toBeInTheDocument();
  });

  it("renders MapView", () => {
    render(<App />);
    expect(screen.getByTestId("map-view")).toBeInTheDocument();
  });

  it("shows modal when plus button is clicked", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /Add Campsite/i }));
    expect(screen.getByTestId("campsite-form-success")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Close/i })).toBeInTheDocument();
  });

  it("closes modal when close button is clicked", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /Add Campsite/i }));
    fireEvent.click(screen.getByRole("button", { name: /Close/i }));
    expect(screen.queryByTestId("campsite-form-success")).not.toBeInTheDocument();
  });

  it("closes modal when overlay is clicked", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /Add Campsite/i }));
    fireEvent.click(screen.getByText("+").parentElement!.parentElement!.querySelector(".modal-overlay")!);
    expect(screen.queryByTestId("campsite-form-success")).not.toBeInTheDocument();
  });

  it("calls handleSuccess and closes modal when AddCampsiteForm onSuccess is triggered", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /Add Campsite/i }));
    fireEvent.click(screen.getByTestId("campsite-form-success"));
    expect(screen.queryByTestId("campsite-form-success")).not.toBeInTheDocument();
  });
});