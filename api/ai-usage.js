// Usage analytics + cost aggregation for the AI brain endpoint.
//
// Pre-aggregated rollups only (no raw per-request store beyond a bounded
// drill-down log) - Redis has no ad-hoc group-by, so this fixes a few known
// query dimensions up front: per-day-by-model, per-day-by-specialty,
// per-day-by-doctor. True cross-dimension analytics at 100k+ doctor scale
// would need RediSearch or a real OLAP store - flagged, not solved here.
//
// Storage:
//   ai:usage:day:{date}:model:{modelId}         hash: requests, tokens_in,
//                                                tokens_out, errors,
//                                                latency_sum_ms, cost_micros
//   ai:usage:day:{date}:specialty:{specialtyId} same shape
//   ai:usage:day:{date}:doctor:{doctorId}        same shape
//   ai:usage:day:{date}:country:{country}        same shape
//   ai:usage:days:index                          SET of dates with any data
//   ai:log:{date}                                LIST, bounded drill-down
//                                                (lpush + ltrim)

import { redis } from "./redis.js";
import { uuid, nowIso, cleanStr } from "./ai-store.js";

const MAX_LOG_PER_DAY = 2000;

function today() { return new Date().toISOString().slice(0, 10); }

async function bumpHash(key, { requests = 0, tokensIn = 0, tokensOut = 0, errors = 0, latencyMs = 0, costMicros = 0, promptRenderMs = 0, cacheHits = 0, confidenceSum = 0, confidenceCount = 0 }) {
  const pipe = redis.pipeline();
  if (requests) pipe.hincrby(key, "requests", requests);
  if (tokensIn) pipe.hincrby(key, "tokens_in", tokensIn);
  if (tokensOut) pipe.hincrby(key, "tokens_out", tokensOut);
  if (errors) pipe.hincrby(key, "errors", errors);
  if (latencyMs) pipe.hincrby(key, "latency_sum_ms", Math.round(latencyMs));
  if (costMicros) pipe.hincrby(key, "cost_micros", Math.round(costMicros));
  if (promptRenderMs) pipe.hincrby(key, "prompt_render_ms_sum", Math.round(promptRenderMs));
  if (cacheHits) pipe.hincrby(key, "cache_hits", cacheHits);
  // Confidence is a 0..1 float from the model's structured JSON output, so
  // it's summed as an integer-scaled value (x10000) to keep HINCRBY exact,
  // then divided back down when read (see readHash).
  if (confidenceSum) pipe.hincrby(key, "confidence_sum_x10000", Math.round(confidenceSum * 10000));
  if (confidenceCount) pipe.hincrby(key, "confidence_count", confidenceCount);
  await pipe.exec();
}

