// Admin audit trail for AI Management actions. Nothing like this exists
// elsewhere in the codebase yet (existing `logs:{doctorId}` is per-doctor
// usage, not admin actions), so this is a new lightweight log store.
//
// Storage: `ai:audit:{YYYY-MM-DD}` (LIST, lpush + ltrim, bounded).

import { redis } from "./redis.js";
import { uuid, nowIso, cleanStr } from "./ai-store.js";

const MAX_PER_DAY = 1000;

function today() { return new Date().toISOString().slice(0, 10); }

export async function logAiAudit(session, action, entityType, entityId, details = "") {
  const entry = {
    id: uuid(),
    admin_username: session?.username || "unknown",
    action: cleanStr(action, 50),
    entity_type: cleanStr(entityType, 50),
    entity_id: cleanStr(entityId, 100),
    details: typeof details === "string" ? cleanStr(details, 500) : cleanStr(JSON.stringify(details), 500),
    at: nowIso(),
  };
  const key = `ai:audit:${today()}`;
  await redis.lpush(key, JSON.stringify(entry));
  await redis.ltrim(key, 0, MAX_PER_DAY - 1);
  return entry;
}

export async function readAiAudit(days = 7, limit = 200) {
  const now = new Date();
  const out = [];
  for (let i = 0; i < days && out.length < limit; i++) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    const key = `ai:audit:${d.toISOString().slice(0, 10)}`;
    const raw = await redis.lrange(key, 0, limit - 1);
    for (const s of raw || []) {
      try { out.push(typeof s === "string" ? JSON.parse(s) : s); } catch { /* skip malformed */ }
    }
  }
  return out.slice(0, limit);
}

export async function handleAiAuditAdminRoutes(req, res, path, ctx) {
  const { ok } = ctx;
  if (path === "/api/admin/ai/audit" && req.method === "GET") {
    ok(res, { rows: await readAiAudit(30, 300) });
    return true;
  }
  return false;
}

// Convenience wrapper so CRUD modules can pass a single function into
// makeCrudRoutes({ auditLog }) without importing session-shape details.
export function auditLogger(entityType) {
  return async (session, action, entityId, details) => {
    await logAiAudit(session, action, entityType, entityId, details);
  };
}
