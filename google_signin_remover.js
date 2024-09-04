// Blocking Google's popup script before the HTTP request is made.
browser.webRequest.onBeforeRequest.addListener(
  () => ({ cancel: true }),
  { urls: ['https://accounts.google.com/gsi/client'], types: ["script"] },
  ["blocking"],
);