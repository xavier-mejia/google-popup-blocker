const LINKEDIN_URLS = [
  "https://static.licdn.com/aero-v1/sc/h/29rdkxlvag0d3cpj96fiilbju",
  "https://static.licdn.com/sc/h/aofke6z5sqc44bjlvj6yr05c8",
];

const GOOGLE_URLS = [
  "https://accounts.google.com/gsi/client/*",
  "https://accounts.google.com/gsi/client?*",
  "https://accounts.google.com/gsi/client",
];

let allowlist = [];
browser.storage.local
  .get("allowlist")
  .then((r) => (allowlist = r.allowlist || []));
browser.storage.onChanged.addListener(
  (c) => c.allowlist && (allowlist = c.allowlist.newValue || []),
);

// Blocking Google's popup script before the HTTP request is made.
browser.webRequest.onBeforeRequest.addListener(
  (details) => {
    const origin =
      details.originUrl || details.documentUrl || details.initiator;
    if (!origin) return { cancel: true };
    try {
      const domain = new URL(origin).hostname;
      if (allowlist.some((d) => domain === d || domain.endsWith("." + d)))
        return { cancel: false };
    } catch {}
    return { cancel: true };
  },
  {
    urls: [...GOOGLE_URLS, ...LINKEDIN_URLS],
    types: ["script"],
  },
  ["blocking"],
);
