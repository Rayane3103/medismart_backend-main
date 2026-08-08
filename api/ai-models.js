// AI model catalog: unlimited models, each bound to a provider CONNECTOR
// (api/ai-connectors.js) rather than a hardcoded provider enum - this is
// what makes "unlimited providers" real (admin can add a new connector,
// e.g. a second OpenRouter key or a self-hosted vLLM box, then point any
// number of new models at it, with zero code changes).

import { makeStore, makeCrudRoutes, cleanStr } from "./ai-store.js";
import { auditLogger } from "./ai-audit.js";
import { listConnectors, seedConnectorDefaults, getConnector } from "./ai-connectors.js";

const REASONING_LEVELS = ["none", "low", "medium", "high"];

// name -> which seeded connector it belongs to, resolved at seed time (see
// seedModelDefaults) since connector ids are only known after connectors
// have been created.
//
// Only the OpenRouter-routed models default to enabled: true -- the
// non-OpenRouter ones (Claude/Gemini/GPT-4o/Groq, each needing its own
// separate provider API key an admin running OpenRouter-only never adds)
// are seeded disabled. Left enabled, listEnabledModels() would hand
// callModelChain() a mixed-provider chain where most candidates fail with
// "Aucune clé API active" before ever reaching a model that actually has
// a key, and an admin picking one from the catalog dropdown with no idea
// it needs its own separate key.
const SEED_MODELS = [
  { name: "GPT-5 (via OpenRouter)", connectorName: "OpenRouter", model_id: "openai/gpt-5", vision: true, json_mode: true, streaming: true, reasoning_level: "high", context_window: 400000 },
  { name: "Claude Opus", connectorName: "Anthropic", model_id: "claude-opus-4-5", vision: true, json_mode: true, streaming: true, reasoning_level: "high", context_window: 200000, enabled: false },
  { name: "Claude Sonnet", connectorName: "Anthropic", model_id: "claude-sonnet-4-5", vision: true, json_mode: true, streaming: true, reasoning_level: "medium", context_window: 200000, enabled: false },
  { name: "Qwen3 235B (via OpenRouter)", connectorName: "OpenRouter", model_id: "qwen/qwen3-235b-a22b", vision: false, json_mode: true, streaming: true, reasoning_level: "medium", context_window: 128000 },
  { name: "Qwen Max (via OpenRouter)", connectorName: "OpenRouter", model_id: "qwen/qwen-max", vision: false, json_mode: true, streaming: true, reasoning_level: "medium", context_window: 32000 },
  { name: "DeepSeek (via OpenRouter)", connectorName: "OpenRouter", model_id: "deepseek/deepseek-chat", vision: false, json_mode: true, streaming: true, reasoning_level: "medium", context_window: 64000 },
  { name: "Gemini 2.5 Flash", connectorName: "Google Gemini", model_id: "gemini-2.5-flash", vision: true, json_mode: true, streaming: false, reasoning_level: "low", context_window: 1000000, enabled: false },
  { name: "GPT-4o", connectorName: "OpenAI", model_id: "gpt-4o", vision: true, json_mode: true, streaming: true, reasoning_level: "medium", context_window: 128000, enabled: false },
  { name: "Groq Llama 3.3 70B", connectorName: "Groq", model_id: "llama-3.3-70b-versatile", vision: false, json_mode: false, streaming: true, reasoning_level: "low", context_window: 128000, enabled: false },
];

function ensureModelDefaults(row) {
  row.name = cleanStr(row.name, 150) || "Untitled model";
  row.connector_id = cleanStr(row.connector_id, 100);
  row.model_id = cleanStr(row.model_id, 200);
  if (typeof row.enabled !== "boolean") row.enabled = true;
  row.priority = Number.isFinite(+row.priority) ? Math.max(0, Math.round(+row.priority)) : 100;
  row.temperature = Number.isFinite(+row.temperature) ? Math.min(2, Math.max(0, +row.temperature)) : 0.2;
  row.top_p = Number.isFinite(+row.top_p) ? Math.min(1, Math.max(0, +row.top_p)) : 1;
  row.max_tokens = Number.isFinite(+row.max_tokens) ? Math.min(32000, Math.max(64, Math.round(+row.max_tokens))) : 2048;
  row.timeout_ms = Number.isFinite(+row.timeout_ms) ? Math.min(180000, Math.max(1000, Math.round(+row.timeout_ms))) : 60000;
  row.retry = Number.isFinite(+row.retry) ? Math.min(5, Math.max(0, Math.round(+row.retry))) : 1;
  row.price_per_million_in = Number.isFinite(+row.price_per_million_in) ? +row.price_per_million_in : 0;
  row.price_per_million_out = Number.isFinite(+row.price_per_million_out) ? +row.price_per_million_out : 0;
  row.context_window = Number.isFinite(+row.context_window) ? Math.max(0, Math.round(+row.context_window)) : 128000;
  row.reasoning_level = REASONING_LEVELS.includes(row.reasoning_level) ? row.reasoning_level : "medium";
  row.vision = !!row.vision;
  row.json_mode = !!row.json_mode;
  row.streaming = !!row.streaming;
  // Passive performance stats, updated by the brain after every call
  // (api/ai-brain.js) - not admin-editable, just observability.
  row.avg_latency_ms = Number.isFinite(+row.avg_latency_ms) ? +row.avg_latency_ms : null;
  row.last_status = ["ok", "error", null].includes(row.last_status) ? row.last_status : null;
  row.last_called_at = row.last_called_at || null;
  return row;
}

