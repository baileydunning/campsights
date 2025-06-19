import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, fireEvent, screen, waitFor } from "@testing-library/react";
import CampsiteForm from "./CampsiteForm";

const mockOnSuccess = vi.fn();

describe("CampsiteForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all form fields", () => {
    render(<CampsiteForm onSuccess={mockOnSuccess} />);
    expect(screen.getByLabelText(/Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    expect(screen.getByText(/Campsite Rating/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Requires 4WD to Access/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Use current location/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Submit My Campsite/i })).toBeInTheDocument();
  });

  it("toggles latitude/longitude fields when 'Use current location' is unchecked", () => {
    render(<CampsiteForm onSuccess={mockOnSuccess} />);
    const checkbox = screen.getByLabelText(/Use current location/i);
    fireEvent.click(checkbox);
    expect(screen.getByLabelText(/Latitude/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Longitude/i)).toBeInTheDocument();
  });

  it("updates name and description fields", () => {
    render(<CampsiteForm onSuccess={mockOnSuccess} />);
    const nameInput = screen.getByLabelText(/Name/i);
    const descInput = screen.getByLabelText(/Description/i);

    fireEvent.change(nameInput, { target: { value: "Test Site" } });
    fireEvent.change(descInput, { target: { value: "Nice place" } });

    expect(nameInput).toHaveValue("Test Site");
    expect(descInput).toHaveValue("Nice place");
  });

  it("sets rating when a star is clicked", () => {
    render(<CampsiteForm onSuccess={mockOnSuccess} />);
    const stars = screen.getAllByRole("button", { name: /Rate/ });
    fireEvent.click(stars[2]);
    expect(stars[0].className).toContain("filled");
    expect(stars[1].className).toContain("filled");
    expect(stars[2].className).toContain("filled");
  });

  it("submits with current location (geolocation)", async () => {
    const mockGeolocation = {
      getCurrentPosition: vi.fn((success) =>
        success({
          coords: { latitude: 12.34, longitude: 56.78 },
        })
      ),
    };
    // @ts-ignore
    global.navigator.geolocation = mockGeolocation;

    window.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
    ) as any;

    render(<CampsiteForm onSuccess={mockOnSuccess} />);
    fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: "Geo Site" } });
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: "A nice place" } });
    const stars = screen.getAllByRole("button", { name: /Rate/ });
    fireEvent.click(stars[2]);
    fireEvent.click(screen.getByRole("button", { name: /Submit My Campsite/i }));

    await waitFor(() => {
      expect(window.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/v1/campsites"),
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        })
      );
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it("shows alert if geolocation is not supported", async () => {
    // @ts-ignore
    global.navigator.geolocation = undefined;
    window.alert = vi.fn();

    render(<CampsiteForm onSuccess={mockOnSuccess} />);
    fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: "Geo Site" } });
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: "A nice place" } });
    const stars = screen.getAllByRole("button", { name: /Rate/ });
    fireEvent.click(stars[2]);
    fireEvent.click(screen.getByRole("button", { name: /Submit My Campsite/i }));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Geolocation not supported.");
    });
  });

  it("shows alert if lat/lng not provided when not using current location", async () => {
    window.alert = vi.fn();
    render(<CampsiteForm onSuccess={mockOnSuccess} />);
    fireEvent.click(screen.getByLabelText(/Use current location/i)); // uncheck
    fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: "Manual Site" } });
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: "A nice place" } });
    const stars = screen.getAllByRole("button", { name: /Rate/ });
    fireEvent.click(stars[2]);
    fireEvent.click(screen.getByRole("button", { name: /Submit My Campsite/i }));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Please provide valid latitude and longitude.");
    });
  });

  it("submits with manual lat/lng", async () => {
    window.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
    ) as any;

    render(<CampsiteForm onSuccess={mockOnSuccess} />);
    // Uncheck "Use current location" if it's checked by default
    const useCurrentLocation = screen.getByLabelText(/Use current location/i);
    if (useCurrentLocation.checked) {
      fireEvent.click(useCurrentLocation);
    }
    fireEvent.change(screen.getByLabelText(/Latitude/i), { target: { value: "10.1" } });
    fireEvent.change(screen.getByLabelText(/Longitude/i), { target: { value: "20.2" } });
    fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: "Manual Site" } });
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: "A nice place" } });
    const stars = screen.getAllByRole("button", { name: /Rate/ });
    fireEvent.click(stars[2]);
    fireEvent.click(screen.getByRole("button", { name: /Submit My Campsite/i }));

    await waitFor(() => {
      expect(window.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/v1/campsites"),
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        })
      );
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });
});