export function cacheUtils<T>(cache: Map<string, { timestamp: number }>, ttl: number) {
  return () => {
    const now = Date.now();
    for (const [key, entry] of cache.entries()) {
      if (now - entry.timestamp > ttl) {
        cache.delete(key);
      }
    }
  };
}