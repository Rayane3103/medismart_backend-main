// Provider connectors: what makes "unlimited providers" real instead of a
// fixed enum. A connector is one configured endpoint of a given wire
// protocol TYPE (there are only a handful of real HTTP contracts - OpenAI-
// compatible, Anthropic Messages, Google Gemini, and a local/self-hosted
// OpenAI-compatible server) - but admins can create as many connector
// RECORDS as they want (OpenRouter, OpenAI direct, a second OpenRouter key
// for failover, Together.ai, a self-hosted vLLM box, a local Ollama
// instance, ...). Models (api/ai-models.js) reference a connector_id rather
// than a hardcoded provider string.
//
// Storage: ai:connector:{id} + ai:connectors:index

import { makeStore, makeCrudRoutes, cleanStr, nowIso } from "./ai-store.js";
import { auditLogger } from "./ai-audit.js";
import { redis } from "./redis.js";
import { getDecryptedKey, listApiKeysForConnector } from "./ai-keys.js";
import { createModel, listModelsForConnector } from "./ai-models.js";

export const CONNECTOR_TYPES = ["openai_compatible", "anthropic", "gemini", "local"];
const HEALTH_STATUSES = ["unknown", "healthy", "unhealthy"];

const SEED_CONNECTORS = [
  { name: "OpenRouter", type: "openai_compatible", base_url: "https://openrouter.ai/api/v1", enabled: true, priority: 100, timeout_ms: 60000, retries: 1 },
  { name: "OpenAI", type: "openai_compatible", base_url: "https://api.openai.com/v1", enabled: true, priority: 100, timeout_ms: 60000, retries: 1 },
  { name: "Azure OpenAI", type: "openai_compatible", base_url: "", enabled: true, priority: 100, timeout_ms: 60000, retries: 1, azure_api_version: "2024-08-01-preview" },
  { name: "Groq", type: "openai_compatible", base_url: "https://api.groq.com/openai/v1", enabled: true, priority: 100, timeout_ms: 30000, retries: 1 },
  { name: "Anthropic", type: "anthropic", base_url: "https://api.anthropic.com/v1", enabled: true, priority: 100, timeout_ms: 60000, retries: 1 },
  { name: "Google Gemini", type: "gemini", base_url: "https://generativelanguage.googleapis.com/v1beta/models", enabled: true, priority: 100, timeout_ms: 60000, retries: 1 },
];

function ensureConnectorDefaults(row) {
  row.name = cleanStr(row.name, 150) || "Connector";
  row.type = CONNECTOR_TYPES.includes(row.type) ? row.type : "openai_compatible";
  row.base_url = cleanStr(row.base_url, 500);
  row.azure_api_version = cleanStr(row.azure_api_version, 50);
  if (typeof row.enabled !== "boolean") row.enabled = true;
  row.priority = Number.isFinite(+row.priority) ? Math.max(0, Math.round(+row.priority)) : 100;
  row.timeout_ms = Number.isFinite(+row.timeout_ms) ? Math.min(180000, Math.max(1000, Math.round(+row.timeout_ms))) : 60000;
  row.retries = Number.isFinite(+row.retries) ? Math.min(5, Math.max(0, Math.round(+row.retries))) : 1;
  row.health_status = HEALTH_STATUSES.includes(row.health_status) ? row.health_status : "unknown";
  row.last_checked_at = row.last_checked_at || null;
  row.last_error = cleanStr(row.last_error, 500);
  row.last_latency_ms = Number.isFinite(+row.last_latency_ms) ? +row.last_latency_ms : null;
  return row;
}

const connectorStore = makeStore({
  keyPrefix: "ai:connector",
  indexKey: "ai:connectors:index",
  cacheKey: "ai_connectors",
  ensureDefaults: ensureConnectorDefaults,
  sortFn: (a, b) => a.priority - b.priority || a.name.localeCompare(b.name),
});

export async function seedConnectorDefaults() {
  await connectorStore.seedIfEmpty(SEED_CONNECTORS);
}

export async function getConnector(id) { return connectorStore.get(id); }
export async function listConnectors() { return connectorStore.list(); }
export async function listEnabledConnectors() {
  const rows = await connectorStore.list();
  return rows.filter((c) => c.enabled);
}

