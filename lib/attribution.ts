export const attributionKeys = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "fbclid",
  "gclid",
  "ttclid",
] as const;

export type Attribution = Partial<Record<(typeof attributionKeys)[number], string>> & {
  landing_url?: string;
  referrer?: string;
};

const storageKey = "volta-attribution";

export function readAttribution(): Attribution {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(storageKey) || "{}") as Attribution; }
  catch { return {}; }
}

export function captureAttribution(): Attribution {
  if (typeof window === "undefined") return {};
  const stored = readAttribution();
  const params = new URLSearchParams(window.location.search);
  const captured = Object.fromEntries(attributionKeys.map(key => [key, params.get(key) || stored[key] || ""]));
  const attribution: Attribution = {
    ...stored,
    ...captured,
    landing_url: stored.landing_url || window.location.href,
    referrer: stored.referrer || document.referrer || "direct",
  };
  localStorage.setItem(storageKey, JSON.stringify(attribution));
  return attribution;
}

export function appendAttribution(url: URL) {
  const attribution = captureAttribution();
  for (const key of attributionKeys) if (attribution[key]) url.searchParams.set(key, attribution[key]!);
  return url;
}
