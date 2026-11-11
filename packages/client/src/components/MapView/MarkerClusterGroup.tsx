import type { ReactNode } from "react";
import L from "leaflet";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import { createElementObject, createLayerComponent, extendContext } from "@react-leaflet/core";

type MarkerClusterGroupProps = L.MarkerClusterGroupOptions & { children?: ReactNode };

export const DISABLE_CLUSTERING_AT_ZOOM = 12;

// Bubble diameter grows with the log of the count, so a 140-site cluster is
// bigger than a 2-site one without dwarfing the single tents around it.
export const clusterSize = (count: number) => Math.round(18 + 9 * Math.log10(count + 1));

// Groups child <Marker>s into numbered clusters when zoomed out.
const MarkerClusterGroup = createLayerComponent<L.MarkerClusterGroup, MarkerClusterGroupProps>(
  ({ children: _children, ...options }, ctx) => {
    const group = L.markerClusterGroup({
      chunkedLoading: true,
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      // Zoomed in to a valley or road, every site fits on screen, so stop grouping.
      disableClusteringAtZoom: DISABLE_CLUSTERING_AT_ZOOM,
      // Group loosely when zoomed out (fewer, calmer bubbles) and tightly as you zoom in.
      maxClusterRadius: (zoom: number) => (zoom <= 6 ? 80 : zoom <= 8 ? 60 : zoom <= 10 ? 45 : 30),
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount();
        const size = clusterSize(count);
        return L.divIcon({
          html: `<span>${count}</span>`,
          className: `campsite-cluster${size >= 32 ? " campsite-cluster--lg" : ""}`,
          iconSize: [size, size],
        });
      },
      ...options,
    });
    return createElementObject(group, extendContext(ctx, { layerContainer: group }));
  }
);

export default MarkerClusterGroup;
