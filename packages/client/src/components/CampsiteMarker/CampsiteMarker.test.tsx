import React from "react";
import { render, waitFor, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { act } from 'react';
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

// Mock editCampsite
vi.mock("../../api/Campsites", () => ({
  editCampsite: vi.fn(),
}));
import { getWeatherForecast } from "../../api/Weather";
import { editCampsite } from "../../api/Campsites";

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

  it("renders marker and popup with campsite info", async () => {
    (getWeatherForecast as any).mockResolvedValue([]);
    await act(async () => {
      render(
        <CampsiteMarker site={mockCampsite} renderStars={renderStars} />
      );
    });
    expect(screen.getByTestId("marker")).toBeInTheDocument();
    expect(screen.getByTestId("popup")).toBeInTheDocument();
    expect(screen.getByText("Test Site")).toBeInTheDocument();
    expect(screen.getByText("A beautiful place")).toBeInTheDocument();
    expect(screen.getByText("Requires 4WD:")).toBeInTheDocument();
    expect(screen.getByText("Yes")).toBeInTheDocument();
    expect(screen.getByTestId("stars")).toHaveTextContent("★★★★");
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

  it("allows editing and saving a campsite", async () => {
    (editCampsite as any).mockResolvedValue({});

    render(<CampsiteMarker site={mockCampsite} renderStars={renderStars} />);

    // Open edit mode
    fireEvent.click(screen.getByRole("button", { name: /edit campsite/i }));

    // Wait for the name input to appear and check its initial value
    const nameInput = await screen.findByPlaceholderText(/name/i) as HTMLInputElement;
    expect(nameInput.value).toBe("Test Site");

    // Change the name
    fireEvent.change(nameInput, { target: { value: "Updated Site" } });

    // Submit the form
    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    // editCampsite should be called with the updated name
    await waitFor(() =>
      expect(editCampsite).toHaveBeenCalledWith(
        "1",
        expect.objectContaining({ name: "Updated Site" })
      )
    );

    // And we should see the success message
    await screen.findByText(/campsite updated/i);
  });

  it("resets form and exits edit mode on cancel", async () => {
    render(<CampsiteMarker site={mockCampsite} renderStars={renderStars} />);

    // Open edit mode
    fireEvent.click(screen.getByRole("button", { name: /edit campsite/i }));

    // Wait for the name input and change it
    const nameInput = await screen.findByPlaceholderText(/name/i);
    fireEvent.change(nameInput, { target: { value: "Changed Name" } });

    // Click cancel
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

    // Back in view mode: edit button should be visible and the form gone
    await screen.findByRole("button", { name: /edit campsite/i });
    expect(screen.queryByPlaceholderText(/name/i)).toBeNull();
    expect(screen.getByText("Test Site")).toBeInTheDocument();

    // Re-open edit mode and confirm the field has been reset
    fireEvent.click(screen.getByRole("button", { name: /edit campsite/i }));
    const resetInput = await screen.findByDisplayValue("Test Site");
    expect(resetInput).toBeInTheDocument();
  });
});
