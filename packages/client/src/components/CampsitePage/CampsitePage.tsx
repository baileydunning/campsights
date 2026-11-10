import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import type { Campsite } from "../../types/Campsite";
import { selectCampsites } from "../../store/campsiteSlice";
import { getCampsiteById } from "../../api/Campsites";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import PhotoGallery from "./PhotoGallery";
import SiteMap from "./SiteMap";
import WeatherIcon from "./WeatherIcon";
import { groupForecast } from "./weather";
import { getSunTimes } from "./sun";
import "./CampsitePage.css";

const titleCase = (s: string) =>
  s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

const paragraphs = (text?: string) =>
  (text ?? "").split(/\n{2,}|\r\n\r\n/).map((p) => p.trim()).filter(Boolean);

const formatTime = (d: Date, timeZone?: string | null) =>
  d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", ...(timeZone ? { timeZone } : {}) });

const formatDuration = (minutes: number) => `${Math.floor(minutes / 60)}h ${minutes % 60}m`;

const Icon = {
  back: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>,
  directions: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polygon points="3 11 22 2 13 21 11 13 3 11" /></svg>,
  external: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>,
  share: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg>,
  copy: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>,
  alert: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>,
};

const CampsitePage: React.FC = () => {
  const id = useParams<{ id: string }>().id ?? "";
  const navigate = useNavigate();
  const location = useLocation();
  // Go back to the map where it was if we came from it; on a direct visit, go to the map.
  const goBack = () => (location.key !== "default" ? navigate(-1) : navigate("/"));
  const fromList = useSelector(selectCampsites).find((s) => s.id === id) ?? null;
  const [details, setDetails] = useState<Campsite | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "notfound" | "error">("loading");
  const [copied, setCopied] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    setDetails(null);
    setStatus("loading");
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    getCampsiteById(id)
      .then((site) => {
        if (cancelled) return;
        setDetails(site);
        setStatus(site ? "ready" : "notfound");
      })
      .catch(() => !cancelled && setStatus("error"));
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Show what we already have from the map data right away, then fill in weather etc.
  const site = details ?? fromList;

  useEffect(() => {
    if (site?.name) document.title = `${site.name} · Campsights`;
    return () => {
      document.title = "Campsights";
    };
  }, [site?.name]);

  const forecast = useMemo(() => groupForecast(details?.weather ?? []), [details?.weather]);
  const sun = useMemo(() => (site ? getSunTimes(new Date(), site.lat, site.lng) : null), [site?.lat, site?.lng]);

  const copy = async (label: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      /* clipboard blocked; nothing to do */
    }
  };

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: site?.name, url });
      } catch {
        /* cancelled */
      }
    } else {
      copy("link", url);
    }
  };

  if (!site) {
    return (
      <div className="site-page" ref={scrollRef}>
        <TopBar onShare={share} onBack={goBack} />
        <div className="site-page__empty">
          {status === "loading" ? (
            <div className="site-spinner" role="status" aria-label="Loading campsite" />
          ) : (
            <>
              <h1>{status === "notfound" ? "Campsite not found" : "Couldn't load this campsite"}</h1>
              <p>{status === "notfound" ? "It may have been removed from the BLM listings." : "Check your connection and try again."}</p>
              <button type="button" className="btn btn--primary" onClick={goBack}>Back to the map</button>
            </>
          )}
        </div>
      </div>
    );
  }

  const elevationM = details?.elevation ?? site.elevation;
  const elevationFt = elevationM != null ? Math.round(elevationM * 3.28084) : null;
  const coords = `${site.lat.toFixed(5)}, ${site.lng.toFixed(5)}`;
  const town = details?.nearestTown;
  const images = site.images ?? [];
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${site.lat},${site.lng}`;
  const alerts = details?.alerts ?? [];
  const timeZone = details?.timeZone ?? null;
  const loadingDetails = status === "loading";

  const facts: { label: string; value: React.ReactNode }[] = [
    {
      label: "Elevation",
      value: elevationFt != null ? `${elevationFt.toLocaleString()} ft` : loadingDetails ? <span className="skeleton" /> : "Unknown",
    },
    {
      label: "Coordinates",
      value: (
        <button type="button" className="copy-button" onClick={() => copy("coords", coords)} title="Copy coordinates">
          <span>{coords}</span>
          {copied === "coords" ? <span className="copy-button__done">Copied</span> : Icon.copy}
        </button>
      ),
    },
  ];
  if (site.stayLimit) facts.push({ label: "Stay limit", value: site.stayLimit.replace(/\.$/, "") });
  if (sun) {
    facts.push({ label: "Sunrise", value: formatTime(sun.sunrise, timeZone) });
    facts.push({ label: "Sunset", value: formatTime(sun.sunset, timeZone) });
    facts.push({ label: "Daylight", value: formatDuration(sun.daylightMinutes) });
  }

  return (
    <div className="site-page" ref={scrollRef}>
      <TopBar onShare={share} onBack={goBack} shareLabel={copied === "link" ? "Link copied" : "Share"} />

      <header className="site-hero">
        {images.length > 0 ? (
          <PhotoGallery images={images} name={site.name} />
        ) : (
          <div className="site-hero__map">
            <SiteMap lat={site.lat} lng={site.lng} zoom={14} variant="hero" />
          </div>
        )}
      </header>

      <div className="site-page__content">
        <div className="site-title">
          <p className="site-title__eyebrow">
            {[site.state, "BLM public land"].filter(Boolean).join(" · ")}
          </p>
          <h1>{site.name || "Unnamed site"}</h1>
          {town ? (
            <p className="site-title__sub">
              {town.distanceMiles < 1 ? "Near" : `${town.distanceMiles} mi ${town.direction} of`} {town.city}
              {town.state ? `, ${town.state}` : ""}
            </p>
          ) : loadingDetails ? (
            <p className="site-title__sub"><span className="skeleton skeleton--wide" /></p>
          ) : null}

          <div className="site-actions">
            <a className="btn btn--primary" href={directionsUrl} target="_blank" rel="noopener noreferrer">
              {Icon.directions} Get directions
            </a>
            <a className="btn" href={site.url} target="_blank" rel="noopener noreferrer">
              BLM page {Icon.external}
            </a>
          </div>
        </div>

        {alerts.length > 0 && (
          <section className="site-alerts" aria-label="Weather alerts">
            {alerts.map((a, i) => (
              <details key={i} className={`alert alert--${(a.severity || "").toLowerCase()}`}>
                <summary>
                  {Icon.alert}
                  <span>
                    <strong>{a.event}</strong>
                    {a.ends && <small>Until {new Date(a.ends).toLocaleString("en-US", { weekday: "short", hour: "numeric", minute: "2-digit", ...(timeZone ? { timeZone } : {}) })}</small>}
                  </span>
                </summary>
                {a.description && <p>{a.description}</p>}
                {a.instruction && <p><strong>What to do:</strong> {a.instruction}</p>}
              </details>
            ))}
          </section>
        )}

        <div className="site-layout">
          <main className="site-main">
            <section className="site-section">
              <h2>Weather</h2>
              {loadingDetails ? (
                <div className="forecast">
                  {Array.from({ length: 5 }).map((_, i) => <div key={i} className="forecast-day forecast-day--loading" />)}
                </div>
              ) : forecast.length > 0 ? (
                <>
                  <p className="forecast-today">{forecast[0].detailedForecast}</p>
                  <div className="forecast" role="list">
                    {forecast.map((day) => (
                      <div key={day.key} className="forecast-day" role="listitem" title={day.detailedForecast}>
                        <span className="forecast-day__name">{day.name.replace(/ Night$/, "")}</span>
                        <WeatherIcon kind={day.kind} night={day.isNight} />
                        <span className="forecast-day__temps">
                          {day.high !== null && <strong>{day.high}°</strong>}
                          {day.low !== null && <span>{day.low}°</span>}
                        </span>
                        <span className="forecast-day__short">{day.shortForecast}</span>
                        {day.precip ? <span className="forecast-day__precip">{day.precip}% precip</span> : null}
                      </div>
                    ))}
                  </div>
                  <p className="site-section__note">
                    Forecast from the National Weather Service.{" "}
                    {details?.forecastUrl && (
                      <a href={details.forecastUrl} target="_blank" rel="noopener noreferrer">Full forecast</a>
                    )}
                  </p>
                </>
              ) : (
                <p className="site-muted">No forecast available for this location right now.</p>
              )}
            </section>

            {paragraphs(site.description).length > 0 && (
              <section className="site-section">
                <h2>About</h2>
                {paragraphs(site.description).map((p, i) => <p key={i}>{p}</p>)}
              </section>
            )}

            {site.activities && site.activities.length > 0 && (
              <section className="site-section">
                <h2>Activities</h2>
                <ul className="chips">
                  {site.activities.map((a) => <li key={a}>{titleCase(a)}</li>)}
                </ul>
              </section>
            )}

            {site.directions && (
              <section className="site-section">
                <h2>Getting there</h2>
                {paragraphs(site.directions).map((p, i) => <p key={i}>{p}</p>)}
              </section>
            )}

            {site.fees && (
              <section className="site-section">
                <h2>Fees and permits</h2>
                <p>{site.fees}</p>
              </section>
            )}

            {site.wildlife && site.wildlife.length > 0 && (
              <section className="site-section">
                <h2>Wildlife</h2>
                <ul className="chips chips--quiet">
                  {site.wildlife.map((w) => <li key={w}>{titleCase(w)}</li>)}
                </ul>
              </section>
            )}

            {site.campgrounds && site.campgrounds.length > 0 && (
              <section className="site-section">
                <h2>Nearby campgrounds</h2>
                <ul className="site-list">
                  {site.campgrounds.map((c) => <li key={c}>{c}</li>)}
                </ul>
              </section>
            )}
          </main>

          <aside className="site-aside">
            <div className="card">
              <h2 className="card__title">At a glance</h2>
              <dl className="facts">
                {facts.map((f) => (
                  <div key={f.label} className="facts__row">
                    <dt>{f.label}</dt>
                    <dd>{f.value}</dd>
                  </div>
                ))}
              </dl>
              {sun && <p className="card__note">Sun times for today{timeZone ? ", local time" : ""}.</p>}
            </div>

            <div className="card card--flush">
              <SiteMap lat={site.lat} lng={site.lng} zoom={12} />
              <div className="card__footer">
                <a href={`https://www.google.com/maps/search/?api=1&query=${site.lat},${site.lng}`} target="_blank" rel="noopener noreferrer">Google Maps</a>
                <a href={`https://maps.apple.com/?ll=${site.lat},${site.lng}&q=${encodeURIComponent(site.name || "Campsite")}`} target="_blank" rel="noopener noreferrer">Apple Maps</a>
                <a href={`https://caltopo.com/map.html#ll=${site.lat},${site.lng}&z=14`} target="_blank" rel="noopener noreferrer">CalTopo</a>
              </div>
            </div>
          </aside>
        </div>

        <footer className="site-footer">
          Details come from the Bureau of Land Management and may be out of date. Not every listing is a
          confirmed campsite. Check current rules, closures and fire restrictions with the local BLM office before you go.
        </footer>
      </div>
    </div>
  );
};

const TopBar: React.FC<{ onShare: () => void; onBack: () => void; shareLabel?: string }> = ({ onShare, onBack, shareLabel = "Share" }) => (
  <nav className="site-topbar">
    <button type="button" className="site-topbar__back" onClick={onBack}>
      {Icon.back}
      <span>Map</span>
    </button>
    <Link to="/" className="site-topbar__brand">Campsights</Link>
    <button type="button" className="site-topbar__share" onClick={onShare}>
      {Icon.share}
      <span>{shareLabel}</span>
    </button>
  </nav>
);

export default CampsitePage;
