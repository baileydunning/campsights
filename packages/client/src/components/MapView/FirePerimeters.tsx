import React, { useRef } from "react";
import { GeoJSON } from "react-leaflet";
import type L from "leaflet";
import type { Feature, FeatureCollection } from "geojson";
import { FIRE_PERIMETERS_URL } from "./mapLayers";

const EMPTY: FeatureCollection = { type: "FeatureCollection", features: [] };

const style = (feature?: Feature): L.PathOptions => {
  const prescribed = feature?.properties?.attr_IncidentTypeCategory === "RX";
  const color = prescribed ? "#C77C1E" : "#D2382B";
  return { color, weight: 1.5, fillColor: color, fillOpacity: 0.25 };
};

const formatNumber = (n: unknown) =>
  typeof n === "number" && !Number.isNaN(n) ? Math.round(n).toLocaleString() : null;

// Builds popup content with DOM text nodes so names from the feed are never parsed as HTML.
const popupContent = (feature: Feature): HTMLElement => {
  const p = feature.properties ?? {};
  const el = document.createElement("div");
  el.className = "fire-popup";

  const title = document.createElement("strong");
  title.textContent = p.poly_IncidentName ? String(p.poly_IncidentName) : "Unnamed fire";
  el.appendChild(title);

  const rows: string[] = [];
  rows.push(p.attr_IncidentTypeCategory === "RX" ? "Prescribed fire" : "Wildfire");
  const acres = formatNumber(p.poly_GISAcres);
  if (acres) rows.push(`${acres} acres`);
  const contained = formatNumber(p.attr_PercentContained);
  if (contained) rows.push(`${contained}% contained`);
  if (typeof p.attr_FireDiscoveryDateTime === "number") {
    rows.push(`Discovered ${new Date(p.attr_FireDiscoveryDateTime).toLocaleDateString()}`);
  }
  for (const text of rows) {
    const line = document.createElement("div");
    line.textContent = text;
    el.appendChild(line);
  }
  return el;
};

// Current wildfire perimeters. Data is only downloaded the first time the
// overlay is turned on.
const FirePerimeters: React.FC = () => {
  const layerRef = useRef<L.GeoJSON | null>(null);
  const loaded = useRef(false);

  const load = async () => {
    if (loaded.current) return;
    loaded.current = true;
    try {
      const res = await fetch(FIRE_PERIMETERS_URL);
      if (!res.ok) throw new Error(`Fire perimeters ${res.status}`);
      const data = (await res.json()) as FeatureCollection;
      layerRef.current?.addData(data);
    } catch (err) {
      loaded.current = false; // try again next time the overlay is turned on
      console.error("Failed to load fire perimeters", err);
    }
  };

  return (
    <GeoJSON
      ref={layerRef}
      data={EMPTY}
      style={style}
      onEachFeature={(feature, layer) => layer.bindPopup(() => popupContent(feature))}
      eventHandlers={{ add: load }}
    />
  );
};

export default FirePerimeters;
