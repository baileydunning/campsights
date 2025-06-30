import React from "react";
import { Routes, Route, NavLink } from "react-router-dom";
import MapView from "./views/MapView/MapView";
import CampsitesView from "./views/CampsitesView/CampsitesView";
import "./App.css";

const App: React.FC = () => {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Campsights</h1>
        <nav className="app-nav">
          <NavLink to="/" end>Map</NavLink>
          <NavLink to="/campsites">Campsites</NavLink>
        </nav>
      </header>
      <div className="app-container">
        <main className="main-content">
          <Routes>
            <Route path="/" element={<MapView />} />
            <Route path="/campsites" element={<CampsitesView />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default App;
