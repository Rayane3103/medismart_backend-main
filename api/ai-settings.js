// Global AI settings: default disclaimer text, default timeouts/retries used
// when a model doesn't specify its own, and the safety-note strings the
// desktop app already expects verbatim in responses.
//
// Storage: single JSON blob at ai:settings (no index needed - singleton).

import { redis } from "./redis.js";
import { cleanStr, nowIso } from "./ai-store.js";
import { auditLogger } from "./ai-audit.js";

const DEFAULTS = {
  safety_note: "Analyse IA a verifier par le medecin. Aucun diagnostic ou prescription automatique.",
  default_timeout_ms: 60000,
  default_retry: 1,
  playground_enabled: true,
  // Response cache is opt-in (feature flag "ai_response_cache_enabled");
  // this only controls how long a hit stays valid once that flag is on.
  response_cache_ttl_seconds: 120,
};

export async function getAiSettings() {
  const stored = await redis.get("ai:settings");
  return { ...DEFAULTS, ...(stored || {}) };
}

async function saveAiSettings(row) {
  row.updated_at = nowIso();
  await redis.set("ai:settings", row);
}

export async function handleAiSettingsAdminRoutes(req, res, path, ctx) {
  const { readJson, ok, session } = ctx;
  if (path !== "/api/admin/ai/settings") return false;

  if (req.method === "GET") {
    ok(res, { settings: await getAiSettings() });
    return true;
  }

  if (req.method === "PATCH" || req.method === "PUT") {
    const body = await readJson(req);
    const current = await getAiSettings();
    const updated = {
      ...current,
      safety_note: body.safety_note !== undefined ? cleanStr(body.safety_note, 500) : current.safety_note,
      default_timeout_ms: Number.isFinite(+body.default_timeout_ms) ? Math.max(1000, Math.round(+body.default_timeout_ms)) : current.default_timeout_ms,
      default_retry: Number.isFinite(+body.default_retry) ? Math.max(0, Math.round(+body.default_retry)) : current.default_retry,
      playground_enabled: body.playground_enabled !== undefined ? !!body.playground_enabled : current.playground_enabled,
      response_cache_ttl_seconds: Number.isFinite(+body.response_cache_ttl_seconds) ? Math.max(5, Math.round(+body.response_cache_ttl_seconds)) : current.response_cache_ttl_seconds,
    };
    await saveAiSettings(updated);
    await auditLogger("settings")(session, "update", "-", updated);
    ok(res, { settings: updated });
    return true;
  }

  return false;
}
