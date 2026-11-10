import React, { Suspense, lazy, useEffect, useRef, useState } from "react";
import { Navigate, Route, Routes } from "react-router";
import "./App.css";
import Loading from "./components/Loading/Loading";
import SearchBar from "./components/SearchBar/SearchBar";
import InfoTip from "./components/InfoTip/InfoTip";
import { useDispatch, useSelector } from "react-redux";
import { fetchCampsites, selectCampsites, selectError, selectLoading } from "./store/campsiteSlice";
import type { AppDispatch } from "./store/store";
import type { Campsite } from "./types/Campsite";

const MapView = lazy(() => import("./components/MapView/MapView"));
const CampsitePage = lazy(() => import("./components/CampsitePage/CampsitePage"));

const App: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  // Kept here (not in the map page) so a search survives a trip to a campsite page and back.
  const [query, setQuery] = useState("");
  const [filtered, setFiltered] = useState<Campsite[]>([]);

  useEffect(() => {
    dispatch(fetchCampsites());
  }, [dispatch]);

  return (
    <Routes>
      <Route
        path="/"
        element={<MapPage query={query} setQuery={setQuery} filtered={filtered} setFiltered={setFiltered} />}
      />
      <Route
        path="/campsites/:id"
        element={
          <Suspense fallback={<Loading />}>
            <CampsitePage />
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
  filtered: Campsite[];
  setFiltered: (c: Campsite[]) => void;
}

const MapPage: React.FC<MapPageProps> = ({ query, setQuery, filtered, setFiltered }) => {
  const allCampsites = useSelector(selectCampsites);
  const loading = useSelector(selectLoading);
  const error = useSelector(selectError);
  const panelRef = useRef<HTMLElement>(null);

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
          <MapView campsites={filtered} searchQuery={query} />
        </Suspense>
      </main>

      <header className="search-panel" ref={panelRef}>
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
        <SearchBar
          campsites={allCampsites}
          initialQuery={query}
          onSearchResults={setFiltered}
          onQueryChange={setQuery}
        />
        <p className="search-panel__status" aria-live="polite">
          {error && allCampsites.length === 0
            ? "Couldn't load campsites. Try refreshing."
            : loading && allCampsites.length === 0
              ? "Loading campsites…"
              : query
                ? `${filtered.length.toLocaleString()} of ${allCampsites.length.toLocaleString()} campsites`
                : `${allCampsites.length.toLocaleString()} campsites`}
        </p>
      </header>
    </div>
  );
};

export default App;
