import React from "react";

export default function Input({ label, className = "", ...props }) {
  return (
    <label className="block">
      {label ? <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">{label}</div> : null}
      <input
        className={`w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-0 focus:border-slate-400 dark:border-slate-800 dark:bg-slate-950 dark:focus:border-slate-600 ${className}`}
        {...props}
      />
    </label>
  );
}

