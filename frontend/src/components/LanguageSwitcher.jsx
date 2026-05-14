import React from "react";
import { useTranslation } from "react-i18next";

const LOCALES = [
  { code: "en", labelKey: "lang.en" },
  { code: "hi", labelKey: "lang.hi" },
  { code: "mr", labelKey: "lang.mr" },
  { code: "ta", labelKey: "lang.ta" },
  { code: "te", labelKey: "lang.te" },
  { code: "bn", labelKey: "lang.bn" },
  { code: "gu", labelKey: "lang.gu" }
];

const SUPPORTED = LOCALES.map((l) => l.code);

export default function LanguageSwitcher({ className = "" }) {
  const { i18n, t } = useTranslation();
  const raw = (i18n.resolvedLanguage || i18n.language || "en").split("-")[0];
  const value = SUPPORTED.includes(raw) ? raw : "en";

  return (
    <label className={`flex items-center gap-2 ${className}`}>
      <span className="sr-only">{t("lang.label")}</span>
      <span className="hidden text-xs font-semibold text-slate-500 dark:text-slate-400 sm:inline">{t("lang.label")}</span>
      <select
        value={value}
        onChange={(e) => i18n.changeLanguage(e.target.value)}
        className="max-w-[10rem] rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-800 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 sm:max-w-none"
        aria-label={t("lang.label")}
      >
        {LOCALES.map(({ code, labelKey }) => (
          <option key={code} value={code}>
            {t(labelKey)}
          </option>
        ))}
      </select>
    </label>
  );
}
