import { describe, it, expect } from "vitest";
import type { Campsite } from "./types/Campsite";
import {
  EMPTY_FILTERS,
  activeFilterCount,
  applyFilters,
  bearing,
  distanceMiles,
  parseStayDays,
  stateOptions,
} from "./filters";

const site = (over: Partial<Campsite>): Campsite => ({
  id: over.id ?? "x",
  name: "Site",
  url: "https://example.com",
  lat: 38.57,
  lng: -109.55,
  state: "Utah",
  mapLink: "",
  source: "BLM",
  ...over,
});

// Moab, UT is about 38.57, -109.55. Grand Junction, CO is about 64 miles away and Leadville about 181.
const moab = site({ id: "moab", activities: ["HIKING", "MOUNTAIN BIKING"], elevation: 1250, stayLimit: "14 days" });
const gj = site({ id: "gj", lat: 39.06, lng: -108.55, state: "Colorado", activities: ["FISHING", "HIKING"], elevation: 1400, stayLimit: "7 Days" });
const leadville = site({ id: "leadville", lat: 39.25, lng: -106.29, state: "Colorado", activities: ["FLY FISHING"], elevation: 3100 });
const noData = site({ id: "nodata", lat: 38.6, lng: -109.6 });
const all = [moab, gj, leadville, noData];
const ids = (r: { site: Campsite }[]) => r.map((x) => x.site.id);

describe("distanceMiles", () => {
  it("measures great-circle distance in miles", () => {
    expect(distanceMiles(38.57, -109.55, 39.06, -108.55)).toBeCloseTo(63.6, 0);
    expect(distanceMiles(1, 1, 1, 1)).toBe(0);
  });

  it("gives a compass direction", () => {
    expect(bearing(38, -109, 39, -109)).toBe("N");
    expect(bearing(38, -109, 38, -108)).toBe("E");
    expect(bearing(39, -108, 38, -109)).toBe("SW");
  });
});

describe("parseStayDays", () => {
  it.each([
    ["14 days", 14],
    ["14 Day Stay Limit", 14],
    ["14-days", 14],
    ["14", 14],
    ["14 nights within a consecutive 30-day period", 14],
    ["April-August: 7 Days, September-March: 14 days.", 7],
    ["limited to seven consecutive nights", 7],
    ["Camping is limited to one night.", 1],
    ["NO OVERNIGHT CAMPING", 0],
    ["Closed to overnight use", 0],
    ["up to 14 days, no overnight use is allowed in the parking lot", 14],
    ["Open year-round", null],
    ["N/A", null],
    ["", null],
    [undefined, null],
  ])("%s → %s", (input, expected) => {
    expect(parseStayDays(input as string | undefined)).toBe(expected);
  });
});

describe("applyFilters", () => {
  it("returns everything with no filters", () => {
    expect(ids(applyFilters(all, EMPTY_FILTERS))).toEqual(["moab", "gj", "leadville", "nodata"]);
  });

  it("filters by state", () => {
    expect(ids(applyFilters(all, { ...EMPTY_FILTERS, state: "Colorado" }))).toEqual(["gj", "leadville"]);
  });

  it("matches activity groups, requiring every selected group", () => {
    expect(ids(applyFilters(all, { ...EMPTY_FILTERS, activities: ["fishing"] }))).toEqual(["gj", "leadville"]);
    expect(ids(applyFilters(all, { ...EMPTY_FILTERS, activities: ["fishing", "hiking"] }))).toEqual(["gj"]);
    expect(ids(applyFilters(all, { ...EMPTY_FILTERS, activities: ["biking"] }))).toEqual(["moab"]);
  });

  it("filters by elevation in feet and skips campsites without elevation", () => {
    expect(ids(applyFilters(all, { ...EMPTY_FILTERS, minElevationFt: 6000 }))).toEqual(["leadville"]);
    expect(ids(applyFilters(all, { ...EMPTY_FILTERS, maxElevationFt: 4300 }))).toEqual(["moab"]);
    expect(ids(applyFilters(all, { ...EMPTY_FILTERS, minElevationFt: 4000, maxElevationFt: 5000 }))).toEqual(["moab", "gj"]);
  });

  it("filters by minimum stay limit and skips campsites without one", () => {
    expect(ids(applyFilters(all, { ...EMPTY_FILTERS, minStayDays: 14 }))).toEqual(["moab"]);
    expect(ids(applyFilters(all, { ...EMPTY_FILTERS, minStayDays: 7 }))).toEqual(["moab", "gj"]);
  });

  it("sorts by distance from the origin and applies the radius", () => {
    const origin = { lat: 38.57, lng: -109.55, label: "Moab" };
    const sorted = applyFilters(all, { ...EMPTY_FILTERS, origin });
    expect(ids(sorted)).toEqual(["moab", "nodata", "gj", "leadville"]);
    expect(sorted[0].distance).toBe(0);

    const near = applyFilters(all, { ...EMPTY_FILTERS, origin, radiusMiles: 100 });
    expect(ids(near)).toEqual(["moab", "nodata", "gj"]);
  });

  it("answers 'within 100 miles of Moab and above 4,500 ft'", () => {
    const origin = { lat: 38.57, lng: -109.55, label: "Moab" };
    const r = applyFilters(all, { ...EMPTY_FILTERS, origin, radiusMiles: 100, minElevationFt: 4500 });
    expect(ids(r)).toEqual(["gj"]);
  });
});

describe("helpers", () => {
  it("counts active filters", () => {
    expect(activeFilterCount(EMPTY_FILTERS)).toBe(0);
    expect(
      activeFilterCount({
        ...EMPTY_FILTERS,
        activities: ["hiking", "fishing"],
        state: "Utah",
        minElevationFt: 5000,
        maxElevationFt: 9000,
        origin: { lat: 0, lng: 0, label: "x" },
      })
    ).toBe(5);
  });

  it("lists states alphabetically with counts", () => {
    expect(stateOptions(all)).toEqual([
      { state: "Colorado", count: 2 },
      { state: "Utah", count: 2 },
    ]);
  });
});
