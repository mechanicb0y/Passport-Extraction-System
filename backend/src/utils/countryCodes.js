import { createRequire } from "node:module";
import countries from "i18n-iso-countries";

const require = createRequire(import.meta.url);
countries.registerLocale(require("i18n-iso-countries/langs/en.json"));

const icaoSpecialCodes = new Map([
  ["D", "Germany"],
  ["UNO", "United Nations Organization"],
  ["UNA", "United Nations Specialized Agency"],
  ["UNK", "Kosovo"],
  ["XKX", "Kosovo"],
  ["XXX", "Unspecified nationality"]
]);

export function normalizeCountryCode(code = "") {
  return code.replace(/</g, "").trim().toUpperCase();
}

export function lookupCountryCode(code = "") {
  const normalized = normalizeCountryCode(code);

  if (!normalized) {
    return {
      code: "",
      name: "Unknown",
      isKnown: false,
      source: "empty"
    };
  }

  if (icaoSpecialCodes.has(normalized)) {
    return {
      code: normalized,
      name: icaoSpecialCodes.get(normalized),
      isKnown: true,
      source: "icao-special"
    };
  }

  const name = countries.getName(normalized, "en", { select: "official" }) || countries.getName(normalized, "en");

  return {
    code: normalized,
    name: name || normalized,
    isKnown: Boolean(name),
    source: name ? "iso-3166-alpha-3" : "unknown"
  };
}
