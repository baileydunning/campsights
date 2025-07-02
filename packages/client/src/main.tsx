import ReactDOM from "react-dom/client";
import App from "./App";
import { Provider } from 'react-redux';
import store from './store/store';
import "leaflet/dist/leaflet.css";

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch((registrationError) => {
      console.log('SW registration failed: ', registrationError);
    });
  });
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <Provider store={store}>
      <App />
    </Provider>
);
