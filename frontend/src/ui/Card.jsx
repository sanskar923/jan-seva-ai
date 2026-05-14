import React from "react";

export default function Card({ children, className = "", glass = false }) {
  const glassCls = glass
    ? "border-white/25 bg-white/55 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/45"
    : "bg-white dark:bg-slate-900 shadow-soft";

  return (
    <div
      className={`rounded-2xl border border-slate-200 p-5 dark:border-slate-800 ${glassCls} ${className}`}
    >
      {children}
    </div>
  );
}