// Called after every provider call attempt (success or failure) so the
// admin panel shows live connector health instead of a static config blob.
export async function recordConnectorHealth(connectorId, { success, latencyMs, error }) {
  const row = await connectorStore.get(connectorId);
  if (!row) return;
  row.health_status = success ? "healthy" : "unhealthy";
  row.last_checked_at = nowIso();
  row.last_latency_ms = Number.isFinite(latencyMs) ? Math.round(latencyMs) : row.last_latency_ms;
  row.last_error = success ? "" : cleanStr(error, 500);
  await connectorStore.save(row);
}

// ---------------------------------------------------------------------
// Model Detection (Issue: "cannot finish OpenRouter integration and start
// using it immediately"): fetches the connector's own /models list instead
// of requiring the admin to hand-type every model_id, context window and
// price. Uses the first active key configured for this connector - the
// exact key/model/router chain the brain endpoint itself will use.
// ---------------------------------------------------------------------

function isAzureConnector(connector) {
  return /azure/i.test(connector.name) && connector.azure_api_version;
}

async function fetchJson(url, headers) {
  const upstream = await fetch(url, { headers });
  const text = await upstream.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { text }; }
  if (!upstream.ok) {
    throw new Error(json?.error?.message || json?.message || `HTTP ${upstream.status}`);
  }
  return json;
}

