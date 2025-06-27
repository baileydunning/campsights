import React from "react";
import { render } from "@testing-library/react";
import { Marker, Popup } from "react-leaflet";
import CampsiteMarker from "./CampsiteMarker";
import { Campsite } from "../../types/Campsite";

// Mock react-leaflet Marker and Popup for isolation
jest.mock("react-leaflet", () => ({
  Marker: ({ children }: any) => <div data-testid="marker">{children}</div>,
  Popup: ({ children }: any) => <div data-testid="popup">{children}</div>,
}));

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

  it("renders marker and popup with campsite info", () => {
    const { getByTestId, getByText } = render(
      <CampsiteMarker site={mockCampsite} renderStars={renderStars} />
    );
    expect(getByTestId("marker")).toBeInTheDocument();
    expect(getByTestId("popup")).toBeInTheDocument();
    expect(getByText("Test Site")).toBeInTheDocument();
    expect(getByText("A beautiful place")).toBeInTheDocument();
    expect(getByText("Requires 4WD:")).toBeInTheDocument();
    expect(getByText("Yes")).toBeInTheDocument();
    expect(getByTestId("stars")).toHaveTextContent("★★★★");
  });
});
