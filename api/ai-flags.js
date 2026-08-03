// Feature flags for AI Management (e.g. gate a new model/prompt rollout).
// Storage: ai:flag:{key} (hash-like JSON) + ai:flags:index (SET of keys).

import { redis, cached, invalidate, mgetExisting } from "./redis.js";
import { cleanStr, nowIso } from "./ai-store.js";
import { auditLogger } from "./ai-audit.js";

function ensureFlagDefaults(row) {
  row.key = cleanStr(row.key, 100);
  row.description = cleanStr(row.description, 300);
  if (typeof row.enabled !== "boolean") row.enabled = false;
  row.rollout_pct = Number.isFinite(+row.rollout_pct) ? Math.min(100, Math.max(0, Math.round(+row.rollout_pct))) : 100;
  return row;
}

async function listFlags() {
  return cached("ai_flags", async () => {
    const keys = (await redis.smembers("ai:flags:index")) || [];
    const rows = await mgetExisting(keys.map((k) => `ai:flag:${k}`));
    return rows.map((r) => ensureFlagDefaults({ ...r })).sort((a, b) => a.key.localeCompare(b.key));
  });
}

async function getFlag(key) {
  const row = await redis.get(`ai:flag:${key}`);
  return row ? ensureFlagDefaults({ ...row }) : null;
}

async function saveFlag(row) {
  row.updated_at = nowIso();
  await redis.set(`ai:flag:${row.key}`, row);
  invalidate("ai_flags");
}

export async function isFlagEnabled(key) {
  const flag = await getFlag(key);
  return Boolean(flag?.enabled);
}

// Used by the AI brain's kill-switch checks (global + per-task): a flag that
// was never created should never block traffic, only one an admin explicitly
// switched off. Distinct from isFlagEnabled(), which treats "missing" as off
// (correct for opt-in rollout flags, wrong for a kill switch default).
export async function isFlagDisabled(key) {
  const flag = await getFlag(key);
  return flag ? flag.enabled === false : false;
}

// Global kill switch for the AI brain, checked on every doctor-facing
// request (see api/ai-brain.js). Seeded ON so a fresh deployment isn't
// silently blocked before an admin ever visits the Feature Flags view.
export const GLOBAL_BRAIN_FLAG = "ai_brain_enabled";

export async function seedFlagDefaults() {
  const existing = await getFlag(GLOBAL_BRAIN_FLAG);
  if (existing) return false;
  const row = ensureFlagDefaults({ key: GLOBAL_BRAIN_FLAG, description: "Coupe-circuit global du brain IA (toutes tâches).", enabled: true, created_at: nowIso() });
  await saveFlag(row);
  await redis.sadd("ai:flags:index", GLOBAL_BRAIN_FLAG);
  invalidate("ai_flags");
  return true;
}

export async function handleAiFlagsAdminRoutes(req, res, path, ctx) {
  await seedFlagDefaults();
  const { readJson, ok, err, session } = ctx;
  const audit = auditLogger("flag");

  if (path === "/api/admin/ai/flags" && req.method === "GET") {
    ok(res, { rows: await listFlags() });
    return true;
  }

  if (path === "/api/admin/ai/flags" && req.method === "POST") {
    const body = await readJson(req);
    const key = cleanStr(body.key, 100);
    if (!key) { err(res, 400, "key requis"); return true; }
    const row = ensureFlagDefaults({ ...body, key, created_at: nowIso() });
    await saveFlag(row);
    await redis.sadd("ai:flags:index", key);
    await audit(session, "create", key, body);
    ok(res, { row }, 201);
    return true;
  }

  const match = path.match(/^\/api\/admin\/ai\/flags\/([^/]+)$/);
  if (match && (req.method === "PATCH" || req.method === "PUT")) {
    const existing = await getFlag(decodeURIComponent(match[1]));
    if (!existing) { err(res, 404, "Flag introuvable"); return true; }
    const body = await readJson(req);
    const updated = ensureFlagDefaults({ ...existing, ...body, key: existing.key });
    await saveFlag(updated);
    await audit(session, "update", existing.key, body);
    ok(res, { row: updated });
    return true;
  }

  if (match && req.method === "DELETE") {
    const key = decodeURIComponent(match[1]);
    await redis.del(`ai:flag:${key}`);
    await redis.srem("ai:flags:index", key);
    invalidate("ai_flags");
    await audit(session, "delete", key, {});
    ok(res, { ok: true });
    return true;
  }

  return false;
}
