let currentDomain = null;
let currentTab = null;

/**
 * @typedef {Object} AllowlistEntry
 * @property {string} domain
 * @property {boolean} enabled
 */

/**
 * Retrieves the allowlist from local storage.
 * @returns {Promise<AllowlistEntry[]>}
 */
async function getAllowlist() {
  return (await browser.storage.local.get("allowlist")).allowlist || [];
}

/**
 * Saves the allowlist to local storage.
 * @param {AllowlistEntry[]} list
 * @returns {Promise<void>}
 */
async function saveAllowlist(list) {
  await browser.storage.local.set({ allowlist: list });
}

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
 * @param {string} domain
 * @param {AllowlistEntry[]} list
 * @returns {boolean}
 */
function isAllowlisted(domain, list) {
  return list.some(
    (entry) => entry.enabled && domainMatches(domain, entry.domain),
  );
}

/**
 * Checks if a URL is a regular web page (http/https).
 * @param {string | undefined} url
 * @returns {boolean}
 */
function isWebPage(url) {
  return url?.startsWith("http://") || url?.startsWith("https://");
}

/**
 * Renders the popup UI based on current state.
 * Applies search filter if present.
 * @returns {Promise<void>}
 */
async function render() {
  const list = await getAllowlist();
  const searchTerm = document.getElementById("searchSites")?.value.toLowerCase() || "";

  const filteredList = searchTerm
    ? list.filter((entry) => entry.domain.toLowerCase().includes(searchTerm))
    : list;

  const ul = document.getElementById("allowlistItems");
  ul.innerHTML = "";

  filteredList.forEach((entry) => {
    const li = document.createElement("li");
    if (!entry.enabled) {
      li.classList.add("disabled");
    }

    const isCurrentSite = currentDomain && domainMatches(currentDomain, entry.domain);
    if (isCurrentSite) {
      li.classList.add("current-site");
    }

    const domainSpan = document.createElement("span");
    domainSpan.textContent = entry.domain;
    domainSpan.className = "domain-name";
    domainSpan.title = entry.domain;
    li.appendChild(domainSpan);

    if (isCurrentSite) {
      const indicator = document.createElement("span");
      indicator.textContent = "← current site";
      indicator.className = "current-indicator";
      li.appendChild(indicator);
    }

    const controls = document.createElement("div");
    controls.className = "controls";

    const toggleBtn = document.createElement("button");
    toggleBtn.textContent = entry.enabled ? "Block" : "Allow";
    toggleBtn.className = "btn-toggle";
    toggleBtn.dataset.domain = entry.domain;
    controls.appendChild(toggleBtn);

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "Remove";
    removeBtn.className = "btn-remove";
    removeBtn.dataset.domain = entry.domain;
    controls.appendChild(removeBtn);

    li.appendChild(controls);
    ul.appendChild(li);
  });

  // Update count in heading
  const countSpan = document.getElementById("siteCount");
  countSpan.textContent = list.length > 0 ? `(${list.length})` : "";

  const emptyMsg = document.getElementById("emptyMessage");
  const noResultsMsg = document.getElementById("noResults");

  if (list.length === 0) {
    emptyMsg.style.display = "block";
    noResultsMsg.style.display = "none";
    ul.style.display = "none";
  } else if (filteredList.length === 0) {
    emptyMsg.style.display = "none";
    noResultsMsg.style.display = "block";
    ul.style.display = "none";
  } else {
    emptyMsg.style.display = "none";
    noResultsMsg.style.display = "none";
    ul.style.display = "block";
  }

  const btn = document.getElementById("toggleSite");
  if (currentDomain && isWebPage(currentTab?.url)) {
    document.getElementById("currentDomain").textContent = currentDomain;
    btn.textContent = isAllowlisted(currentDomain, list) ? "Block sign-in for this site" : "Allow sign-in for this site";
    btn.disabled = false;
  } else {
    document.getElementById("currentDomain").textContent = "N/A";
    btn.disabled = true;
  }
}

/**
 * Validates that a string is a valid domain format.
 * @param {string} domain
 * @returns {boolean}
 */
function isValidDomain(domain) {
  return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(domain);
}

