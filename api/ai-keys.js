// Encrypted API keys for the new AI Management system, scoped per
// CONNECTOR (api/ai-connectors.js) rather than a fixed provider string -
// this is what lets an admin run two OpenRouter keys (e.g. primary +
// failover) or one key per self-hosted endpoint. Deliberately a separate
// namespace from the legacy `api_key:{id}` (Groq/Gemini, plaintext,
// api/index.js) - not touched, not migrated.
//
// Storage: ai:apikey:{id} + ai:apikeys:index
// Secret fields (enc_data/enc_iv/enc_tag) never leave this module in plain
// text; callers get `has_key` + masked hint only.

import { makeStore, cleanStr } from "./ai-store.js";
import { encryptSecret, decryptSecret, maskSecret, secretsConfigured } from "./crypto-secrets.js";
import { auditLogger } from "./ai-audit.js";
import { listConnectors, getConnector } from "./ai-connectors.js";

function ensureKeyDefaults(row) {
  row.name = cleanStr(row.name, 150) || "API key";
  row.connector_id = cleanStr(row.connector_id, 100);
  if (typeof row.active !== "boolean") row.active = true;
  row.enc_data = row.enc_data || "";
  row.enc_iv = row.enc_iv || "";
  row.enc_tag = row.enc_tag || "";
  row.rotated_at = row.rotated_at || null;
  return row;
}

const keyStore = makeStore({
  keyPrefix: "ai:apikey",
  indexKey: "ai:apikeys:index",
  cacheKey: "ai_apikeys",
  ensureDefaults: ensureKeyDefaults,
  sortFn: (a, b) => a.name.localeCompare(b.name),
});

export async function getDecryptedKey(id) {
  const row = await keyStore.get(id);
  if (!row) return null;
  return decryptSecret(row);
}

export async function listApiKeysForConnector(connectorId) {
  const rows = await keyStore.list();
  return rows.filter((r) => r.connector_id === connectorId && r.active);
}

async function publicKeyState(row, connectorMap) {
  const plain = decryptSecret(row);
  const connectorName = connectorMap
    ? (connectorMap[row.connector_id]?.name || "")
    : ((await getConnector(row.connector_id))?.name || "");
  return {
    id: row.id,
    name: row.name,
    connector_id: row.connector_id,
    connector_name: connectorName,
    active: row.active,
    has_key: Boolean(row.enc_data),
    key_hint: plain ? maskSecret(plain) : "",
    rotated_at: row.rotated_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function handleAiKeysAdminRoutes(req, res, path, ctx) {
  const { readJson, ok, err, session } = ctx;
  const audit = auditLogger("apikey");

  if (path === "/api/admin/ai/keys" && req.method === "GET") {
    const connectors = await listConnectors();
    const connectorMap = Object.fromEntries(connectors.map((c) => [c.id, c]));
    ok(res, { rows: await Promise.all((await keyStore.list()).map((r) => publicKeyState(r, connectorMap))), secrets_configured: secretsConfigured() });
    return true;
  }

  if (path === "/api/admin/ai/keys" && req.method === "POST") {
    if (!secretsConfigured()) { err(res, 503, "AI_SECRETS_KEY non configurée côté serveur."); return true; }
    const body = await readJson(req);
    const secret = cleanStr(body.api_key, 500);
    if (!secret) { err(res, 400, "api_key requis"); return true; }
    if (!cleanStr(body.connector_id, 100)) { err(res, 400, "connector_id requis"); return true; }
    const row = ensureKeyDefaults({ ...body, ...encryptSecret(secret) });
    const created = await keyStore.create(row);
    await audit(session, "create", created.id, { name: created.name, connector_id: created.connector_id });
    ok(res, { row: await publicKeyState(created) }, 201);
    return true;
  }

  const match = path.match(/^\/api\/admin\/ai\/keys\/([a-f0-9-]+)$/);
  if (match && (req.method === "PATCH" || req.method === "PUT")) {
    const existing = await keyStore.get(match[1]);
    if (!existing) { err(res, 404, "Clé introuvable"); return true; }
    const body = await readJson(req);
    let updated = ensureKeyDefaults({ ...existing, ...body, id: existing.id, enc_data: existing.enc_data, enc_iv: existing.enc_iv, enc_tag: existing.enc_tag });
    if (body.api_key) {
      if (!secretsConfigured()) { err(res, 503, "AI_SECRETS_KEY non configurée côté serveur."); return true; }
      Object.assign(updated, encryptSecret(cleanStr(body.api_key, 500)));
    }
    await keyStore.save(updated);
    await audit(session, "update", existing.id, { name: updated.name });
    ok(res, { row: await publicKeyState(updated) });
    return true;
  }

  if (match && req.method === "DELETE") {
    await keyStore.remove(match[1]);
    await audit(session, "delete", match[1], {});
    ok(res, { ok: true });
    return true;
  }

  // Key rotation: re-encrypt with a new secret value in one step, keeping
  // the record's id/name/connector (so router rules and models referencing
  // this connector keep working), while stamping rotated_at for the
  // security/audit trail. Distinct from PATCH so the intent ("I rotated
  // this credential") is explicit in the audit log rather than a generic
  // "update".
  const rotateMatch = path.match(/^\/api\/admin\/ai\/keys\/([a-f0-9-]+)\/rotate$/);
  if (rotateMatch && req.method === "POST") {
    if (!secretsConfigured()) { err(res, 503, "AI_SECRETS_KEY non configurée côté serveur."); return true; }
    const existing = await keyStore.get(rotateMatch[1]);
    if (!existing) { err(res, 404, "Clé introuvable"); return true; }
    const body = await readJson(req);
    const secret = cleanStr(body.api_key, 500);
    if (!secret) { err(res, 400, "Nouvelle valeur api_key requise pour la rotation"); return true; }
    const updated = ensureKeyDefaults({ ...existing, ...encryptSecret(secret), rotated_at: new Date().toISOString() });
    await keyStore.save(updated);
    await audit(session, "rotate", existing.id, { name: existing.name });
    ok(res, { row: await publicKeyState(updated) });
    return true;
  }

  return false;
}