export async function recordAiUsage({
  doctorId, modelId, specialtyId, promptId, country, tokensIn, tokensOut, latencyMs, costMicros, success, actionType, details,
  // Performance breakdown (all optional - see api/ai-brain.js phase timers).
  promptRenderMs, guidelineMs, modelLatencyMs, networkMs, cacheHit, confidence,
}) {
  const date = today();
  const dims = [
    modelId && `ai:usage:day:${date}:model:${modelId}`,
    specialtyId && `ai:usage:day:${date}:specialty:${specialtyId}`,
    doctorId && `ai:usage:day:${date}:doctor:${doctorId}`,
    promptId && `ai:usage:day:${date}:prompt:${promptId}`,
    country && `ai:usage:day:${date}:country:${cleanStr(country, 10)}`,
  ].filter(Boolean);

  const hasConfidence = Number.isFinite(confidence);
  const stats = {
    requests: 1,
    tokensIn: tokensIn || 0,
    tokensOut: tokensOut || 0,
    errors: success ? 0 : 1,
    latencyMs: latencyMs || 0,
    costMicros: costMicros || 0,
    promptRenderMs: promptRenderMs || 0,
    cacheHits: cacheHit ? 1 : 0,
    confidenceSum: hasConfidence ? confidence : 0,
    confidenceCount: hasConfidence ? 1 : 0,
  };
  await Promise.all(dims.map((key) => bumpHash(key, stats)));
  await redis.sadd("ai:usage:days:index", date);
  if (promptId) await redis.sadd("ai:usage:prompts:index", promptId);

  const entry = {
    id: uuid(),
    doctor_id: doctorId || "",
    model_id: modelId || "",
    specialty_id: specialtyId || "",
    prompt_id: promptId || "",
    action_type: actionType || "",
    tokens_in: tokensIn || 0,
    tokens_out: tokensOut || 0,
    latency_ms: latencyMs || 0,
    cost_micros: costMicros || 0,
    success: !!success,
    confidence: hasConfidence ? confidence : null,
    details: cleanStr(details, 300),
    perf: {
      prompt_render_ms: promptRenderMs || 0,
      guideline_ms: guidelineMs || 0,
      model_latency_ms: modelLatencyMs || 0,
      network_ms: networkMs || 0,
      cache_hit: !!cacheHit,
    },
    at: nowIso(),
  };
  await redis.lpush(`ai:log:${date}`, JSON.stringify(entry));
  await redis.ltrim(`ai:log:${date}`, 0, MAX_LOG_PER_DAY - 1);
  return entry;
}

async function readHash(key) {
  const row = (await redis.hgetall(key)) || {};
  return {
    requests: Number(row.requests || 0),
    tokens_in: Number(row.tokens_in || 0),
    tokens_out: Number(row.tokens_out || 0),
    errors: Number(row.errors || 0),
    latency_sum_ms: Number(row.latency_sum_ms || 0),
    cost_micros: Number(row.cost_micros || 0),
    prompt_render_ms_sum: Number(row.prompt_render_ms_sum || 0),
    cache_hits: Number(row.cache_hits || 0),
    confidence_sum_x10000: Number(row.confidence_sum_x10000 || 0),
    confidence_count: Number(row.confidence_count || 0),
  };
}

