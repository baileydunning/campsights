import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

const LOCATE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/></svg>`;
const EXPAND_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`;
const COLLAPSE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`;

interface MapControlsProps {
  onLocate: (position: [number, number]) => void;
  position?: L.ControlPosition;
}

const makeButton = (container: HTMLElement, label: string, icon: string) => {
  const button = L.DomUtil.create("a", "map-control-button", container);
  button.href = "#";
  button.setAttribute("role", "button");
  button.setAttribute("aria-label", label);
  button.title = label;
  button.innerHTML = icon;
  return button;
};

// "Show my location" and fullscreen buttons, styled to match Leaflet's zoom buttons.
const MapControls: React.FC<MapControlsProps> = ({ onLocate, position = "bottomright" }) => {
  const map = useMap();
  const onLocateRef = useRef(onLocate);
  onLocateRef.current = onLocate;

  useEffect(() => {
    const control = new L.Control({ position });
    let locateButton: HTMLAnchorElement;
    let fullscreenButton: HTMLAnchorElement | null = null;

    control.onAdd = () => {
      const container = L.DomUtil.create("div", "leaflet-bar map-controls");
      L.DomEvent.disableClickPropagation(container);
      L.DomEvent.disableScrollPropagation(container);

      locateButton = makeButton(container, "Show my location", LOCATE_ICON);
      L.DomEvent.on(locateButton, "click", (e) => {
        L.DomEvent.preventDefault(e);
        locateButton.classList.add("is-loading");
        map.locate({ setView: true, maxZoom: 12, enableHighAccuracy: true });
      });

      // iPhone Safari has no Fullscreen API for regular elements, so hide the button there.
      if (document.fullscreenEnabled) {
        fullscreenButton = makeButton(container, "Full screen", EXPAND_ICON);
        L.DomEvent.on(fullscreenButton, "click", (e) => {
          L.DomEvent.preventDefault(e);
          if (document.fullscreenElement) {
            document.exitFullscreen();
          } else {
            document.documentElement.requestFullscreen();
          }
        });
      }
      return container;
    };

    const onFound = (e: L.LocationEvent) => {
      locateButton?.classList.remove("is-loading");
      onLocateRef.current([e.latlng.lat, e.latlng.lng]);
    };
    const onError = (e: L.ErrorEvent) => {
      locateButton?.classList.remove("is-loading");
      console.warn("Location unavailable:", e.message);
    };
    const onFullscreenChange = () => {
      const active = Boolean(document.fullscreenElement);
      if (fullscreenButton) {
        fullscreenButton.innerHTML = active ? COLLAPSE_ICON : EXPAND_ICON;
        const label = active ? "Exit full screen" : "Full screen";
        fullscreenButton.title = label;
        fullscreenButton.setAttribute("aria-label", label);
      }
      setTimeout(() => map.invalidateSize(), 100);
    };

    control.addTo(map);
    map.on("locationfound", onFound);
    map.on("locationerror", onError);
    document.addEventListener("fullscreenchange", onFullscreenChange);

    return () => {
      map.off("locationfound", onFound);
      map.off("locationerror", onError);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      control.remove();
    };
  }, [map, position]);

  return null;
};

export default MapControls;
