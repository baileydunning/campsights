import React, { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import type { Campsite } from "../../types/Campsite";
import {
  ACTIVITY_GROUPS,
  DEFAULT_RADIUS,
  EMPTY_FILTERS,
  Filters as FilterValues,
  Origin,
  RADIUS_OPTIONS,
  STAY_OPTIONS,
  parseStayDays,
  stateOptions,
} from "../../filters";
import { geocodePlace } from "../../geocode";
import "./Filters.css";

interface FiltersProps {
  campsites: Campsite[];
  filters: FilterValues;
  onChange: (filters: FilterValues) => void;
  onDone: () => void;
}

const parseFeet = (value: string): number | null => {
  const n = Number(value.replace(/[^\d.]/g, ""));
  return value.trim() && Number.isFinite(n) ? Math.round(n) : null;
};

const ElevationInput: React.FC<{
  label: string;
  ariaLabel: string;
  value: number | null;
  onCommit: (v: number | null) => void;
  disabled: boolean;
}> = ({ label, ariaLabel, value, onCommit, disabled }) => {
  const [text, setText] = useState(value != null ? String(value) : "");
  // Follow outside changes, such as "Clear filters".
  useEffect(() => {
    if (parseFeet(text) !== value) setText(value != null ? String(value) : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return (
    <label className="filters__elevation-field">
      <span>{label}</span>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        placeholder="Any"
        aria-label={ariaLabel}
        value={text}
        disabled={disabled}
        onChange={(e) => {
          setText(e.target.value);
          onCommit(parseFeet(e.target.value));
        }}
      />
      <span className="filters__unit">ft</span>
    </label>
  );
};

const Filters: React.FC<FiltersProps> = ({ campsites, filters, onChange, onDone }) => {
  const [place, setPlace] = useState("");
  const [locating, setLocating] = useState<"place" | "gps" | null>(null);
  const [locationError, setLocationError] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const states = useMemo(() => stateOptions(campsites), [campsites]);
  const hasElevation = useMemo(() => campsites.some((s) => s.elevation != null), [campsites]);
  const stayCounts = useMemo(() => {
    const days = campsites.map((s) => parseStayDays(s.stayLimit));
    return STAY_OPTIONS.map((min) => days.filter((d) => d != null && d >= min).length);
  }, [campsites]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const set = (patch: Partial<FilterValues>) => onChange({ ...filters, ...patch });

  const setOrigin = (origin: Origin) => {
    setLocationError("");
    set({ origin, radiusMiles: filters.radiusMiles ?? DEFAULT_RADIUS });
  };

  const searchPlace = async (e: FormEvent) => {
    e.preventDefault();
    if (!place.trim()) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLocating("place");
    setLocationError("");
    try {
      const origin = await geocodePlace(place, controller.signal);
      if (origin) {
        setOrigin(origin);
        setPlace("");
      } else {
        setLocationError(`Couldn't find "${place.trim()}". Try a town and state, like "Moab, UT".`);
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") setLocationError("Place search isn't working right now. Try again in a moment.");
    } finally {
      if (abortRef.current === controller) setLocating(null);
    }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("This browser can't share your location.");
      return;
    }
    setLocating("gps");
    setLocationError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(null);
        setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude, label: "your location" });
      },
      (err) => {
        setLocating(null);
        setLocationError(
          err.code === err.PERMISSION_DENIED
            ? "Location access is turned off for this site."
            : "Couldn't get your location. Try searching for a town instead."
        );
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 5 * 60 * 1000 }
    );
  };

  const toggleActivity = (key: string) =>
    set({
      activities: filters.activities.includes(key)
        ? filters.activities.filter((a) => a !== key)
        : [...filters.activities, key],
    });

  return (
    <div className="filters" role="group" aria-label="Filters">
      <section className="filters__section">
        <h2 className="filters__label">Near</h2>
        {filters.origin ? (
          <div className="filters__origin">
            <span className="filters__chip is-on">
              <span className="filters__chip-text">
                {filters.origin.label === "your location" ? "Your location" : filters.origin.label}
              </span>
              <button
                type="button"
                className="filters__chip-remove"
                aria-label="Remove location"
                onClick={() => set({ origin: null, radiusMiles: null })}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </span>
            <label className="filters__inline-select">
              <span className="visually-hidden">Distance</span>
              <select
                value={filters.radiusMiles ?? ""}
                onChange={(e) => set({ radiusMiles: e.target.value ? Number(e.target.value) : null })}
              >
                {RADIUS_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    Within {r} miles
                  </option>
                ))}
                <option value="">Any distance</option>
              </select>
            </label>
          </div>
        ) : (
          <>
            <form className="filters__place" onSubmit={searchPlace}>
              <input
                type="search"
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                placeholder="Town or place"
                aria-label="Town or place"
                enterKeyHint="search"
                autoComplete="off"
              />
              <button type="submit" className="filters__button" disabled={!place.trim() || locating !== null}>
                {locating === "place" ? "Finding…" : "Go"}
              </button>
            </form>
            <button type="button" className="filters__link-button" onClick={useMyLocation} disabled={locating !== null}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <circle cx="12" cy="12" r="4" />
                <line x1="12" y1="2" x2="12" y2="5" />
                <line x1="12" y1="19" x2="12" y2="22" />
                <line x1="2" y1="12" x2="5" y2="12" />
                <line x1="19" y1="12" x2="22" y2="12" />
              </svg>
              {locating === "gps" ? "Finding your location…" : "Use my location"}
            </button>
          </>
        )}
        {locationError && (
          <p className="filters__error" role="alert">
            {locationError}
          </p>
        )}
      </section>

      <section className="filters__section">
        <label className="filters__label" htmlFor="filter-state">
          State
        </label>
        <select id="filter-state" className="filters__select" value={filters.state} onChange={(e) => set({ state: e.target.value })}>
          <option value="">Any state</option>
          {states.map(({ state, count }) => (
            <option key={state} value={state}>
              {state} ({count.toLocaleString()})
            </option>
          ))}
        </select>
      </section>

      <section className="filters__section">
        <h2 className="filters__label">Activities</h2>
        <div className="filters__chips">
          {ACTIVITY_GROUPS.map((g) => {
            const on = filters.activities.includes(g.key);
            return (
              <button
                key={g.key}
                type="button"
                className={`filters__chip${on ? " is-on" : ""}`}
                aria-pressed={on}
                onClick={() => toggleActivity(g.key)}
              >
                {g.label}
              </button>
            );
          })}
        </div>
        {filters.activities.length > 1 && <p className="filters__hint">Showing campsites that list all of these.</p>}
      </section>

      <section className="filters__section">
        <h2 className="filters__label">Elevation</h2>
        <div className="filters__elevation">
          <ElevationInput label="Min" ariaLabel="Minimum elevation in feet" value={filters.minElevationFt} onCommit={(v) => set({ minElevationFt: v })} disabled={!hasElevation} />
          <span className="filters__dash" aria-hidden="true">to</span>
          <ElevationInput label="Max" ariaLabel="Maximum elevation in feet" value={filters.maxElevationFt} onCommit={(v) => set({ maxElevationFt: v })} disabled={!hasElevation} />
        </div>
        {!hasElevation && campsites.length > 0 && <p className="filters__hint">Elevation data isn't available yet.</p>}
      </section>

      <section className="filters__section">
        <label className="filters__label" htmlFor="filter-stay">
          Stay limit
        </label>
        <select
          id="filter-stay"
          className="filters__select"
          value={filters.minStayDays ?? ""}
          onChange={(e) => set({ minStayDays: e.target.value ? Number(e.target.value) : null })}
        >
          <option value="">Any</option>
          {STAY_OPTIONS.map((d, i) => (
            <option key={d} value={d}>
              {d} days or more ({stayCounts[i].toLocaleString()})
            </option>
          ))}
        </select>
        <p className="filters__hint">Most BLM pages don't list a stay limit. The usual limit on BLM land is 14 days.</p>
      </section>

      <div className="filters__footer">
        <button type="button" className="filters__link-button" onClick={() => onChange(EMPTY_FILTERS)}>
          Clear filters
        </button>
        <button type="button" className="filters__button" onClick={onDone}>
          Done
        </button>
      </div>
    </div>
  );
};

export default Filters;
