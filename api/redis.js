// Shared Upstash Redis client with lazy initialization and a clear error when
// the environment variables are missing (instead of the cryptic
// "Failed to parse URL from /pipeline" thrown by the raw client).
//
// Accepted variable names:
//   UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN   (Upstash console)
//   KV_REST_API_URL        / KV_REST_API_TOKEN          (Vercel Upstash/KV integration)

import { Redis } from "@upstash/redis";
import { AsyncLocalStorage } from "node:async_hooks";

function resolveConfig() {
  const url = (process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || "").trim();
  const token = (process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || "").trim();
  if (!url || !token) {
    throw new Error(
      "Base de donnees Redis non configuree. Ajoutez UPSTASH_REDIS_REST_URL et "
      + "UPSTASH_REDIS_REST_TOKEN (valeurs dans la console Upstash) aux variables "
      + "d'environnement du deploiement (Vercel/Render), puis redeployez."
    );
  }
  return { url, token };
}

let client = null;

export const redis = new Proxy({}, {
  get(_target, prop) {
    if (!client) client = new Redis(resolveConfig());
    const value = client[prop];
    return typeof value === "function" ? value.bind(client) : value;
  },
});

// ---------------------------------------------------------------------
// Batch helpers.
//
// Every Upstash call is an HTTPS round-trip, so fetching N records in a
// `for` loop costs N round-trips and dominates response time. These pull
// the same records in a constant number of calls instead.
// ---------------------------------------------------------------------

// Upstash rejects very large request bodies, so fan out in chunks.
const CHUNK = 100;

function chunk(items) {
  const out = [];
  for (let i = 0; i < items.length; i += CHUNK) out.push(items.slice(i, i + CHUNK));
  return out;
}

// Fetch many keys at once. Returns values positionally; missing keys are null.
export async function mgetAll(keys) {
  const list = (keys || []).filter(Boolean);
  if (!list.length) return [];
  const groups = await Promise.all(chunk(list).map((part) => redis.mget(...part)));
  return groups.flatMap((g) => g || []);
}

// Fetch many records and drop the misses. Use when only the hits matter.
export async function mgetExisting(keys) {
  return (await mgetAll(keys)).filter((row) => row != null);
}

// SMEMBERS for many keys in one pipelined round-trip. Returns arrays positionally.
export async function smembersAll(keys) {
  const list = (keys || []).filter(Boolean);
  if (!list.length) return [];
  const groups = await Promise.all(chunk(list).map(async (part) => {
    const pipe = redis.pipeline();
    part.forEach((key) => pipe.smembers(key));
    const results = await pipe.exec();
    return (results || []).map((r) => r || []);
  }));
  return groups.flatMap((g) => g);
}

// ---------------------------------------------------------------------
// Per-request cache.
//
// One admin page load asks for the same collections several times (each
// stats helper re-lists registrations and licenses). This keeps a single
// in-flight promise per collection for the lifetime of one request, then
// throws it away — so it can never serve data across requests.
//
// Writers MUST call invalidate() for any collection they change, or a
// later read in the same request would see the pre-write snapshot.
// ---------------------------------------------------------------------

const requestStore = new AsyncLocalStorage();

export function withRequestCache(fn) {
  return requestStore.run(new Map(), fn);
}

export function cached(key, loader) {
  const store = requestStore.getStore();
  if (!store) return loader();
  if (!store.has(key)) store.set(key, loader());
  return store.get(key);
}

export function invalidate(...keys) {
  const store = requestStore.getStore();
  if (store) keys.forEach((key) => store.delete(key));
}
