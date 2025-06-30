import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, fireEvent, screen, waitFor } from "@testing-library/react";
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import AddCampsiteForm from "./AddCampsiteForm";
import campsiteSlice from "../../store/campsiteSlice";

vi.mock("../../api/Campsites", () => ({
  addCampsite: vi.fn(),
}));

const mockOnSuccess = vi.fn();

const createTestStore = (preloadedState = {}) => {
  return configureStore({
    reducer: {
      campsites: campsiteSlice,
    },
    preloadedState: {
      campsites: {
        campsites: [],
        loading: false,
        error: null,
        ...preloadedState,
      },
    },
  });
};

const renderWithProvider = (component: React.ReactElement, store = createTestStore()) => {
  return render(
    <Provider store={store}>
      {component}
    </Provider>
  );
};

describe("AddCampsiteForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
  });

  it("renders all form fields", () => {
    renderWithProvider(<AddCampsiteForm onSuccess={mockOnSuccess} />);
    expect(screen.getByLabelText(/Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Requires 4WD to Access/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Use current location/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Submit My Campsite/i })).toBeInTheDocument();
  });

  it("toggles latitude/longitude fields when 'Use current location' is unchecked", () => {
    renderWithProvider(<AddCampsiteForm onSuccess={mockOnSuccess} />);
    const checkbox = screen.getByLabelText(/Use current location/i);
    fireEvent.click(checkbox);
    expect(screen.getByLabelText(/Latitude/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Longitude/i)).toBeInTheDocument();
  });

  it("updates name and description fields", () => {
    renderWithProvider(<AddCampsiteForm onSuccess={mockOnSuccess} />);
    const nameInput = screen.getByLabelText(/Name/i);
    const descInput = screen.getByLabelText(/Description/i);

    fireEvent.change(nameInput, { target: { value: "Test Site" } });
    fireEvent.change(descInput, { target: { value: "Nice place" } });

    expect(nameInput).toHaveValue("Test Site");
    expect(descInput).toHaveValue("Nice place");
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

    const { addCampsite } = await import("../../api/Campsites");
    (addCampsite as any).mockResolvedValue({
      id: "test-id",
      name: "Geo Site",
      description: "A nice place",
      lat: 12.34,
      lng: 56.78,
      requires_4wd: false,
    });

    renderWithProvider(<AddCampsiteForm onSuccess={mockOnSuccess} />);
    fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: "Geo Site" } });
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: "A nice place" } });
    fireEvent.click(screen.getByRole("button", { name: /Submit My Campsite/i }));

    await waitFor(() => {
      expect(addCampsite).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.any(String),
          name: "Geo Site",
          description: "A nice place",
          lat: 12.34,
          lng: 56.78,
          requires_4wd: false,
        })
      );
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it("shows alert if geolocation is not supported", async () => {
    // @ts-ignore
    global.navigator.geolocation = undefined;
    window.alert = vi.fn();

    renderWithProvider(<AddCampsiteForm onSuccess={mockOnSuccess} />);
    fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: "Geo Site" } });
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: "A nice place" } });
    fireEvent.click(screen.getByRole("button", { name: /Submit My Campsite/i }));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Geolocation not supported.");
    });
  });

  it("shows alert if lat/lng not provided when not using current location", async () => {
    window.alert = vi.fn();
    renderWithProvider(<AddCampsiteForm onSuccess={mockOnSuccess} />);
    fireEvent.click(screen.getByLabelText(/Use current location/i)); // uncheck
    fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: "Manual Site" } });
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: "A nice place" } });
    fireEvent.click(screen.getByRole("button", { name: /Submit My Campsite/i }));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Please provide valid latitude and longitude.");
    });
  });

  it("submits with manual lat/lng", async () => {
    const { addCampsite } = await import("../../api/Campsites");
    (addCampsite as any).mockResolvedValue({
      id: "test-id",
      name: "Manual Site",
      description: "A nice place",
      lat: 10.1,
      lng: 20.2,
      requires_4wd: false,
    });

    renderWithProvider(<AddCampsiteForm onSuccess={mockOnSuccess} />);
    // Uncheck "Use current location" if it's checked by default
    const useCurrentLocation = screen.getByLabelText(/Use current location/i);
    if (useCurrentLocation.checked) {
      fireEvent.click(useCurrentLocation);
    }
    fireEvent.change(screen.getByLabelText(/Latitude/i), { target: { value: "10.1" } });
    fireEvent.change(screen.getByLabelText(/Longitude/i), { target: { value: "20.2" } });
    fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: "Manual Site" } });
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: "A nice place" } });
    fireEvent.click(screen.getByRole("button", { name: /Submit My Campsite/i }));

    await waitFor(() => {
      expect(addCampsite).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.any(String),
          name: "Manual Site",
          description: "A nice place",
          lat: 10.1,
          lng: 20.2,
          requires_4wd: false,
        })
      );
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it("shows loading state when submitting", async () => {
    const { addCampsite } = await import("../../api/Campsites");
    (addCampsite as any).mockImplementation(() => new Promise(() => {})); // Never resolves

    renderWithProvider(<AddCampsiteForm onSuccess={mockOnSuccess} />);
    
    const useCurrentLocation = screen.getByLabelText(/Use current location/i);
    if (useCurrentLocation.checked) {
      fireEvent.click(useCurrentLocation);
    }
    
    fireEvent.change(screen.getByLabelText(/Latitude/i), { target: { value: "10.1" } });
    fireEvent.change(screen.getByLabelText(/Longitude/i), { target: { value: "20.2" } });
    fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: "Test Site" } });
    fireEvent.click(screen.getByRole("button", { name: /Submit My Campsite/i }));

    // Should show loading state
    expect(screen.getByText("Submitting...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Submitting/i })).toBeDisabled();
  });

  it("handles API errors gracefully", async () => {
    const { addCampsite } = await import("../../api/Campsites");
    (addCampsite as any).mockRejectedValue(new Error("API Error"));
    
    window.alert = vi.fn();
    console.error = vi.fn(); // Mock console.error to avoid noise

    renderWithProvider(<AddCampsiteForm onSuccess={mockOnSuccess} />);
    
    const useCurrentLocation = screen.getByLabelText(/Use current location/i);
    if (useCurrentLocation.checked) {
      fireEvent.click(useCurrentLocation);
    }
    
    fireEvent.change(screen.getByLabelText(/Latitude/i), { target: { value: "10.1" } });
    fireEvent.change(screen.getByLabelText(/Longitude/i), { target: { value: "20.2" } });
    fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: "Test Site" } });
    fireEvent.click(screen.getByRole("button", { name: /Submit My Campsite/i }));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Failed to submit campsite. Please try again.");
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });
  });
});