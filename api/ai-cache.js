// Redis-backed TTL caches for the AI brain's hot-path config lookups
// (prompt version, guideline text, model, connector) plus an optional,
// off-by-default response cache. All are just thin wrappers around
// redis.set(key,val,{ex}) / redis.get(key) - no new storage system, reuses
// the same Upstash Redis every other AI Management module uses.
//
// Storage:
//   ai:cache:prompt:{id}:{version}   TTL 60s
//   ai:cache:guideline:{id}          TTL 300s
//   ai:cache:model:{id}              TTL 30s
//   ai:cache:connector:{id}          TTL 30s
//   ai:cache:response:{sha256}       TTL from AI Settings, opt-in only

import crypto from "node:crypto";
import { redis } from "./redis.js";

const TTL = {
  prompt: 60,
  guideline: 300,
  model: 30,
  connector: 30,
};

// Wraps a loader with a short Redis TTL cache. Returns { value, cacheHit }
// so callers can fold cache-hit into their performance metrics without a
// second lookup.
async function cached(kind, key, loader) {
  const cacheKey = `ai:cache:${kind}:${key}`;
  const hit = await redis.get(cacheKey);
  if (hit != null) return { value: hit, cacheHit: true };
  const value = await loader();
  if (value != null) await redis.set(cacheKey, value, { ex: TTL[kind] });
  return { value, cacheHit: false };
}

export function cachedPrompt(promptVersionKey, loader) { return cached("prompt", promptVersionKey, loader); }
export function cachedGuideline(guidelineId, loader) { return cached("guideline", guidelineId, loader); }
export function cachedModel(modelId, loader) { return cached("model", modelId, loader); }
export function cachedConnector(connectorId, loader) { return cached("connector", connectorId, loader); }

// Explicit invalidation for admin-triggered changes (publish/archive/new
// version/rollback) - the 60s prompt-cache TTL is fine for staleness
// between independent requests, but a "publish" action must take effect
// immediately, not up to 60s later.
export async function invalidatePromptCache(promptId) {
  await redis.del(`ai:cache:prompt:${promptId}`);
}

// ---------------------------------------------------------------------
// Response cache - OFF by default (feature flag "ai_response_cache_enabled").
// Keyed by a hash of everything that determines the output (task, model,
// prompt version, exact rendered messages), so a cache hit is only ever
// served for a byte-identical request - no cross-patient bleed risk beyond
// what identical input already implies.
// ---------------------------------------------------------------------

export function responseCacheKey({ taskId, modelId, promptVersion, messages }) {
  const hash = crypto.createHash("sha256")
    .update(JSON.stringify({ taskId, modelId, promptVersion, messages }))
    .digest("hex");
  return hash;
}

export async function getCachedResponse(key) {
  const raw = await redis.get(`ai:cache:response:${key}`);
  return raw || null;
}

export async function setCachedResponse(key, value, ttlSeconds) {
  await redis.set(`ai:cache:response:${key}`, value, { ex: Math.max(5, ttlSeconds || 120) });
}