/**
 * Checks if the user is currently on the given domain.
 * @param {string} domain
 * @returns {boolean}
 */
function isOnDomain(domain) {
  return currentTab && currentDomain && domainMatches(currentDomain, domain);
}

/**
 * Normalizes and adds a domain to the allowlist.
 * Shows validation errors if input is invalid.
 * Refreshes page if domain matches current site.
 * @param {string} domain
 * @returns {Promise<void>}
 */
async function addDomain(domain) {
  const input = document.getElementById("newSite");
  const feedback = document.getElementById("addFeedback");

  domain = domain
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .split("/")[0]
    .replace(/^www\./, "");

  if (!domain) {
    input.classList.add("error");
    feedback.className = "error show";
    feedback.textContent = "Please enter a domain";
    return;
  }

  if (!isValidDomain(domain)) {
    input.classList.add("error");
    feedback.className = "error show";
    feedback.textContent = "Invalid domain format (e.g., example.com)";
    return;
  }

  const list = await getAllowlist();
  if (list.some((entry) => entry.domain === domain)) {
    input.classList.add("error");
    feedback.className = "error show";
    feedback.textContent = "Domain already in list";
    return;
  }

  await saveAllowlist([...list, { domain, enabled: true }]);
  input.value = "";
  input.classList.remove("error");

  // Show success message
  feedback.className = "success show";
  feedback.textContent = "✓ Added!";
  setTimeout(() => {
    feedback.classList.remove("show");
    setTimeout(() => {
      feedback.textContent = "";
      feedback.className = "";
    }, 300); // Wait for fade-out animation
  }, 2000);

  render();

  if (isOnDomain(domain)) {
    browser.tabs.reload(currentTab.id);
  }
}

/**
 * Toggles the enabled state of a domain in the allowlist.
 * Refreshes page if domain matches current site.
 * @param {string} domain
 * @returns {Promise<void>}
 */
async function toggleDomain(domain) {
  const list = await getAllowlist();
  const entry = list.find((e) => e.domain === domain);
  if (entry) {
    entry.enabled = !entry.enabled;
    await saveAllowlist(list);
    render();

    if (isOnDomain(domain)) {
      browser.tabs.reload(currentTab.id);
    }
  }
}

/**
 * Removes a domain from the allowlist permanently.
 * Refreshes page if domain matches current site.
 * @param {string} domain
 * @returns {Promise<void>}
 */
async function removeDomain(domain) {
  const list = await getAllowlist();
  await saveAllowlist(list.filter((entry) => entry.domain !== domain));
  render();

  if (isOnDomain(domain)) {
    browser.tabs.reload(currentTab.id);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    [currentTab] = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (currentTab?.url) {
      currentDomain = new URL(currentTab.url).hostname;
    }
  } catch (e) {
    console.debug("Could not get current tab:", e.message);
  }

  render();

  document.getElementById("toggleSite").onclick = async () => {
    if (!currentTab) {
      return;
    }

    const list = await getAllowlist();
    const domainInAllowlist = list.find((entry) =>
      domainMatches(currentDomain, entry.domain),
    );

    if (domainInAllowlist) {
      await toggleDomain(domainInAllowlist.domain);
    } else {
      const domainToAdd = currentDomain.replace(/^www\./, "");
      await addDomain(domainToAdd);
    }
  };

  document.getElementById("addSite").onclick = () => addDomain(document.getElementById("newSite").value);

  document.getElementById("newSite").onkeydown = (e) => {
    if (e.key === "Enter") {
      addDomain(e.target.value);
    }
  };
  
  document.getElementById("newSite").oninput = (e) => {
    e.target.classList.remove("error");
    const feedback = document.getElementById("addFeedback");
    feedback.textContent = "";
    feedback.className = "";
  };

  document.getElementById("allowlistItems").onclick = (e) => {
    if (!e.target.dataset.domain) {
      return;
    }

    if (e.target.classList.contains("btn-toggle")) {
      toggleDomain(e.target.dataset.domain);
    } else if (e.target.classList.contains("btn-remove")) {
      const domain = e.target.dataset.domain;
      if (confirm(`Remove ${domain}?`)) {
        removeDomain(domain);
      }
    }
  };

  document.getElementById("searchSites").oninput = () => render();
});