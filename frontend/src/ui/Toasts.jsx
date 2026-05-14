import React from "react";

const styles = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-100",
  error: "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-100",
  info: "border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900/40 dark:bg-sky-900/20 dark:text-sky-100"
};

export default function Toasts({ toasts }) {
  return (
    <div className="fixed right-4 top-4 z-50 flex w-[min(92vw,420px)] flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`rounded-xl border px-4 py-3 shadow-soft backdrop-blur ${styles[t.variant] || styles.info}`}
        >
          <div className="text-sm font-medium">{t.message}</div>
        </div>
      ))}
    </div>
  );
}

