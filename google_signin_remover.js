// Blocking Google's popup script before the HTTP request is made.
browser.webRequest.onBeforeRequest.addListener(
  () => ({ cancel: true }),
  { 
    urls: [
      'https://accounts.google.com/gsi/client/*',
      'https://accounts.google.com/gsi/client?*',
      'https://accounts.google.com/gsi/client',
      'https://static.licdn.com/aero-v1/sc/h/29rdkxlvag0d3cpj96fiilbju', // LinkedIn
      ],
    types: ["script"]  
  },
  ["blocking"],
);