export async function detectConnectorModels(connector, apiKey) {
  const base = String(connector.base_url || "").replace(/\/+$/, "");

  if (connector.type === "anthropic") {
    const json = await fetchJson(`${base}/models`, { "x-api-key": apiKey, "anthropic-version": "2023-06-01" });
    return (json.data || []).map((m) => ({
      model_id: m.id, name: m.display_name || m.id, context_window: null,
      vision: true, json_mode: true, streaming: true, price_per_million_in: 0, price_per_million_out: 0,
    }));
  }

  if (connector.type === "gemini") {
    const json = await fetchJson(`${base}?key=${encodeURIComponent(apiKey)}`, {});
    return (json.models || [])
      .filter((m) => (m.supportedGenerationMethods || []).includes("generateContent"))
      .map((m) => ({
        model_id: String(m.name || "").replace(/^models\//, ""), name: m.displayName || m.name,
        context_window: m.inputTokenLimit || null, vision: true, json_mode: true, streaming: false,
        price_per_million_in: 0, price_per_million_out: 0,
      }));
  }

  // openai_compatible / local
  if (isAzureConnector(connector)) {
    throw new Error("Azure OpenAI ne supporte pas la détection automatique - créez le modèle manuellement avec le nom du déploiement Azure.");
  }
  const json = await fetchJson(`${base}/models`, { Authorization: `Bearer ${apiKey}` });
  return (json.data || []).map((m) => {
    const modality = m.architecture?.modality || "";
    const promptPrice = Number(m.pricing?.prompt); // OpenRouter: $ per token
    const completionPrice = Number(m.pricing?.completion);
    return {
      model_id: m.id,
      name: m.name || m.id,
      context_window: m.context_length || m.top_provider?.context_length || null,
      vision: /image/i.test(modality) || /vision|vl\b/i.test(m.id),
      json_mode: true,
      streaming: true,
      price_per_million_in: Number.isFinite(promptPrice) ? Math.round(promptPrice * 1_000_000 * 100) / 100 : 0,
      price_per_million_out: Number.isFinite(completionPrice) ? Math.round(completionPrice * 1_000_000 * 100) / 100 : 0,
    };
  });
}

const handleConnectorRoutes = makeCrudRoutes({
  basePath: "/api/admin/ai/connectors",
  store: connectorStore,
  auditLog: auditLogger("connector"),
});

export async function handleAiConnectorsAdminRoutes(req, res, path, ctx) {
  await seedConnectorDefaults();
  if (path === "/api/admin/ai/connector-types" && req.method === "GET") {
    ctx.ok(res, { types: CONNECTOR_TYPES });
    return true;
  }
  // Manual health probe: a lightweight request the admin can trigger without
  // spending a doctor's credits, distinct from the passive health tracking
  // recordConnectorHealth() does on every real doctor request. Auth-aware:
  // if the connector has an active key, the probe actually calls the
  // provider's model-list endpoint with it (proves the KEY works, not just
  // that the domain resolves) - this is what was missing to trust "healthy"
  // before going into production.
  const probeMatch = path.match(/^\/api\/admin\/ai\/connectors\/([a-f0-9-]+)\/probe$/);
  if (probeMatch && req.method === "POST") {
    const connector = await getConnector(probeMatch[1]);
    if (!connector) { ctx.err(res, 404, "Connecteur introuvable"); return true; }
    const started = Date.now();
    try {
      if (!connector.base_url && connector.type !== "anthropic" && connector.type !== "gemini") throw new Error("base_url non configurée");
      const keys = await listApiKeysForConnector(connector.id);
      if (keys.length) {
        const apiKey = await getDecryptedKey(keys[0].id);
        if (!apiKey) throw new Error("Clé API associée introuvable ou non déchiffrable.");
        const models = await detectConnectorModels(connector, apiKey);
        await recordConnectorHealth(connector.id, { success: true, latencyMs: Date.now() - started });
        ctx.ok(res, { row: await getConnector(connector.id), authenticated: true, models_detected: models.length });
        return true;
      }
      // No key yet: fall back to an unauthenticated reachability check only
      // (still useful before a key is even configured).
      const upstream = await fetch(connector.base_url || "https://api.anthropic.com", { method: "GET" });
      await recordConnectorHealth(connector.id, { success: upstream.status < 500, latencyMs: Date.now() - started, error: upstream.status >= 500 ? `HTTP ${upstream.status}` : "" });
      ctx.ok(res, { row: await getConnector(connector.id), authenticated: false });
    } catch (e) {
      await recordConnectorHealth(connector.id, { success: false, latencyMs: Date.now() - started, error: e.message });
      ctx.ok(res, { row: await getConnector(connector.id), authenticated: false, error: e.message });
    }
    return true;
  }

  // Detect Models: list what the provider actually offers today, using the
  // connector's own active key.
  const detectMatch = path.match(/^\/api\/admin\/ai\/connectors\/([a-f0-9-]+)\/detect-models$/);
  if (detectMatch && req.method === "GET") {
    const connector = await getConnector(detectMatch[1]);
    if (!connector) { ctx.err(res, 404, "Connecteur introuvable"); return true; }
    const keys = await listApiKeysForConnector(connector.id);
    if (!keys.length) { ctx.err(res, 409, "Aucune clé API active pour ce connecteur - créez-en une d'abord."); return true; }
    const apiKey = await getDecryptedKey(keys[0].id);
    if (!apiKey) { ctx.err(res, 409, "Clé API introuvable ou non déchiffrable."); return true; }
    try {
      const models = await detectConnectorModels(connector, apiKey);
      const existing = await listModelsForConnector(connector.id);
      const existingIds = new Set(existing.map((m) => m.model_id));
      ctx.ok(res, { models: models.map((m) => ({ ...m, already_added: existingIds.has(m.model_id) })) });
    } catch (e) {
      ctx.err(res, 502, `Détection impossible : ${e.message}`);
    }
    return true;
  }

  // Import Models: bulk-create ai:model rows from a detect-models result in
  // one click, instead of hand-crafting JSON per model - this is the "start
  // using it immediately" step.
  const importMatch = path.match(/^\/api\/admin\/ai\/connectors\/([a-f0-9-]+)\/import-models$/);
  if (importMatch && req.method === "POST") {
    const connector = await getConnector(importMatch[1]);
    if (!connector) { ctx.err(res, 404, "Connecteur introuvable"); return true; }
    const body = await ctx.readJson(req);
    const selected = Array.isArray(body.models) ? body.models : [];
    if (!selected.length) { ctx.err(res, 400, "Aucun modèle sélectionné"); return true; }
    const existing = await listModelsForConnector(connector.id);
    const existingIds = new Set(existing.map((m) => m.model_id));
    let created = 0;
    for (const m of selected) {
      if (!m.model_id || existingIds.has(m.model_id)) continue;
      await createModel({
        name: m.name || m.model_id,
        connector_id: connector.id,
        model_id: m.model_id,
        enabled: true,
        context_window: m.context_window || 128000,
        vision: !!m.vision,
        json_mode: m.json_mode !== false,
        streaming: m.streaming !== false,
        price_per_million_in: m.price_per_million_in || 0,
        price_per_million_out: m.price_per_million_out || 0,
      });
      created++;
    }
    await auditLogger("model")(ctx.session, "bulk_import_from_connector", connector.id, { created });
    ctx.ok(res, { ok: true, created }, 201);
    return true;
  }

  return handleConnectorRoutes(req, res, path, ctx);
}
