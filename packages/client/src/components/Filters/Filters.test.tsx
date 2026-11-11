import React, { useState } from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import Filters from "./Filters";
import { EMPTY_FILTERS, type Filters as FilterValues } from "../../filters";
import type { Campsite } from "../../types/Campsite";

const campsites: Campsite[] = [
  { id: "1", name: "A", url: "", lat: 38.5, lng: -109.5, state: "Utah", mapLink: "", source: "BLM", elevation: 1500, stayLimit: "14 days" },
  { id: "2", name: "B", url: "", lat: 39, lng: -108.5, state: "Colorado", mapLink: "", source: "BLM", stayLimit: "7 days" },
];

const Harness: React.FC<{ onChange?: (f: FilterValues) => void; data?: Campsite[] }> = ({ onChange, data = campsites }) => {
  const [filters, setFilters] = useState<FilterValues>(EMPTY_FILTERS);
  return (
    <Filters
      campsites={data}
      filters={filters}
      onChange={(f) => {
        setFilters(f);
        onChange?.(f);
      }}
      onDone={() => {}}
    />
  );
};

afterEach(() => vi.restoreAllMocks());

describe("Filters", () => {
  it("lists states with counts", () => {
    render(<Harness />);
    expect(screen.getByRole("option", { name: "Colorado (1)" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Utah (1)" })).toBeInTheDocument();
  });

  it("toggles activity chips", () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    const chip = screen.getByRole("button", { name: "Fishing" });
    fireEvent.click(chip);
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ activities: ["fishing"] }));
    expect(chip).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(chip);
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ activities: [] }));
  });

  it("reads elevation in feet", () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Minimum elevation in feet"), { target: { value: "6,000" } });
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ minElevationFt: 6000 }));
  });

  it("disables elevation when no campsite has it", () => {
    render(<Harness data={campsites.map((c) => ({ ...c, elevation: undefined }))} />);
    expect(screen.getByLabelText("Minimum elevation in feet")).toBeDisabled();
    expect(screen.getByText("Elevation data isn't available yet.")).toBeInTheDocument();
  });

  it("shows how many campsites list each stay limit", () => {
    render(<Harness />);
    expect(screen.getByRole("option", { name: "7 days or more (2)" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "14 days or more (1)" })).toBeInTheDocument();
  });

  it("looks up a place and sets it as the origin with a default radius", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify([{ lat: "38.57", lon: "-109.55", name: "Moab", display_name: "Moab, Grand County, Utah", address: { state: "Utah" } }]))
    );
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Town or place"), { target: { value: "Moab" } });
    fireEvent.click(screen.getByRole("button", { name: "Go" }));
    expect(await screen.findByText("Moab, Utah")).toBeInTheDocument();
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ origin: { lat: 38.57, lng: -109.55, label: "Moab, Utah" }, radiusMiles: 50 })
    );

    fireEvent.change(screen.getByLabelText("Distance"), { target: { value: "100" } });
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ radiusMiles: 100 }));

    fireEvent.click(screen.getByRole("button", { name: "Remove location" }));
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ origin: null, radiusMiles: null }));
  });

  it("says so when a place can't be found", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("[]"));
    render(<Harness />);
    fireEvent.change(screen.getByLabelText("Town or place"), { target: { value: "Nowhere" } });
    fireEvent.click(screen.getByRole("button", { name: "Go" }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent('Couldn\'t find "Nowhere"'));
  });

  it("clears all filters", () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Hiking" }));
    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(onChange).toHaveBeenLastCalledWith(EMPTY_FILTERS);
  });
});
