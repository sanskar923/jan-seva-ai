import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import http, { AUTH_LOST_EVENT } from "../api/http.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [token, setToken] = useState(() => localStorage.getItem("janSevaToken") || "");
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("janSevaUser");
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem("janSevaToken")));

  useEffect(() => {
    function onAuthLost() {
      setToken("");
      setUser(null);
      setLoading(false);
      navigate("/login", { replace: true });
    }
    window.addEventListener(AUTH_LOST_EVENT, onAuthLost);
    return () => window.removeEventListener(AUTH_LOST_EVENT, onAuthLost);
  }, [navigate]);

  useEffect(() => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    http
      .get("/auth/me")
      .then((r) => {
        if (cancelled) return;
        setUser(r.data.user);
        localStorage.setItem("janSevaUser", JSON.stringify(r.data.user));
      })
      .catch((err) => {
        if (cancelled) return;
        // 401: axios interceptor clears storage and emits AUTH_LOST (redirect + state reset).
        if (err.response?.status === 401) return;
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token, navigate]);

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      isAuthed: Boolean(token) && Boolean(user),
      isAdmin: user?.role === "admin",
      async login(username, password) {
        const res = await http.post("/auth/login", { username, password });
        localStorage.setItem("janSevaToken", res.data.token);
        localStorage.setItem("janSevaUser", JSON.stringify(res.data.user));
        setToken(res.data.token);
        setUser(res.data.user);
      },
      async signup(username, password) {
        const res = await http.post("/auth/signup", { username, password });
        if (res.data?.token && res.data?.user) {
          localStorage.setItem("janSevaToken", res.data.token);
          localStorage.setItem("janSevaUser", JSON.stringify(res.data.user));
          setToken(res.data.token);
          setUser(res.data.user);
        }
      },
      async logout() {
        try {
          await http.post("/auth/logout");
        } catch {
          // ignore
        }
        localStorage.removeItem("janSevaToken");
        localStorage.removeItem("janSevaUser");
        setToken("");
        setUser(null);
        navigate("/login", { replace: true });
      }
    }),
    [token, user, loading, navigate]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
