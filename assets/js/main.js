const script = document.currentScript;
const BASE = new URL(script.dataset.base, location.origin).pathname;

// Mobile navigation toggle
const toggle = document.querySelector(".nav-toggle");
const nav = document.getElementById("site-nav");
function setNavOpen(open) {
  if (!toggle || !nav) return;
  toggle.setAttribute("aria-expanded", String(open));
  nav.classList.toggle("is-open", open);
}
toggle?.addEventListener("click", () => setNavOpen(toggle.getAttribute("aria-expanded") !== "true"));

// Static site: forms open the visitor's mail client with a pre-filled message.
// Delegated so it keeps working after in-page navigation swaps the content.
document.addEventListener("submit", (event) => {
  const form = event.target.closest("form[data-mailto]");
  if (!form) return;
  event.preventDefault();
  const lines = [];
  for (const [key, value] of new FormData(form)) {
    if (String(value).trim()) lines.push(`${key} : ${value}`);
  }
  const subject = encodeURIComponent(form.dataset.subject);
  const body = encodeURIComponent(`Bonjour,\n\n${lines.join("\n")}\n\nMerci !`);
  window.location.href = `mailto:${form.dataset.mailto}?subject=${subject}&body=${body}`;
});

// In-page navigation: fetch the next page and swap only <main>, so the header,
// footer, CSS and fonts stay in place instead of reloading the whole document.
const pages = new Map();
let currentPath = location.pathname;

function isInternalPage(url) {
  return url.origin === location.origin
    && url.pathname.startsWith(BASE)
    && !/\.[a-z0-9]+$/i.test(url.pathname.replace(/\/index\.html$/, "/"));
}

function linkTarget(a) {
  if (!a || a.target || a.hasAttribute("download")) return null;
  const url = new URL(a.href, location.href);
  return isInternalPage(url) ? url : null;
}

function fetchPage(url) {
  const key = url.pathname;
  if (!pages.has(key)) {
    const request = fetch(key, { credentials: "same-origin" })
      .then((res) => {
        if (!res.ok || !res.headers.get("content-type")?.includes("text/html")) throw new Error(res.status);
        return res.text();
      })
      .catch((err) => { pages.delete(key); throw err; });
    pages.set(key, request);
  }
  return pages.get(key);
}

// Wait (briefly) for the images visible at the top of the new page so they
// don't pop in after the swap.
function decodeEagerImages(doc) {
  const imgs = [...doc.querySelectorAll("main img:not([loading='lazy'])")].map((img) => {
    const probe = new Image();
    probe.src = img.src;
    return probe.decode().catch(() => {});
  });
  return Promise.race([Promise.all(imgs), new Promise((r) => setTimeout(r, 400))]);
}

function updateNav(pathname) {
  document.querySelectorAll(".site-nav ul a").forEach((a) => {
    const current = new URL(a.href).pathname === pathname;
    if (current) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
}

async function navigate(url, { push = true, scroll = 0 } = {}) {
  let html;
  try {
    html = await fetchPage(url);
  } catch {
    location.href = url.href;
    return;
  }
  const doc = new DOMParser().parseFromString(html, "text/html");
  const nextMain = doc.querySelector("main");
  if (!nextMain) { location.href = url.href; return; }
  await decodeEagerImages(doc);

  const swap = () => {
    if (push) {
      history.replaceState({ scroll: window.scrollY }, "");
      history.pushState({ scroll: 0 }, "", url.href);
    }
    document.querySelector("main").replaceWith(document.adoptNode(nextMain));
    document.title = doc.title;
    const desc = doc.querySelector('meta[name="description"]')?.content;
    if (desc) document.querySelector('meta[name="description"]')?.setAttribute("content", desc);
    currentPath = url.pathname;
    updateNav(url.pathname);
    setNavOpen(false);
    const anchor = url.hash && document.getElementById(decodeURIComponent(url.hash.slice(1)));
    if (anchor) anchor.scrollIntoView();
    else window.scrollTo(0, scroll);
    document.querySelector("main").focus({ preventScroll: true });
  };

  if (document.startViewTransition && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.startViewTransition(swap);
  } else {
    swap();
  }
}

document.addEventListener("click", (event) => {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const a = event.target.closest("a[href]");
  const url = linkTarget(a);
  if (!url) return;
  // Same page, only the hash differs: let the browser scroll.
  if (url.pathname === location.pathname && url.hash) return;
  event.preventDefault();
  if (url.pathname === location.pathname) { setNavOpen(false); window.scrollTo({ top: 0, behavior: "smooth" }); return; }
  navigate(url);
});

window.addEventListener("popstate", (event) => {
  if (location.pathname === currentPath) return;
  navigate(new URL(location.href), { push: false, scroll: event.state?.scroll ?? 0 });
});
history.scrollRestoration = "manual";

// Prefetch on hover / touch so the page is usually ready before the click.
function prefetch(event) {
  const url = linkTarget(event.target.closest?.("a[href]"));
  if (url && url.pathname !== location.pathname) fetchPage(url).catch(() => {});
}
document.addEventListener("pointerover", prefetch, { passive: true });
document.addEventListener("touchstart", prefetch, { passive: true });
document.addEventListener("focusin", prefetch);

// Cache pages and assets on the device (images, fonts, CSS) for instant repeat visits.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(script.dataset.sw, { scope: BASE }).catch(() => {});
  });
}
