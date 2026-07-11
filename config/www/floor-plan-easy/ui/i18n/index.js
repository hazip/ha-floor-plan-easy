import en from "./en.js";
import hu from "./hu.js";

// Language registry. Keys are lowercase Home Assistant language codes.
// English is the mandatory fallback and must define every key.
const TRANSLATIONS = { en, hu };

const FALLBACK = "en";

// The user's selected frontend language. `hass.locale.language` is the modern
// canonical source; `hass.language` is kept as a fallback for older cores.
function resolveLang(hass) {
  return (hass?.locale?.language || hass?.language || FALLBACK).toLowerCase();
}

// Look up `key` for the client's language, falling back to the base language
// (e.g. "pt-br" -> "pt"), then to English, then to the raw key. `params`
// values are substituted into `{token}` placeholders in the resolved string.
export function localize(key, hass, params) {
  const lang = resolveLang(hass);
  const dict = TRANSLATIONS[lang]
            || TRANSLATIONS[lang.split("-")[0]]
            || TRANSLATIONS[FALLBACK];

  let str = dict[key] ?? TRANSLATIONS[FALLBACK][key] ?? key;

  if (params) {
    for (const [k, v] of Object.entries(params)) {
      str = str.replaceAll(`{${k}}`, String(v));
    }
  }
  return str;
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Like localize(), but splits the resolved string around `{token}` placeholders
// and substitutes each with a caller-provided value (e.g. a lit template for a
// link). Returns an array of string / value parts in source order, so the
// translation controls where each token lands regardless of word order — the
// reason to prefer this over stitching several separate keys together. Unknown
// `{tokens}` are left as literal text.
export function localizeParts(key, hass, tokens) {
  const str = localize(key, hass);
  const names = Object.keys(tokens || {});
  if (!names.length) return [str];

  const re = new RegExp(`\\{(${names.map(escapeRegExp).join("|")})\\}`, "g");
  const parts = [];
  let last = 0;
  let m;
  while ((m = re.exec(str)) !== null) {
    if (m.index > last) parts.push(str.slice(last, m.index));
    parts.push(tokens[m[1]]);
    last = m.index + m[0].length;
  }
  if (last < str.length) parts.push(str.slice(last));
  return parts;
}
