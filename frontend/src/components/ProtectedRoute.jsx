import React from "react";
import { Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useAuth } from "../state/AuthContext.jsx";

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { t } = useTranslation();
  const { isAuthed, isAdmin, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-3 rounded-2xl border border-white/30 bg-white/60 px-5 py-4 text-sm font-semibold text-slate-700 shadow-soft backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-200"
        >
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          {t("protected.loading")}
        </motion.div>
      </div>
    );
  }
  if (!isAuthed) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" replace />;
  return children;
}
