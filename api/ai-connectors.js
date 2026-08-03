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
  // recordConnectorHealth() does on every real doctor request.
  const probeMatch = path.match(/^\/api\/admin\/ai\/connectors\/([a-f0-9-]+)\/probe$/);
  if (probeMatch && req.method === "POST") {
    const connector = await getConnector(probeMatch[1]);
    if (!connector) { ctx.err(res, 404, "Connecteur introuvable"); return true; }
    const started = Date.now();
    try {
      if (!connector.base_url && connector.type !== "anthropic") throw new Error("base_url non configurée");
      const upstream = await fetch(connector.base_url || "https://api.anthropic.com", { method: "GET" });
      await recordConnectorHealth(connector.id, { success: upstream.status < 500, latencyMs: Date.now() - started, error: upstream.status >= 500 ? `HTTP ${upstream.status}` : "" });
    } catch (e) {
      await recordConnectorHealth(connector.id, { success: false, latencyMs: Date.now() - started, error: e.message });
    }
    ctx.ok(res, { row: await getConnector(connector.id) });
    return true;
  }
  return handleConnectorRoutes(req, res, path, ctx);
}
