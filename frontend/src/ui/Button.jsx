import React from "react";

export default function Button({ children, className = "", variant = "primary", ...props }) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-slate-400/30 disabled:opacity-60 disabled:cursor-not-allowed";
  const variants = {
    primary:
      "bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200",
    secondary:
      "bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-800 dark:hover:bg-slate-900/70",
    danger:
      "bg-rose-600 text-white hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-600",
    gradient:
      "bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white shadow-lg shadow-indigo-500/25 hover:brightness-110"
  };

  return (
    <button className={`${base} ${variants[variant] || variants.primary} ${className}`} {...props}>
      {children}
    </button>
  );
}
