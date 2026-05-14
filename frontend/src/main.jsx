import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./i18n/config.js";
import App from "./App.jsx";
import "./styles.css";
import { AuthProvider } from "./state/AuthContext.jsx";
import { ToastProvider } from "./state/ToastContext.jsx";
import { ThemeProvider } from "./state/ThemeContext.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
