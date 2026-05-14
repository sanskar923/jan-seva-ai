/** BCP-47 tags for Web Speech API, aligned with app locales. */
const MAP = {
  en: "en-IN",
  hi: "hi-IN",
  mr: "mr-IN",
  ta: "ta-IN",
  te: "te-IN",
  bn: "bn-IN",
  gu: "gu-IN"
};

export function speechRecognitionLang(i18nLanguage) {
  const base = String(i18nLanguage || "en").split("-")[0];
  return MAP[base] || MAP.en;
}
