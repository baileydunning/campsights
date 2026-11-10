var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/index.ts
var ALLOWED_ORIGINS = [
  "https://campsights.guide",
  "https://www.campsights.guide",
  "http://localhost:5173",
  "http://localhost:8787"
];
var UPSTREAM_HEADERS = {
  Accept: "application/geo+json, application/json",
  // weather.gov rejects requests without a User-Agent.
  "User-Agent": "campsights.guide"
};
var json = /* @__PURE__ */ __name((body, status = 200, extra = {}) => new Response(JSON.stringify(body), {
  status,
  headers: { "Content-Type": "application/json", ...extra }
}), "json");
var src_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname } = url;
    if (url.hostname === "www.campsights.guide") {
      url.hostname = "campsights.guide";
      return Response.redirect(url.toString(), 301);
    }
    if (pathname === "/health") {
      return json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
    }
    if (pathname === "/docs" || pathname === "/docs/") {
      return new Response(DOCS_HTML, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }
    if (pathname.startsWith("/api/")) {
      const origin = request.headers.get("Origin");
      if (origin && !ALLOWED_ORIGINS.includes(origin)) {
        return json({ error: "API access denied: invalid origin" }, 403);
      }
      if (request.method !== "GET") return json({ error: "Method Not Allowed" }, 405);
      if (pathname === "/api/v1/campsites" || pathname === "/api/v1/campsites/") {
        return getCampsites(request, env);
      }
      const match = pathname.match(/^\/api\/v1\/campsites\/([^/]+)\/?$/);
      if (match) return getCampsiteById(decodeURIComponent(match[1]), request, env);
    }
    return json({ error: "Not Found" }, 404);
  }
};
async function getCampsites(request, env) {
  const res = await env.ASSETS.fetch(new URL("/data/campsites.json", request.url));
  if (!res.ok) return json({ error: "Unable to fetch campsites" }, 500);
  return new Response(res.body, {
    headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=3600" }
  });
}
__name(getCampsites, "getCampsites");
async function getCampsiteById(id, request, env) {
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
    return json({ error: "id is required and must be a string" }, 400);
  }
  const res = await env.ASSETS.fetch(new URL(`/data/campsites/${id}.json`, request.url));
  if (!res.ok || !res.headers.get("Content-Type")?.includes("json")) {
    return json({ error: "Campsite not found" }, 404);
  }
  const site = await res.json();
  const [weather, elevation] = await Promise.all([
    getWeather(site.lat, site.lng),
    site.elevation != null ? Promise.resolve(site.elevation) : getElevation(site.lat, site.lng)
  ]);
  return json({ ...site, elevation, weather }, 200, { "Cache-Control": "public, max-age=600" });
}
__name(getCampsiteById, "getCampsiteById");
async function getWeather(lat, lng) {
  try {
    const points = await fetch(`https://api.weather.gov/points/${round(lat, 4)},${round(lng, 4)}`, {
      headers: UPSTREAM_HEADERS,
      signal: AbortSignal.timeout(8e3),
      cf: { cacheTtl: 86400, cacheEverything: true }
    });
    if (!points.ok) throw new Error(`Points API ${points.status}`);
    const forecastUrl = (await points.json())?.properties?.forecast;
    if (!forecastUrl) throw new Error("No forecast URL");
    const forecast = await fetch(forecastUrl, {
      headers: UPSTREAM_HEADERS,
      signal: AbortSignal.timeout(8e3),
      cf: { cacheTtl: 600, cacheEverything: true }
    });
    if (!forecast.ok) throw new Error(`Forecast API ${forecast.status}`);
    return (await forecast.json())?.properties?.periods ?? [];
  } catch (err) {
    console.error("Weather fetch error", lat, lng, err);
    return [];
  }
}
__name(getWeather, "getWeather");
async function getElevation(lat, lng) {
  try {
    const res = await fetch(
      `https://api.open-elevation.com/api/v1/lookup?locations=${round(lat, 4)},${round(lng, 4)}`,
      {
        headers: UPSTREAM_HEADERS,
        signal: AbortSignal.timeout(6e3),
        cf: { cacheTtl: 2592e3, cacheEverything: true }
      }
    );
    if (!res.ok) throw new Error(`Elevation API ${res.status}`);
    return (await res.json())?.results?.[0]?.elevation ?? null;
  } catch (err) {
    console.error("Elevation fetch error", lat, lng, err);
    return null;
  }
}
__name(getElevation, "getElevation");
var round = /* @__PURE__ */ __name((n, places) => Math.round(n * 10 ** places) / 10 ** places, "round");
var DOCS_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Campsights API Docs</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.17.14/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.17.14/swagger-ui-bundle.js"><\/script>
  <script>SwaggerUIBundle({ url: '/openapi.yaml', dom_id: '#swagger-ui' });<\/script>
</body>
</html>`;

// ../../../.npm/_npx/3750d4a998b75d79/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../../.npm/_npx/3750d4a998b75d79/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-EU5iP1/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// ../../../.npm/_npx/3750d4a998b75d79/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-EU5iP1/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
