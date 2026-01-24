let currentDomain = null;
let currentTab = null;

async function getAllowlist() {
  return (await browser.storage.local.get("allowlist")).allowlist || [];
}

async function saveAllowlist(list) {
  await browser.storage.local.set({ allowlist: list });
}

function isAllowlisted(domain, list) {
  return list.some((d) => domain === d || domain.endsWith("." + d));
}

async function render() {
  const list = await getAllowlist();
  const ul = document.getElementById("allowlistItems");
  ul.innerHTML = list
    .map((d) => `<li>${d} <button data-domain="${d}">Remove</button></li>`)
    .join("");
  document.getElementById("emptyMessage").style.display = list.length
    ? "none"
    : "block";

  const btn = document.getElementById("toggleSite");
  if (currentDomain && !currentDomain.includes("extension")) {
    document.getElementById("currentDomain").textContent = currentDomain;
    btn.textContent = isAllowlisted(currentDomain, list)
      ? "Enable on this site"
      : "Disable on this site";
    btn.disabled = false;
  } else {
    document.getElementById("currentDomain").textContent = "N/A";
    btn.disabled = true;
  }
}

async function addDomain(domain) {
  domain = domain
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .split("/")[0]
    .replace(/^www\./, "");
  if (!domain) return;
  const list = await getAllowlist();
  if (!list.includes(domain)) await saveAllowlist([...list, domain]);
  document.getElementById("newSite").value = "";
  render();
}

async function removeDomain(domain) {
  const list = await getAllowlist();
  await saveAllowlist(list.filter((d) => d !== domain));
  render();
}

document.addEventListener("DOMContentLoaded", async () => {
  [currentTab] = await browser.tabs.query({
    active: true,
    currentWindow: true,
  });
  try {
    currentDomain = new URL(currentTab.url).hostname;
  } catch {}
  render();

  document.getElementById("toggleSite").onclick = async () => {
    const list = await getAllowlist();
    const d = currentDomain.replace(/^www\./, "");
    isAllowlisted(currentDomain, list)
      ? await removeDomain(
          list.find(
            (x) => currentDomain === x || currentDomain.endsWith("." + x),
          ),
        )
      : await addDomain(d);
    browser.tabs.reload(currentTab.id);
  };

  document.getElementById("addSite").onclick = () =>
    addDomain(document.getElementById("newSite").value);
  document.getElementById("newSite").onkeydown = (e) =>
    e.key === "Enter" && addDomain(e.target.value);
  document.getElementById("allowlistItems").onclick = (e) =>
    e.target.dataset.domain && removeDomain(e.target.dataset.domain);
});
