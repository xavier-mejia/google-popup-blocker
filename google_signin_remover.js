const LINKEDIN_URLS = [
  "https://static.licdn.com/aero-v1/sc/h/29rdkxlvag0d3cpj96fiilbju",
  "https://static.licdn.com/sc/h/aofke6z5sqc44bjlvj6yr05c8",
];

const GOOGLE_URLS = [
  "https://accounts.google.com/gsi/client/*",
  "https://accounts.google.com/gsi/client?*",
  "https://accounts.google.com/gsi/client",
];

/**
 * Checks if a domain matches a pattern (exact match or subdomain).
 * @param {string} domain - The domain to check (e.g., "www.example.com")
 * @param {string} pattern - The pattern to match against (e.g., "example.com")
 * @returns {boolean}
 */
function domainMatches(domain, pattern) {
  return domain === pattern || domain.endsWith("." + pattern);
}

/**
 * Checks if a domain is in the allowlist and enabled.
 * @param {string} domain - The requesting domain
 * @param {Array<{domain: string, enabled: boolean}>} allowlist
 * @returns {boolean}
 */
function isDomainAllowed(domain, allowlist) {
  return allowlist.some(
    (entry) => entry.enabled && domainMatches(domain, entry.domain),
  );
}

/**
 * Intercepts sign-in script requests and blocks them unless the requesting
 * domain is in the allowlist with enabled status.
 */
browser.webRequest.onBeforeRequest.addListener(
  async (details) => {
    const requestOrigin = details.originUrl || details.documentUrl;
    if (!requestOrigin) {
      return { cancel: true };
    }

    let requestingDomain;
    try {
      requestingDomain = new URL(requestOrigin).hostname;
    } catch {
      return { cancel: true };
    }

    const { allowlist = [] } = await browser.storage.local.get("allowlist");
    if (isDomainAllowed(requestingDomain, allowlist)) {
      return { cancel: false };
    }

    return { cancel: true };
  },
  {
    urls: [...GOOGLE_URLS, ...LINKEDIN_URLS],
    types: ["script"],
  },
  ["blocking"],
);