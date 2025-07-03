import React, { useState, useCallback, Suspense, lazy } from "react";
import "./App.css";
import Loading from "./components/Loading/Loading";

const MapView = lazy(() => import("./components/MapView/MapView"));
const AddCampsiteForm = lazy(() => import("./components/AddCampsiteForm/AddCampsiteForm"));

const App: React.FC = () => {
  const [showModal, setShowModal] = useState<boolean>(false);

  const handleSuccess = useCallback(() => {
    setShowModal(false);
  }, []);

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
                <Suspense fallback={null}>
                  <AddCampsiteForm onSuccess={handleSuccess}/>
                </Suspense>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
