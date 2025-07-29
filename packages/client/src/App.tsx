import React, { Suspense, lazy, useEffect } from "react";
import "./App.css";
import Loading from "./components/Loading/Loading";
import { useDispatch } from "react-redux";
import { fetchCampsites } from "./store/campsiteSlice";
import type { AppDispatch } from "./store/store";

const MapView = lazy(() => import("./components/MapView/MapView"));

const App: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    dispatch(fetchCampsites());
  }, [dispatch]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Campsights</h1>
      </header>
      <div className="app-container">
        <main className="main-content">
          <Suspense fallback={<Loading />}>
            <MapView />
          </Suspense>
        </main>
      </div>
    </div>
  );
};

export default App;
