import type { ReactNode } from "react";
import L from "leaflet";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import { createElementObject, createLayerComponent, extendContext } from "@react-leaflet/core";

type MarkerClusterGroupProps = L.MarkerClusterGroupOptions & { children?: ReactNode };

// Groups child <Marker>s into numbered clusters when zoomed out.
const MarkerClusterGroup = createLayerComponent<L.MarkerClusterGroup, MarkerClusterGroupProps>(
  ({ children: _children, ...options }, ctx) => {
    const group = L.markerClusterGroup({
      chunkedLoading: true,
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      maxClusterRadius: 50,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount();
        const size = count < 10 ? "sm" : count < 100 ? "md" : "lg";
        return L.divIcon({
          html: `<span>${count}</span>`,
          className: `campsite-cluster campsite-cluster--${size}`,
          iconSize: size === "sm" ? [32, 32] : size === "md" ? [38, 38] : [44, 44],
        });
      },
      ...options,
    });
    return createElementObject(group, extendContext(ctx, { layerContainer: group }));
  }
);

export default MarkerClusterGroup;
