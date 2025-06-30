import React, { useCallback } from "react";
import { Routes, Route, NavLink } from "react-router-dom";
import MapView from "./views/MapView/MapView";
import CampsitesView from "./views/CampsitesView/CampsitesView";
import "./App.css";

const App: React.FC = () => {
  const [showModal, setShowModal] = React.useState<boolean>(false);

  const handleSuccess = useCallback(() => {
    setShowModal(false);
  }, []);

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
          <button
            className="plus-button"
            onClick={() => setShowModal(true)}
            aria-label="Add Campsite"
          >
            +
          </button>
          {showModal && (
            <div className="modal-overlay" onClick={() => setShowModal(false)}>
              <div
                className="modal-content"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className="close-modal"
                  onClick={() => setShowModal(false)}
                  aria-label="Close"
                >
                  &times;
                </button>
                <AddCampsiteForm onSuccess={handleSuccess} />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
