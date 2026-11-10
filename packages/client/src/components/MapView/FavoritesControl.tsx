import React, { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import { useNavigate } from "react-router";
import L from "leaflet";
import { useFavorites } from "../../favorites";

const STAR = `<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.2l2.6 5.5 6 .8-4.4 4.1 1.1 5.9L12 16.6l-5.3 2.9 1.1-5.9-4.4-4.1 6-.8z" fill="currentColor" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/></svg>`;

// Star button under the layer switcher that opens the favorites page.
const FavoritesControl: React.FC = () => {
  const map = useMap();
  const navigate = useNavigate();
  const { ids } = useFavorites();
  const badgeRef = useRef<HTMLSpanElement | null>(null);
  const linkRef = useRef<HTMLAnchorElement | null>(null);
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  useEffect(() => {
    const control = new L.Control({ position: "topright" });
    control.onAdd = () => {
      const container = L.DomUtil.create("div", "leaflet-bar favorites-control");
      L.DomEvent.disableClickPropagation(container);
      const link = L.DomUtil.create("a", "map-control-button favorites-control__link", container);
      link.href = "/favorites";
      link.innerHTML = STAR;
      const badge = L.DomUtil.create("span", "favorites-control__badge", link);
      badgeRef.current = badge;
      linkRef.current = link;
      L.DomEvent.on(link, "click", (e) => {
        const ev = e as MouseEvent;
        if (ev.metaKey || ev.ctrlKey || ev.shiftKey) return; // let new-tab clicks through
        L.DomEvent.preventDefault(e);
        navigateRef.current("/favorites");
      });
      return container;
    };
    control.addTo(map);
    return () => {
      control.remove();
    };
  }, [map]);

  useEffect(() => {
    const count = ids.length;
    if (badgeRef.current) {
      badgeRef.current.textContent = count > 99 ? "99+" : String(count);
      badgeRef.current.hidden = count === 0;
    }
    if (linkRef.current) {
      const label = count ? `Favorites (${count})` : "Favorites";
      linkRef.current.title = label;
      linkRef.current.setAttribute("aria-label", label);
      linkRef.current.classList.toggle("has-favorites", count > 0);
    }
  }, [ids]);

  return null;
};

export default FavoritesControl;
