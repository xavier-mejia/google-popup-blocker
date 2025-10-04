const LINKEDIN_URLS = [
  'https://static.licdn.com/aero-v1/sc/h/29rdkxlvag0d3cpj96fiilbju',
  'https://static.licdn.com/sc/h/aofke6z5sqc44bjlvj6yr05c8'
];

const GOOGLE_URLS = [
  'https://accounts.google.com/gsi/client/*',
  'https://accounts.google.com/gsi/client?*',
  'https://accounts.google.com/gsi/client'
];

// Blocking Google's popup script before the HTTP request is made.
browser.webRequest.onBeforeRequest.addListener(
  () => ({ cancel: true }),
  {
    urls: [...GOOGLE_URLS, ...LINKEDIN_URLS],
    types: ["script"]
  },
  ["blocking"]
);