// Shared generic CRUD engine for the AI Management catalog entities
// (models, specialties, clinical tasks, guidelines, feature flags, plans).
// Every one of these follows the exact same Redis shape used elsewhere in
// this codebase (one JSON blob per id + one index SET), so this factors out
// the repeated list/get/save/delete/seed boilerplate instead of copy-pasting
// it across six files.
//
// Storage: `{keyPrefix}:{id}` (JSON) + `{keyPrefix}s:index` (SET of ids).

import crypto from "node:crypto";
import { redis, mgetExisting, cached, invalidate } from "./redis.js";

export function uuid() { return crypto.randomUUID(); }
export function nowIso() { return new Date().toISOString(); }

export function cleanStr(value, maxLen = 200) {
  return String(value ?? "").trim().slice(0, maxLen);
}

export function makeStore({ keyPrefix, indexKey, cacheKey, ensureDefaults, sortFn }) {
  async function get(id) {
    if (!id) return null;
    const row = await redis.get(`${keyPrefix}:${id}`);
    return row ? ensureDefaults({ ...row }) : null;
  }

  async function list() {
    return cached(cacheKey, async () => {
      const ids = (await redis.smembers(indexKey)) || [];
      const rows = await mgetExisting(ids.map((id) => `${keyPrefix}:${id}`));
      const normalized = rows.map((row) => ensureDefaults({ ...row }));
      return sortFn ? normalized.sort(sortFn) : normalized;
    });
  }

  async function save(row) {
    row.updated_at = nowIso();
    await redis.set(`${keyPrefix}:${row.id}`, row);
    invalidate(cacheKey);
    return row;
  }

  async function create(body) {
    const row = ensureDefaults({ ...body, id: uuid(), created_at: nowIso() });
    await save(row);
    await redis.sadd(indexKey, row.id);
    return row;
  }

  async function remove(id) {
    await redis.del(`${keyPrefix}:${id}`);
    await redis.srem(indexKey, id);
    invalidate(cacheKey);
  }

  async function seedIfEmpty(seedRows) {
    const ids = (await redis.smembers(indexKey)) || [];
    if (ids.length) return false;
    for (const seed of seedRows) {
      const row = ensureDefaults({ ...seed, id: seed.id || uuid(), created_at: nowIso() });
      await redis.set(`${keyPrefix}:${row.id}`, row);
      await redis.sadd(indexKey, row.id);
    }
    invalidate(cacheKey);
    return true;
  }

  // Additive catalog growth: inserts only the seed rows whose `nameField`
  // value isn't already present (case-insensitive), leaving every existing
  // row - including ones an admin has since edited - completely untouched.
  // Used when a later release adds new catalog entries to a store that may
  // already be populated (unlike seedIfEmpty, which only ever fires once on
  // a truly empty store).
  async function seedMissingByName(seedRows, nameField = "name") {
    const existing = await list();
    const existingNames = new Set(existing.map((r) => String(r[nameField] || "").toLowerCase()));
    const missing = seedRows.filter((s) => !existingNames.has(String(s[nameField] || "").toLowerCase()));
    for (const seed of missing) {
      const row = ensureDefaults({ ...seed, id: seed.id || uuid(), created_at: nowIso() });
      await redis.set(`${keyPrefix}:${row.id}`, row);
      await redis.sadd(indexKey, row.id);
    }
    if (missing.length) invalidate(cacheKey);
    return missing.length;
  }

  return { get, list, save, create, remove, seedIfEmpty, seedMissingByName };
}

// Generic REST handler for a simple catalog collection, mounted at a fixed
// base path (e.g. /api/admin/ai/specialties). Handles GET (list), POST
// (create), PATCH/PUT (update by id), DELETE (remove by id).
export function makeCrudRoutes({ basePath, store, publicState, applyUpdate, auditLog }) {
  return async function handleRoutes(req, res, path, ctx) {
    const { readJson, ok, err, session } = ctx;
    const toPublic = publicState || ((row) => row);

    if (path === basePath && req.method === "GET") {
      const rows = await store.list();
      ok(res, { rows: rows.map(toPublic) });
      return true;
    }

    if (path === basePath && req.method === "POST") {
      const body = await readJson(req);
      const row = await store.create(body);
      await store.save(row);
      if (auditLog) await auditLog(session, "create", row.id, body);
      ok(res, { row: toPublic(row) }, 201);
      return true;
    }

    const itemMatch = path.match(new RegExp(`^${basePath}/([a-f0-9-]+)$`));
    if (itemMatch && (req.method === "PATCH" || req.method === "PUT")) {
      const row = await store.get(itemMatch[1]);
      if (!row) { err(res, 404, "Introuvable"); return true; }
      const body = await readJson(req);
      const updated = applyUpdate ? applyUpdate(row, body) : { ...row, ...body };
      await store.save(updated);
      if (auditLog) await auditLog(session, "update", row.id, body);
      ok(res, { row: toPublic(updated) });
      return true;
    }

    if (itemMatch && req.method === "DELETE") {
      await store.remove(itemMatch[1]);
      if (auditLog) await auditLog(session, "delete", itemMatch[1], {});
      ok(res, { ok: true });
      return true;
    }

    return false;
  };
}
