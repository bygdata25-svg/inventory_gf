import es from "./es.json";
import en from "./en.json";

const dictionaries = { es, en };
let currentLang = "es"; // default Spanish

export function setLanguage(lang) {
  currentLang = dictionaries[lang] ? lang : "es";
}

export function t(key, params = {}) {
  const dict = dictionaries[currentLang] || dictionaries.es;
  const value = key.split(".").reduce((o, k) => (o ? o[k] : undefined), dict) ?? key;

  return String(value).replace(/\{\{(\w+)\}\}/g, (_, p) => String(params[p] ?? ""));
}

