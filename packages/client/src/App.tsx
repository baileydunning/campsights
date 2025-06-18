import React, { useState, useCallback } from "react";
import MapView from "./components/MapView/MapView";
import CampsiteForm from "./components/CampsiteForm/CampsiteForm";
import "./App.css";

const App: React.FC = () => {
  const [showModal, setShowModal] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSuccess = useCallback(() => {
    setShowModal(false);
    setRefreshKey((k) => k + 1); // triggers MapView to refetch
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Campsights</h1>
      </header>
      <div className="app-container">
        <main className="main-content">
          <MapView refreshKey={refreshKey} />
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
                <CampsiteForm onSuccess={handleSuccess}/>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
