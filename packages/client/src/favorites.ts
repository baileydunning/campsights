import { useCallback, useSyncExternalStore } from "react";

// Favorite campsite IDs, newest first, saved in this browser's localStorage.

const KEY = "campsights:favorites";
const EVENT = "campsights:favorites-changed";
const EMPTY: string[] = [];

let cache: string[] | null = null;

const read = (): string[] => {
  if (cache) return cache;
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    cache = Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache;
};

const write = (ids: string[]) => {
  cache = ids;
  try {
    localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    /* storage full or blocked: keep the in-memory copy for this session */
  }
  window.dispatchEvent(new Event(EVENT));
};

const subscribe = (callback: () => void) => {
  // "storage" fires when another tab changes favorites.
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      callback();
    }
  };
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", onStorage);
  };
};

export const toggleFavorite = (id: string) => {
  const ids = read();
  write(ids.includes(id) ? ids.filter((x) => x !== id) : [id, ...ids]);
};

export const useFavorites = () => {
  const ids = useSyncExternalStore(subscribe, read, () => EMPTY);
  const isFavorite = useCallback((id: string) => ids.includes(id), [ids]);
  return { ids, isFavorite, toggle: toggleFavorite };
};

// For tests
export const __resetFavorites = () => {
  cache = null;
};
