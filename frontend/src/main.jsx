import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import ScrollToTop from "./Components/ScrollToTop";
import Store from "./redux/Store";
import { Provider } from "react-redux";
import { ToastContainer} from 'react-toastify';
import './index.css'
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <ScrollToTop />
      <Provider store={Store}>
        <App />
        <ToastContainer position="top-right" autoClose={2000} />
      </Provider>
    </BrowserRouter>
  </StrictMode>
);
