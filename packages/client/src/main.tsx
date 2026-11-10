import ReactDOM from "react-dom/client";
import App from "./App";
import { Provider } from 'react-redux';
import { BrowserRouter } from "react-router";
import store from './store/store';
import "leaflet/dist/leaflet.css";
import { setupPwa } from "./pwa";

setupPwa();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
);
