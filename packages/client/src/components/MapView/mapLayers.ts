// Base maps and overlays offered in the map's layer switcher.

export interface TileLayerConfig {
  name: string;
  url: string;
  attribution: string;
  maxNativeZoom: number;
  subdomains?: string;
  opacity?: number;
}

export const BASE_LAYERS: TileLayerConfig[] = [
  {
    name: "Streets",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxNativeZoom: 19,
    subdomains: "abc",
  },
  {
    name: "Topo",
    url: "https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}",
    attribution: 'Tiles courtesy of the <a href="https://www.usgs.gov/">U.S. Geological Survey</a>',
    maxNativeZoom: 16,
  },
  {
    name: "Satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution:
      "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
    maxNativeZoom: 18,
  },
];

// BLM Surface Management Agency: who manages the land (BLM, Forest Service,
// state, private, etc.). Cached tiles are published down to about zoom 14.
export const LAND_OWNERSHIP_LAYER: TileLayerConfig = {
  name: "Land ownership",
  url: "https://gis.blm.gov/arcgis/rest/services/lands/BLM_Natl_SMA_Cached_without_PriUnk/MapServer/tile/{z}/{y}/{x}",
  attribution: 'Land ownership &copy; <a href="https://www.blm.gov/">Bureau of Land Management</a>',
  maxNativeZoom: 14,
  opacity: 0.55,
};

// Current wildfire perimeters from the National Interagency Fire Center (WFIGS).
export const FIRE_PERIMETERS_URL =
  "https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/WFIGS_Interagency_Perimeters_Current/FeatureServer/0/query" +
  "?where=1%3D1" +
  "&outFields=poly_IncidentName,poly_GISAcres,attr_PercentContained,attr_FireDiscoveryDateTime,attr_IncidentTypeCategory" +
  "&geometryPrecision=4&maxAllowableOffset=0.001&outSR=4326&f=geojson";

export const MAX_ZOOM = 18;
