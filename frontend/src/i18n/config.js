import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import hi from "./locales/hi.json";
import mr from "./locales/mr.json";
import ta from "./locales/ta.json";
import te from "./locales/te.json";
import bn from "./locales/bn.json";
import gu from "./locales/gu.json";

export const LANG_STORAGE_KEY = "janSevaLang";

const SUPPORTED = ["en", "hi", "mr", "ta", "te", "bn", "gu"];

const saved = typeof localStorage !== "undefined" ? localStorage.getItem(LANG_STORAGE_KEY) : null;

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    hi: { translation: hi },
    mr: { translation: mr },
    ta: { translation: ta },
    te: { translation: te },
    bn: { translation: bn },
    gu: { translation: gu }
  },
  lng: saved && SUPPORTED.includes(saved) ? saved : "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false }
});

i18n.on("languageChanged", (lng) => {
  try {
    localStorage.setItem(LANG_STORAGE_KEY, lng);
  } catch {
    /* ignore */
  }
  if (typeof document !== "undefined") {
    document.documentElement.lang = lng;
    document.documentElement.setAttribute("data-locale", lng);
  }
});

if (typeof document !== "undefined") {
  document.documentElement.lang = i18n.language;
  document.documentElement.setAttribute("data-locale", i18n.language);
}

export default i18n;
