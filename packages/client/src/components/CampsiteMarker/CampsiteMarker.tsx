import React, { useState } from "react";
import { Marker, Popup } from "react-leaflet";
import { Link } from "react-router";
import { tentIcon } from "../MapView/icons";
import type { Campsite } from "../../types/Campsite";
import { getCampsiteById } from "../../api/Campsites";
import WeatherIcon from "../CampsitePage/WeatherIcon";
import { groupForecast } from "../CampsitePage/weather";
import "./CampsiteMarker.css";

export interface CampsiteMarkerProps {
  site: Campsite;
}

const MAX_ACTIVITIES = 5;
const DETAILS_TTL = 10 * 60 * 1000;

// Shared across markers so reopening a popup doesn't refetch the forecast.
const detailsCache = new Map<string, { data: Campsite | null; at: number }>();

const titleCase = (s: string) => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

const setPopupOpen = (open: boolean) => document.documentElement.classList.toggle("popup-open", open);

const isPhone = () => typeof window !== "undefined" && window.matchMedia?.("(max-width: 600px)").matches;

const CampsiteMarker: React.FC<CampsiteMarkerProps> = ({ site }) => {
  const [details, setDetails] = useState<Campsite | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");

  if (!site) return null;

  const loadDetails = async () => {
    const cached = detailsCache.get(site.id);
    if (cached && Date.now() - cached.at < DETAILS_TTL) {
      setDetails(cached.data);
      setStatus(cached.data ? "ready" : "error");
      return;
    }
    if (status === "loading") return;
    setStatus("loading");
    try {
      const data = await getCampsiteById(site.id);
      detailsCache.set(site.id, { data, at: Date.now() });
      setDetails(data);
      setStatus(data ? "ready" : "error");
    } catch {
      setStatus("error");
    }
  };

  const photo = site.images?.[0];
  const activities = (site.activities ?? []).map(titleCase);
  const extraActivities = Math.max(0, activities.length - MAX_ACTIVITIES);
  const detailsPath = `/campsites/${encodeURIComponent(site.id)}`;
  const today = details?.weather?.length ? groupForecast(details.weather)[0] : null;
  const elevationM = details?.elevation ?? site.elevation;
  const elevationFt = elevationM != null ? Math.round(elevationM * 3.28084) : null;
  const town = details?.nearestTown;

  // Leaflet sizes popups in pixels, so keep the card inside narrow phone screens.
  const maxWidth = typeof window !== "undefined" ? Math.min(320, window.innerWidth - 32) : 320;
  // On phones the search panel hides while a popup is open, so less top padding is needed.
  const panelBottom =
    typeof document !== "undefined"
      ? parseInt(getComputedStyle(document.documentElement).getPropertyValue("--panel-bottom"), 10) || 200
      : 200;
  const topPadding = isPhone() ? 16 : panelBottom + 16;

  return (
    <Marker
      position={[site.lat, site.lng]}
      icon={tentIcon}
      eventHandlers={{
        popupopen: () => {
          setPopupOpen(true);
          loadDetails();
        },
        popupclose: () => setPopupOpen(false),
      }}
    >
      <Popup
        className="campsite-popup"
        minWidth={Math.min(260, maxWidth)}
        maxWidth={maxWidth}
        autoPanPaddingTopLeft={[16, topPadding]}
        autoPanPaddingBottomRight={[16, 32]}
      >
        <div className="campsite-card">
          {photo && (
            <img className="campsite-card__photo" src={photo.src} alt={photo.alt || site.name} loading="lazy" />
          )}
          <div className="campsite-card__body">
            <p className="campsite-card__eyebrow">
              {[
                site.state,
                town ? `${town.distanceMiles < 1 ? "Near" : `${Math.round(town.distanceMiles)} mi ${town.direction} of`} ${town.city}` : null,
              ]
                .filter(Boolean)
                .join(" · ") || "BLM public land"}
            </p>
            <h3 className="campsite-card__name">{site.name || "Unnamed Site"}</h3>

            <div className="campsite-card__weather" aria-live="polite">
              {status === "ready" && today ? (
                <>
                  <WeatherIcon kind={today.kind} night={today.isNight} size={38} />
                  <div className="campsite-card__weather-main">
                    <span className="campsite-card__temps">
                      {today.high !== null && <strong>{today.high}°</strong>}
                      {today.low !== null && <span>{today.low}°</span>}
                    </span>
                    <span className="campsite-card__forecast">
                      {today.name}: {today.shortForecast}
                      {today.precip ? `, ${today.precip}% precip` : ""}
                    </span>
                  </div>
                </>
              ) : status === "ready" || status === "error" ? (
                <span className="campsite-card__weather-empty">Forecast unavailable</span>
              ) : (
                <>
                  <span className="campsite-card__skeleton campsite-card__skeleton--icon" />
                  <div className="campsite-card__weather-main">
                    <span className="campsite-card__skeleton" style={{ width: 70 }} />
                    <span className="campsite-card__skeleton" style={{ width: 130 }} />
                  </div>
                </>
              )}
              {elevationFt != null && (
                <span className="campsite-card__elevation" title="Elevation">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 20l6-10 4 6 2-3 6 7z" /></svg>
                  {elevationFt.toLocaleString()} ft
                </span>
              )}
            </div>

            {site.description && <p className="campsite-card__desc">{site.description}</p>}

            {activities.length > 0 && (
              <ul className="campsite-card__chips" aria-label="Activities">
                {activities.slice(0, MAX_ACTIVITIES).map((a) => (
                  <li key={a}>{a}</li>
                ))}
                {extraActivities > 0 && <li className="campsite-card__chip-more">+{extraActivities} more</li>}
              </ul>
            )}

            {site.stayLimit && (
              <p className="campsite-card__meta">Stay limit: {site.stayLimit.replace(/\.$/, "")}</p>
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
              <Link to={detailsPath} className="popup-button popup-button--primary" role="button" onClick={() => setPopupOpen(false)}>
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
