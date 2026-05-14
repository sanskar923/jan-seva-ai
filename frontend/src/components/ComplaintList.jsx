import React from "react";
import { useTranslation } from "react-i18next";
import Card from "../ui/Card.jsx";
import Button from "../ui/Button.jsx";
import { uploadsUrl } from "../lib/apiOrigin.js";
import { statusI18nKey } from "../lib/labels.js";

function badgeClass(kind) {
  const map = {
    High: "bg-rose-100 text-rose-900 dark:bg-rose-900/30 dark:text-rose-100",
    Medium: "bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-100",
    Low: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-100"
  };
  return map[kind] || "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100";
}

function confidenceLabel(v) {
  if (v === undefined || v === null || Number.isNaN(Number(v))) return null;
  const n = Math.round(Number(v) * 100);
  return `${n}%`;
}

export default function ComplaintList({ title, complaints, onDelete, deletingId }) {
  const { t, i18n } = useTranslation();
  const listTitle = title === undefined ? t("list.yourComplaints") : title;

  return (
    <Card glass className="p-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-base font-extrabold">{listTitle}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {t("list.showing", { count: complaints.length, defaultValue: `${complaints.length} complaints` })}
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        {complaints.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">
            {t("list.empty")}
          </div>
        ) : (
          complaints.map((c) => (
            <div
              key={c.id}
              className="rounded-3xl border border-slate-200/80 bg-white/50 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/35"
            >
              {/* --- NEW: CITIZEN PROFILE HEADER --- */}
              {(c.fullname || c.occupation || c.location) && (
                <div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f9a61a] text-xs font-black text-white">
                      {c.fullname?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div>
                      <div className="text-sm font-black text-slate-900 dark:text-white">
                        {c.fullname || c.username}
                      </div>
                      <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-tight text-slate-500">
                        <span>💼 {c.occupation || "Citizen"}</span>
                        <span className="text-[#f9a61a]">• {c.employmentType || "Private"}</span>
                      </div>
                    </div>
                  </div>
                  {c.location && (
                    <div className="rounded-xl bg-emerald-50 px-3 py-1.5 text-[10px] font-black uppercase text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
                      📍 {c.location}
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  {c.ticketId ? (
                    <span className="rounded-lg bg-indigo-500/15 px-2 py-1 font-mono text-[11px] font-bold text-indigo-900 dark:text-indigo-100">
                      {t("list.ticket")}: {c.ticketId}
                    </span>
                  ) : null}
                  <div className="text-sm font-bold">
                    {t(`categories.${c.category}`, { defaultValue: c.category })}
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {t(`methods.${c.method || "text"}`, { defaultValue: c.method || "text" })}
                  </span>
                  {confidenceLabel(c.confidence) ? (
                    <span className="rounded-full bg-indigo-500/10 px-2 py-1 text-[11px] font-bold text-indigo-800 dark:text-indigo-200">
                      {t("list.aiPrefix")} {confidenceLabel(c.confidence)}
                    </span>
                  ) : null}
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2 py-1 text-xs font-bold ${badgeClass(c.urgency)}`}>
                    {t(`urgency.${c.urgency}`, { defaultValue: c.urgency })}
                  </span>
                  <span className="rounded-full bg-slate-900 px-2 py-1 text-xs font-bold text-white dark:bg-slate-100 dark:text-slate-900">
                    {t(`status.${statusI18nKey(c.status)}`, { defaultValue: c.status })}
                  </span>
                  {onDelete ? (
                    <Button
                      type="button"
                      variant="danger"
                      className="!px-3 !py-1.5 text-[10px] font-black uppercase tracking-widest"
                      disabled={deletingId === c.id}
                      onClick={() => onDelete(c.id)}
                    >
                      {t("list.delete")}
                    </Button>
                  ) : null}
                </div>
              </div>

              {c.summary && c.summary !== c.text ? (
                <div className="mt-4 rounded-2xl bg-slate-50 p-3 dark:bg-slate-900/50">
                  <div className="text-[10px] font-black uppercase tracking-widest text-[#f9a61a]">{t("list.summary")}</div>
                  <div className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-200">{c.summary}</div>
                </div>
              ) : null}

              <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {c.text}
              </div>

              {c.imageUrl ? (
                <div className="mt-4">
                  <img
                    alt={t("list.complaintAttachmentAlt")}
                    src={uploadsUrl(c.imageUrl)}
                    className="max-h-72 w-full rounded-2xl border border-slate-200 object-cover shadow-sm dark:border-slate-800"
                  />
                </div>
              ) : null}

              {Array.isArray(c.topLabels) && c.topLabels.length ? (
                <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-bold text-slate-400">
                  <span className="text-slate-500">{t("list.modelCues")}</span>
                  {c.topLabels
                    .slice(0, 4)
                    .map((x, idx) => (
                      <span key={idx} className="rounded-md bg-slate-100 px-1.5 py-0.5 dark:bg-slate-800">
                        {x.label} ({Math.round((x.score || 0) * 100)}%)
                      </span>
                    ))}
                </div>
              ) : null}

              <div className="mt-4 flex items-center justify-between border-t border-slate-50 pt-3 text-[10px] font-bold text-slate-400 dark:border-slate-900">
                <div>
                  {t("list.submittedBy")} <span className="text-slate-600 dark:text-slate-300">{c.username}</span>
                </div>
                <div>
                  {new Date(c.createdAt).toLocaleString([i18n.language, "en"], {
                    dateStyle: "medium",
                    timeStyle: "short"
                  })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}