async function lastNDays(n) {
  const out = [];
  const now = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

// Callers with a known id list (e.g. all model ids, all specialty ids) get
// exact per-day totals without any keyspace scan.
export async function usageForIds(dimension, ids, days = 30) {
  const dates = await lastNDays(days);
  const out = {};
  for (const id of ids) {
    const totals = { requests: 0, tokens_in: 0, tokens_out: 0, errors: 0, latency_sum_ms: 0, cost_micros: 0, prompt_render_ms_sum: 0, cache_hits: 0, confidence_sum_x10000: 0, confidence_count: 0 };
    for (const date of dates) {
      const row = await readHash(`ai:usage:day:${date}:${dimension}:${id}`);
      totals.requests += row.requests;
      totals.tokens_in += row.tokens_in;
      totals.tokens_out += row.tokens_out;
      totals.errors += row.errors;
      totals.latency_sum_ms += row.latency_sum_ms;
      totals.cost_micros += row.cost_micros;
      totals.prompt_render_ms_sum += row.prompt_render_ms_sum;
      totals.cache_hits += row.cache_hits;
      totals.confidence_sum_x10000 += row.confidence_sum_x10000;
      totals.confidence_count += row.confidence_count;
    }
    totals.avg_confidence = totals.confidence_count ? (totals.confidence_sum_x10000 / 10000 / totals.confidence_count) : null;
    totals.avg_latency_ms = totals.requests ? Math.round(totals.latency_sum_ms / totals.requests) : 0;
    totals.success_rate = totals.requests ? (totals.requests - totals.errors) / totals.requests : null;
    out[id] = totals;
  }
  return out;
}

export async function readAiLogs(days = 3, limit = 300) {
  const dates = await lastNDays(days);
  const out = [];
  for (const date of dates) {
    if (out.length >= limit) break;
    const raw = await redis.lrange(`ai:log:${date}`, 0, limit - 1);
    for (const s of raw || []) {
      try { out.push(typeof s === "string" ? JSON.parse(s) : s); } catch { /* skip malformed */ }
    }
  }
  return out.slice(0, limit);
}

// ---------------------------------------------------------------------
// Prompt Analytics: usage/success-rate/confidence/latency/cost for one
// prompt (Prompt Library requirement), plus a "most used models" tally
// derived from the recent drill-down log (bounded, so this is an
// approximation over the log's retention window, not all-time exact).
// ---------------------------------------------------------------------

export async function promptAnalytics(promptId, days = 30) {
  const totals = (await usageForIds("prompt", [promptId], days))[promptId];
  const recent = (await readAiLogs(days, 2000)).filter((e) => e.prompt_id === promptId);
  const modelCounts = {};
  for (const e of recent) {
    if (!e.model_id) continue;
    modelCounts[e.model_id] = (modelCounts[e.model_id] || 0) + 1;
  }
  const mostUsedModels = Object.entries(modelCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([model_id, count]) => ({ model_id, count }));
  return { ...totals, most_used_models: mostUsedModels };
}

// ---------------------------------------------------------------------
// Doctor Feedback - infrastructure only. The doctor-facing endpoint that
// would submit this (POST /api/me/ai/feedback) exists and is wired, but
// the current desktop app has no UI for it yet (same status as streaming -
// backend-ready, opt-in from the client side, no desktop change made here).
// Storage: ai:feedback:{promptId} LIST, bounded (lpush + ltrim).
// ---------------------------------------------------------------------

const MAX_FEEDBACK_PER_PROMPT = 500;

export async function recordPromptFeedback(promptId, { doctorId, rating, comment }) {
  const entry = {
    id: uuid(),
    doctor_id: doctorId || "",
    rating: Number.isFinite(+rating) ? Math.max(1, Math.min(5, Math.round(+rating))) : null,
    comment: cleanStr(comment, 500),
    at: nowIso(),
  };
  await redis.lpush(`ai:feedback:${promptId}`, JSON.stringify(entry));
  await redis.ltrim(`ai:feedback:${promptId}`, 0, MAX_FEEDBACK_PER_PROMPT - 1);
  return entry;
}

export async function readPromptFeedback(promptId, limit = 50) {
  const raw = await redis.lrange(`ai:feedback:${promptId}`, 0, limit - 1);
  return (raw || []).map((s) => {
    try { return typeof s === "string" ? JSON.parse(s) : s; } catch { return null; }
  }).filter(Boolean);
}

export async function handleAiUsageAdminRoutes(req, res, path, ctx) {
  const { ok } = ctx;

  if (path === "/api/admin/ai/logs" && req.method === "GET") {
    ok(res, { rows: await readAiLogs(7, 500) });
    return true;
  }

  if (path === "/api/admin/ai/usage" && req.method === "GET") {
    const { listModels } = await import("./ai-models.js");
    const models = await listModels();
    const byModel = await usageForIds("model", models.map((m) => m.id), 30);
    ok(res, {
      by_model: models.map((m) => ({ model_id: m.id, name: m.name, ...byModel[m.id] })),
    });
    return true;
  }

  if (path === "/api/admin/ai/costs" && req.method === "GET") {
    const { listModels } = await import("./ai-models.js");
    const models = await listModels();
    const byModel = await usageForIds("model", models.map((m) => m.id), 30);
    const rows = models.map((m) => ({
      model_id: m.id,
      name: m.name,
      requests: byModel[m.id]?.requests || 0,
      cost_micros: byModel[m.id]?.cost_micros || 0,
      cost_usd: (byModel[m.id]?.cost_micros || 0) / 1_000_000,
    }));
    ok(res, { rows, total_cost_usd: rows.reduce((s, r) => s + r.cost_usd, 0) });
    return true;
  }

  return false;
}
