import React from "react";
import MapView from "./components/MapView/MapView";
import "./App.css";

const App: React.FC = () => {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Campsights</h1>
      </header>
      <div className="app-container">
        <main className="main-content">
          <MapView />
        </main>
      </div>
    </div>
  );
};

export default App;
