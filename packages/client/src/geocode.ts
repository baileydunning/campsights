import type { Origin } from "./filters";

// Looks up a town or place in the US with OpenStreetMap's Nominatim service.
// Their usage policy allows light use but not search-as-you-type, so this only
// runs when the user submits a place.
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

interface NominatimResult {
  lat: string;
  lon: string;
  name?: string;
  display_name: string;
  address?: Record<string, string>;
}

export const geocodePlace = async (query: string, signal?: AbortSignal): Promise<Origin | null> => {
  const q = query.trim();
  if (!q) return null;
  const params = new URLSearchParams({ q, format: "jsonv2", countrycodes: "us", limit: "1", addressdetails: "1" });
  const res = await fetch(`${NOMINATIM_URL}?${params}`, { signal, headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Place search failed: ${res.status}`);
  const [hit] = (await res.json()) as NominatimResult[];
  if (!hit) return null;
  const lat = Number(hit.lat);
  const lng = Number(hit.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const name = hit.name || hit.display_name.split(",")[0];
  const state = hit.address?.state;
  return { lat, lng, label: state && state !== name ? `${name}, ${state}` : name };
};
