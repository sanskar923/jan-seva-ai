import React, { createContext, useContext, useMemo, useState } from "react";
import Toasts from "../ui/Toasts.jsx";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const api = useMemo(() => {
    const push = (variant, message) => {
      const id = crypto.randomUUID();
      setToasts((t) => [...t, { id, variant, message }]);
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
    };
    return {
      success: (m) => push("success", m),
      error: (m) => push("error", m),
      info: (m) => push("info", m)
    };
  }, []);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <Toasts toasts={toasts} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

