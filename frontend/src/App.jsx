import React, { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import NotFound from "./pages/NotFound.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { useAuth } from "./state/AuthContext.jsx";

function Shell() {
  const { isAuthed } = useAuth();
  const { pathname } = useLocation();

  // --- THEME LOGIC START ---
  // Initialize theme from local storage or default to 'dark'
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");

  useEffect(() => {
    const root = window.document.documentElement;
    // Remove both classes to reset
    root.classList.remove("light", "dark");
    // Add the current theme class to the <html> tag
    root.classList.add(theme);
    // Save preference for next visit
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Function to switch themes
  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };
  // --- THEME LOGIC END ---

  const hideNav = pathname.startsWith("/dashboard") || pathname.startsWith("/admin");

  return (
    /* The main wrapper now uses the theme state. 
       'dark' mode triggers the Emerald/Midnight theme. 
    */
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-emerald-500 selection:text-white transition-colors duration-300">
      
      {!hideNav ? (
        <Navbar theme={theme} toggleTheme={toggleTheme} />
      ) : null}

      <main className="relative">
        <Routes>
          <Route path="/" element={<Landing />} />
          
          <Route 
            path="/login" 
            element={isAuthed ? <Navigate to="/dashboard" replace /> : <Login />} 
          />
          <Route 
            path="/signup" 
            element={isAuthed ? <Navigate to="/dashboard" replace /> : <Signup />} 
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return <Shell />;
}