const modelStore = makeStore({
  keyPrefix: "ai:model",
  indexKey: "ai:models:index",
  cacheKey: "ai_models",
  ensureDefaults: ensureModelDefaults,
  sortFn: (a, b) => a.priority - b.priority || a.name.localeCompare(b.name),
});

export async function seedModelDefaults() {
  await seedConnectorDefaults();
  const connectors = await listConnectors();
  const byName = Object.fromEntries(connectors.map((c) => [c.name, c.id]));
  await modelStore.seedIfEmpty(SEED_MODELS.map((m) => ({
    ...m,
    connector_id: byName[m.connectorName] || "",
    connectorName: undefined,
  })));
}

// Retroactive version of SEED_MODELS' enabled:false defaults above --
// those only apply to a fresh, empty model store. A deployment that
// already had Claude/Gemini/GPT-4o/Groq models enabled before that
// change needs them disabled where they already exist, not just where
// they'd be freshly created. Used by index.js's one-time OpenRouter-only
// migration (runAiOpenRouterMigrationOnce).
export async function keepOnlyConnectorModelsEnabled(connectorName) {
  const connectors = await listConnectors();
  const keepId = connectors.find((c) => c.name === connectorName)?.id;
  if (!keepId) return { updated: 0, skipped_no_replacement: false, restored: 0 };
  const rows = await modelStore.list();
  // Never disable every other provider's models unless at least one
  // model on the connector we're keeping is enabled -- "add an
  // OpenRouter key" without also running Detect Models/Import Models for
  // it (a separate admin step, in the connector's own detail screen)
  // would otherwise leave listEnabledModels() empty and every doctor's
  // AI request failing outright, which is worse than the wrong-provider
  // problem this was meant to fix.
  const keepConnectorHasWorkingModel = rows.some((r) => r.connector_id === keepId && r.enabled);
  if (!keepConnectorHasWorkingModel) {
    // Self-heal: restore whatever THIS migration previously disabled
    // (tagged below), rather than leave every doctor's AI silently
    // broken because OpenRouter has a key but no imported models yet.
    // Never touches a model an admin disabled for their own reasons.
    let restored = 0;
    for (const row of rows) {
      if (row.connector_id !== keepId && !row.enabled && row._disabled_by_openrouter_migration) {
        row.enabled = true;
        delete row._disabled_by_openrouter_migration;
        await modelStore.save(row);
        restored++;
      }
    }
    return { updated: 0, skipped_no_replacement: true, restored };
  }
  let updated = 0;
  for (const row of rows) {
    if (row.connector_id !== keepId && row.enabled) {
      row.enabled = false;
      row._disabled_by_openrouter_migration = true;
      await modelStore.save(row);
      updated++;
    }
  }
  return { updated, skipped_no_replacement: false, restored: 0 };
}

export async function getModel(id) { return modelStore.get(id); }
export async function listModels() { return modelStore.list(); }
export async function listEnabledModels() {
  const rows = await modelStore.list();
  return rows.filter((m) => m.enabled);
}
export async function listModelsForConnector(connectorId) {
  const rows = await modelStore.list();
  return rows.filter((m) => m.connector_id === connectorId);
}
// Used by the connector "detect models" bulk-import (api/ai-connectors.js) -
// same defaulting/validation as the regular CRUD create, just callable
// directly instead of through an HTTP round-trip per model.
export async function createModel(row) { return modelStore.create(row); }

// Updates the model's passive perf stats after a call - not a config write,
// so it doesn't go through the CRUD audit log (this fires on every doctor
// request, auditing it would flood the admin action trail).
export async function recordModelCallStats(modelId, { latencyMs, success }) {
  const model = await modelStore.get(modelId);
  if (!model) return;
  model.avg_latency_ms = model.avg_latency_ms == null ? latencyMs : Math.round(model.avg_latency_ms * 0.8 + latencyMs * 0.2);
  model.last_status = success ? "ok" : "error";
  model.last_called_at = new Date().toISOString();
  await modelStore.save(model);
}

function publicModelState(row, connectorMap) {
  const connector = connectorMap?.[row.connector_id];
  return { ...row, provider: connector?.name || "", provider_type: connector?.type || "" };
}

const handleModelRoutes = makeCrudRoutes({
  basePath: "/api/admin/ai/models",
  store: modelStore,
  publicState: null, // patched in handleAiModelsAdminRoutes below (needs async connector lookup)
  auditLog: auditLogger("model"),
});

export async function handleAiModelsAdminRoutes(req, res, path, ctx) {
  await seedModelDefaults();

  if (path === "/api/admin/ai/models" && req.method === "GET") {
    const [rows, connectors] = await Promise.all([modelStore.list(), listConnectors()]);
    const connectorMap = Object.fromEntries(connectors.map((c) => [c.id, c]));
    ctx.ok(res, { rows: rows.map((r) => publicModelState(r, connectorMap)), connectors });
    return true;
  }

  return handleModelRoutes(req, res, path, ctx);
}

export async function resolveModelConnector(model) {
  return model.connector_id ? getConnector(model.connector_id) : null;
}
