import React, { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, Route, Routes } from "react-router";
import "./App.css";
import Loading from "./components/Loading/Loading";
import SearchBar from "./components/SearchBar/SearchBar";
import InfoTip from "./components/InfoTip/InfoTip";
import Filters from "./components/Filters/Filters";
import ResultsList from "./components/Filters/ResultsList";
import { EMPTY_FILTERS, activeFilterCount, applyFilters, type Filters as FilterValues } from "./filters";
import { useDispatch, useSelector } from "react-redux";
import { fetchCampsites, selectCampsites, selectError, selectLoading } from "./store/campsiteSlice";
import type { AppDispatch } from "./store/store";
import type { Campsite } from "./types/Campsite";

const MapView = lazy(() => import("./components/MapView/MapView"));
const CampsitePage = lazy(() => import("./components/CampsitePage/CampsitePage"));
const FavoritesPage = lazy(() => import("./components/FavoritesPage/FavoritesPage"));

const App: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  // Kept here (not in the map page) so a search survives a trip to a campsite page and back.
  const [query, setQuery] = useState("");
  const [textMatches, setTextMatches] = useState<Campsite[]>([]);
  const [filters, setFilters] = useState<FilterValues>(EMPTY_FILTERS);
  const [listOpen, setListOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchCampsites());
  }, [dispatch]);

  return (
    <Routes>
      <Route
        path="/"
        element={
          <MapPage
            query={query}
            setQuery={setQuery}
            textMatches={textMatches}
            setTextMatches={setTextMatches}
            filters={filters}
            setFilters={setFilters}
            listOpen={listOpen}
            setListOpen={setListOpen}
          />
        }
      />
      <Route
        path="/campsites/:id"
        element={
          <Suspense fallback={<Loading />}>
            <CampsitePage />
          </Suspense>
        }
      />
      <Route
        path="/favorites"
        element={
          <Suspense fallback={<Loading />}>
            <FavoritesPage />
          </Suspense>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

interface MapPageProps {
  query: string;
  setQuery: (q: string) => void;
  textMatches: Campsite[];
  setTextMatches: (c: Campsite[]) => void;
  filters: FilterValues;
  setFilters: (f: FilterValues) => void;
  listOpen: boolean;
  setListOpen: (open: boolean) => void;
}

const MapPage: React.FC<MapPageProps> = ({
  query,
  setQuery,
  textMatches,
  setTextMatches,
  filters,
  setFilters,
  listOpen,
  setListOpen,
}) => {
  const allCampsites = useSelector(selectCampsites);
  const loading = useSelector(selectLoading);
  const error = useSelector(selectError);
  const panelRef = useRef<HTMLElement>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filterCount = activeFilterCount(filters);
  const results = useMemo(() => applyFilters(textMatches, filters), [textMatches, filters]);
  const mapCampsites = useMemo(() => results.map((r) => r.site), [results]);
  // Changes whenever the search or filters do, so the map can zoom to the new results.
  const fitKey = query || filterCount ? `${query}|${JSON.stringify(filters)}` : "";
  const { origin, radiusMiles } = filters;
  const showList = Boolean(origin) && results.length > 0;

  let status: string;
  if (error && allCampsites.length === 0) status = "Couldn't load campsites. Try refreshing.";
  else if (loading && allCampsites.length === 0) status = "Loading campsites…";
  else if (query || filterCount) {
    status = `${results.length.toLocaleString()} of ${allCampsites.length.toLocaleString()} campsites`;
    if (origin) status += radiusMiles ? ` within ${radiusMiles} mi of ${origin.label}` : `, closest to ${origin.label} first`;
  } else status = `${allCampsites.length.toLocaleString()} campsites`;

  useEffect(() => {
    document.title = "Campsights";
  }, []);

  // Publish the search panel's height so map controls and popups can stay below it.
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel || typeof ResizeObserver === "undefined") return;
    const update = () =>
      document.documentElement.style.setProperty("--panel-bottom", `${Math.ceil(panel.getBoundingClientRect().bottom)}px`);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(panel);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="app">
      <main className="main-content">
        <Suspense fallback={<Loading />}>
          <MapView campsites={mapCampsites} fitKey={fitKey} origin={origin} radiusMiles={radiusMiles} />
        </Suspense>
      </main>

      <header className={`search-panel${filtersOpen || (listOpen && showList) ? " is-expanded" : ""}`} ref={panelRef}>
        <div className="search-panel__top">
          <h1 className="brand">Campsights</h1>
          <a
            className="github-link"
            href="https://github.com/baileydunning/campsights"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View on GitHub"
            title="View on GitHub"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.085 1.84 1.237 1.84 1.237 1.07 1.834 2.809 1.304 3.495.997.108-.775.418-1.305.762-1.605-2.665-.305-5.466-1.332-5.466-5.931 0-1.31.469-2.381 1.236-3.221-.124-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.873.119 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.804 5.624-5.475 5.921.43.372.823 1.102.823 2.222v3.293c0 .322.218.694.825.576C20.565 21.796 24 17.297 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
          </a>
        </div>
        <p className="search-panel__about">
          Dispersed campsites on public land, using data from the{" "}
          <a href="https://www.blm.gov/visit" target="_blank" rel="noopener noreferrer">
            Bureau of Land Management
          </a>{" "}
          website.
          <InfoTip label="About this data">
            Not every location on the map is a confirmed campsite. Some are trailheads, staging areas or other
            points of interest. Weather, elevation and land ownership data are approximate. Always check current
            rules, closures and fire restrictions with the local BLM office before you go.
          </InfoTip>
        </p>
        <div className="search-panel__row">
          <SearchBar
            campsites={allCampsites}
            initialQuery={query}
            onSearchResults={setTextMatches}
            onQueryChange={setQuery}
          />
          <button
            type="button"
            className={`filters-toggle${filtersOpen ? " is-open" : ""}${filterCount ? " is-active" : ""}`}
            aria-expanded={filtersOpen}
            aria-controls="filters-panel"
            onClick={() => setFiltersOpen(!filtersOpen)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="7" y1="12" x2="17" y2="12" />
              <line x1="10" y1="18" x2="14" y2="18" />
            </svg>
            <span>Filters</span>
            {filterCount > 0 && <span className="filters-toggle__count">{filterCount}</span>}
          </button>
        </div>
        {filtersOpen && (
          <div id="filters-panel">
            <Filters campsites={allCampsites} filters={filters} onChange={setFilters} onDone={() => setFiltersOpen(false)} />
          </div>
        )}
        <div className="search-panel__status-row">
          <p className="search-panel__status" aria-live="polite">
            {status}
          </p>
          {showList && (
            <button type="button" className="search-panel__list-toggle" aria-expanded={listOpen} onClick={() => setListOpen(!listOpen)}>
              {listOpen ? "Hide list" : "Show list"}
            </button>
          )}
        </div>
        {showList && listOpen && origin && <ResultsList results={results} origin={origin} />}
      </header>
    </div>
  );
};

export default App;
