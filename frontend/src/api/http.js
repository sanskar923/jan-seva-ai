import axios from "axios";

/** Dispatched when an API call proves the session is no longer valid (401). */
export const AUTH_LOST_EVENT = "janseva:auth-lost";

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  timeout: 15000
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem("janSevaToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

http.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const path = String(err.config?.url || "");
    const base = String(err.config?.baseURL || "");
    const combined = base && path && !path.startsWith("http") ? `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}` : path;

    // Wrong password on login returns 401 — do not wipe a still-valid session.
    const isLoginOrSignup = /\/auth\/(login|signup)(\?|$|\/)/.test(combined) || /\/auth\/(login|signup)(\?|$|\/)/.test(path);

    if (status === 401 && !isLoginOrSignup) {
      localStorage.removeItem("janSevaToken");
      localStorage.removeItem("janSevaUser");
      window.dispatchEvent(new CustomEvent(AUTH_LOST_EVENT, { detail: { url: combined } }));
    }

    return Promise.reject(err);
  }
);

export default http;
