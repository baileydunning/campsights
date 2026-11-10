import React from "react";
import { Marker, Popup } from "react-leaflet";
import { Link } from "react-router";
import { tentIcon } from "../MapView/icons";
import type { Campsite } from "../../types/Campsite";
import "./CampsiteMarker.css";

export interface CampsiteMarkerProps {
  site: Campsite;
}

const titleCase = (s: string) => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

// A compact preview card. Everything else (weather, photos, directions text)
// lives on the campsite page, which keeps the popup small enough for phones.
const CampsiteMarker: React.FC<CampsiteMarkerProps> = ({ site }) => {
  if (!site) return null;
  const photo = site.images?.[0];
  const activities = (site.activities ?? []).slice(0, 3).map(titleCase);
  const detailsPath = `/campsites/${encodeURIComponent(site.id)}`;
  // Leaflet sizes popups in pixels, so keep the card inside narrow phone screens.
  const maxWidth = typeof window !== "undefined" ? Math.min(300, window.innerWidth - 48) : 300;
  // Keep the opened popup below the floating search panel.
  const panelBottom =
    typeof document !== "undefined"
      ? parseInt(getComputedStyle(document.documentElement).getPropertyValue("--panel-bottom"), 10) || 200
      : 200;

  return (
    <Marker position={[site.lat, site.lng]} icon={tentIcon}>
      <Popup
        className="campsite-popup"
        minWidth={Math.min(240, maxWidth)}
        maxWidth={maxWidth}
        autoPanPaddingTopLeft={[16, panelBottom + 16]}
        autoPanPaddingBottomRight={[64, 32]}
      >
        <div className="campsite-card">
          {photo && (
            <img className="campsite-card__photo" src={photo.src} alt={photo.alt || site.name} loading="lazy" />
          )}
          <div className="campsite-card__body">
            {site.state && <p className="campsite-card__state">{site.state}</p>}
            <h3 className="campsite-card__name">{site.name || "Unnamed Site"}</h3>
            {site.description && <p className="campsite-card__desc">{site.description}</p>}
            {activities.length > 0 && (
              <p className="campsite-card__activities">{activities.join(" · ")}</p>
            )}
            <div className="campsite-card__actions">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${site.lat},${site.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="popup-button"
                role="button"
              >
                Get Directions
              </a>
              <Link to={detailsPath} className="popup-button popup-button--primary" role="button">
                Get Details
              </Link>
            </div>
          </div>
        </div>
      </Popup>
    </Marker>
  );
};

export default React.memo(CampsiteMarker);
