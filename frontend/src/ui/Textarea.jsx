import React from "react";

export default function Textarea({ label, className = "", ...props }) {
  return (
    <label className="block">
      {label ? <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">{label}</div> : null}
      <textarea
        className={`min-h-[110px] w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 dark:border-slate-800 dark:bg-slate-950 dark:focus:border-slate-600 ${className}`}
        {...props}
      />
    </label>
  );
}

