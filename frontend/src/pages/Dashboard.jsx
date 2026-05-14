import React, { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useAuth } from "../state/AuthContext.jsx";
import http from "../api/http.js";
import ComplaintForm from "../components/ComplaintForm.jsx";
import ComplaintList from "../components/ComplaintList.jsx";
import SevaBot from "../components/SevaBot.jsx";
import DashboardShell from "../components/DashboardShell.jsx";
import { useToast } from "../state/ToastContext.jsx";

/**
 * Jan Seva AI Dashboard
 * Integrated with Geolocation API for precise civic issue reporting.
 */
export default function Dashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const toast = useToast();
  
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState("");
  
  // STATE: Initialized to track the Bhopal location data
  const [locationData, setLocationData] = useState({ address: "", coords: null });

  // Use useCallback to prevent unnecessary re-renders of the load function
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await http.get("/complaints");
      setComplaints(res.data.complaints || []);
    } catch (err) {
      toast.error(t("dashboard.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [t, toast]);

  useEffect(() => {
    load();
  }, [load]);

  /**
   * GEOLOCATION LOGIC:
   * Optimized for high-accuracy GPS capture.
   */
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    toast.info("Accessing high-accuracy GPS...");

    const geoOptions = {
      enableHighAccuracy: true, // Crucial for precise street-level reporting
      timeout: 10000, 
      maximumAge: 0   
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        // Format the captured location data
        const formattedAddress = `📍 Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)} (Bhopal, MP)`;
        
        setLocationData({
          coords: { lat: latitude, lng: longitude },
          address: formattedAddress
        });
        
        toast.success("Current location captured!");
      },
      (error) => {
        // Precise error handling for better UX
        switch(error.code) {
          case error.PERMISSION_DENIED:
            toast.error("Location access denied. Please check browser permissions.");
            break;
          case error.POSITION_UNAVAILABLE:
            toast.error("Location info unavailable.");
            break;
          case error.TIMEOUT:
            toast.error("GPS request timed out. Please try again.");
            break;
          default:
            toast.error("An unknown geolocation error occurred.");
            break;
        }
      },
      geoOptions
    );
  };

  /**
   * Handles complaint deletion via the backend API.
   */
  async function handleDelete(id) {
    if (!window.confirm(t("list.deleteConfirm"))) return;
    setDeletingId(id);
    try {
      await http.delete(`/complaints/${id}`);
      toast.success(t("list.deleteSuccess"));
      await load();
    } catch (e) {
      const msg = e?.response?.data?.message;
      if (!e.response) toast.error(t("list.deleteNetwork"));
      else toast.error(msg || t("list.deleteError"));
    } finally {
      setDeletingId("");
    }
  }

  return (
    <DashboardShell
      title={t("dashboard.greeting", { name: user?.username || "" })}
      subtitle={t("dashboard.subtitle")}
    >
      <div className="space-y-6">
        
        {/* LOCATION INTELLIGENCE BAR: 
            The color changes to emerald when a location is active. */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border p-6 rounded-[32px] shadow-sm transition-all duration-300 ${
            locationData.coords ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-100'
          }`}
        >
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#f9a61a] mb-1">
              Active Intelligence: Geolocation
            </h3>
            <p className={`text-sm font-bold ${locationData.coords ? 'text-emerald-700' : 'text-[#141b2d]'}`}>
              {locationData.address || "Area not detected — use auto-detect below"}
            </p>
          </div>
          <button
            onClick={handleGetLocation}
            className="px-6 py-3 bg-[#f9a61a] text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-orange-500/20 hover:-translate-y-0.5 transition-all active:translate-y-0 flex items-center gap-2"
          >
            <span className="text-base font-normal">📍</span> 
            {locationData.coords ? "Update Location" : "Auto-Detect Area"}
          </button>
        </motion.div>

        {/* COMPLAINT SUBMISSION FORM: 
            Receives the locationData as a prop to auto-populate the form. */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <ComplaintForm 
            onSubmitted={() => {
              load();
              setLocationData({ address: "", coords: null }); // Clean reset on success
            }} 
            initialLocation={locationData}
          />
        </motion.div>

        {/* COMPLAINT LISTING SECTION */}
        {loading ? (
          <div className="flex items-center gap-3 rounded-[24px] border border-slate-100 bg-white px-6 py-4 text-sm font-bold text-slate-400">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#f9a61a] border-t-transparent" />
            Synchronizing local records...
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }}>
            <ComplaintList 
              complaints={complaints} 
              onDelete={handleDelete} 
              deletingId={deletingId} 
            />
          </motion.div>
        )}
      </div>

      <SevaBot />
    </DashboardShell>
  );
}