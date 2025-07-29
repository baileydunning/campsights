import React, { Suspense, lazy, useEffect, useState } from "react";
import "./App.css";
import Loading from "./components/Loading/Loading";
import SearchBar from "./components/SearchBar/SearchBar";
import { useDispatch, useSelector } from "react-redux";
import { fetchCampsites, selectCampsites } from "./store/campsiteSlice";
import type { AppDispatch } from "./store/store";
import type { Campsite } from "./types/Campsite";

const MapView = lazy(() => import("./components/MapView/MapView"));

const App: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const allCampsites = useSelector(selectCampsites);
  const [filtered, setFiltered] = useState<Campsite[]>([]);

  useEffect(() => {
    dispatch(fetchCampsites());
  }, [dispatch]);

  useEffect(() => {
    setFiltered(allCampsites); 
  }, [allCampsites]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Campsights</h1>
        <h3>Explore Dispersed Campsites on Public Lands</h3>
        <SearchBar campsites={allCampsites} onSearchResults={setFiltered} />
      </header>
      <div className="app-container">
        <main className="main-content">
          <Suspense fallback={<Loading />}>
            <MapView campsites={filtered} />
          </Suspense>
        </main>
      </div>
    </div>
  );
};

export default App;
