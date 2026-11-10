// Service worker setup and recovery from stale builds.

const RELOAD_KEY = "campsights:chunk-reload";

const safeSession = {
  get: (k: string) => {
    try { return sessionStorage.getItem(k); } catch { return null; }
  },
  set: (k: string, v: string) => {
    try { sessionStorage.setItem(k, v); } catch { /* storage blocked */ }
  },
  remove: (k: string) => {
    try { sessionStorage.removeItem(k); } catch { /* storage blocked */ }
  },
};

export function setupPwa() {
  // After a new deploy, a tab still running the old build can ask for code
  // files that no longer exist (e.g. opening a campsite page). Reload once to
  // pick up the new build instead of showing a blank page.
  window.addEventListener("vite:preloadError", (event) => {
    if (safeSession.get(RELOAD_KEY)) return;
    safeSession.set(RELOAD_KEY, "1");
    event.preventDefault();
    window.location.reload();
  });
  window.addEventListener("load", () => setTimeout(() => safeSession.remove(RELOAD_KEY), 10000));

  if (!("serviceWorker" in navigator)) return;

  const isLocal = ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname);
  if (isLocal) {
    // Offline caching gets in the way while developing: you'd keep seeing an
    // old build. Remove any worker and caches left over from earlier runs.
    navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister()));
    if ("caches" in window) caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((err) => {
      console.warn("Service worker registration failed", err);
    });
  });
}
