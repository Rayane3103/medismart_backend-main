// MediSmart licensing module: doctor registrations synced from the desktop app,
// serial key (license) management, and one-time activation with signed tokens.
//
// Storage (Upstash Redis):
//   registrations:index                set of registration ids
//   registration:{id}                  registration JSON
//   registration:client:{clientId}     registration id (idempotent sync lookup)
//   licenses:index                     set of license ids
//   license:{id}                       license JSON (key stored hashed only)
//   license:hash:{sha256}              license id (O(1) activation lookup)
//   license:signing_secret             HMAC secret (unless LICENSE_SIGNING_SECRET env)

import { Redis } from "@upstash/redis";
import crypto from "node:crypto";

const redis = Redis.fromEnv();

export const LICENSE_TYPES = ["trial", "lifetime"];
export const LICENSE_STATUSES = ["generated", "used", "revoked"];
export const REGISTRATION_STATUSES = ["pending_activation", "activated"];

// Unambiguous alphabet: no I, L, O, 0, 1.
const SERIAL_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const SERIAL_PREFIX = "MEDI";
const SERIAL_GROUPS = 4;
const SERIAL_GROUP_LEN = 4;

function nowIso() { return new Date().toISOString(); }
function uuid() { return crypto.randomUUID(); }

function cleanStr(value, maxLen = 200) {
  return String(value ?? "").trim().slice(0, maxLen);
}

// ---------- serial keys ----------
export function generateSerialKey() {
  const groups = [];
  for (let g = 0; g < SERIAL_GROUPS; g++) {
    let group = "";
    for (let i = 0; i < SERIAL_GROUP_LEN; i++) {
      group += SERIAL_ALPHABET[crypto.randomInt(SERIAL_ALPHABET.length)];
    }
    groups.push(group);
  }
  return `${SERIAL_PREFIX}-${groups.join("-")}`;
}

// Tolerant normalization: uppercase, strip everything except A-Z / 2-9.
export function normalizeSerialKey(raw) {
  return String(raw || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function serialKeyLooksValid(raw) {
  const compact = normalizeSerialKey(raw);
  return compact.length === SERIAL_PREFIX.length + SERIAL_GROUPS * SERIAL_GROUP_LEN
    && compact.startsWith(SERIAL_PREFIX);
}

export function hashSerialKey(raw) {
  return crypto.createHash("sha256").update(normalizeSerialKey(raw)).digest("hex");
}

export function serialKeyHint(rawKey) {
  const compact = normalizeSerialKey(rawKey);
  const last = compact.slice(-SERIAL_GROUP_LEN);
  return `${SERIAL_PREFIX}-****-****-****-${last}`;
}

// ---------- signing ----------
async function getSigningSecret() {
  const configured = String(process.env.LICENSE_SIGNING_SECRET || "").trim();
  if (configured) return configured;
  let secret = await redis.get("license:signing_secret");
  if (!secret) {
    secret = crypto.randomBytes(32).toString("hex");
    await redis.set("license:signing_secret", secret);
  }
  return secret;
}

function b64url(buf) {
  return Buffer.from(buf).toString("base64url");
}

export async function signActivationToken(payload) {
  const secret = await getSigningSecret();
  const body = b64url(JSON.stringify(payload));
  const sig = crypto.createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export async function verifyActivationToken(token) {
  const parts = String(token || "").split(".");
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  const secret = await getSigningSecret();
  const expected = crypto.createHmac("sha256", secret).update(body).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    return JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

// ---------- registrations ----------
export function ensureRegistrationDefaults(reg) {
  reg.id = reg.id || uuid();
  reg.client_registration_id = cleanStr(reg.client_registration_id, 100);
  reg.full_name = cleanStr(reg.full_name);
  reg.specialty = cleanStr(reg.specialty, 100);
  reg.phone = cleanStr(reg.phone, 50);
  reg.email = cleanStr(reg.email, 200);
  reg.clinic_name = cleanStr(reg.clinic_name);
  reg.address = cleanStr(reg.address, 300);
  reg.wilaya = cleanStr(reg.wilaya, 100);
  reg.device_fingerprint = cleanStr(reg.device_fingerprint, 128);
  reg.app_version = cleanStr(reg.app_version, 50);
  reg.registered_at = cleanStr(reg.registered_at, 40) || nowIso();
  if (!REGISTRATION_STATUSES.includes(reg.status)) reg.status = "pending_activation";
  reg.license_id = cleanStr(reg.license_id, 100);
  reg.cloud_doctor_id = cleanStr(reg.cloud_doctor_id, 100);
  if (!reg.synced_at) reg.synced_at = nowIso();
  if (!reg.created_at) reg.created_at = nowIso();
  return reg;
}

export async function getRegistration(id) {
  if (!id) return null;
  return await redis.get(`registration:${id}`);
}

export async function saveRegistration(reg) {
  reg.updated_at = nowIso();
  await redis.set(`registration:${reg.id}`, reg);
  if (reg.client_registration_id) {
    await redis.set(`registration:client:${reg.client_registration_id}`, reg.id);
  }
}

export async function findRegistrationByClientId(clientId) {
  if (!clientId) return null;
  const id = await redis.get(`registration:client:${clientId}`);
  if (!id) return null;
  return await getRegistration(id);
}

export async function listRegistrations() {
  const ids = (await redis.smembers("registrations:index")) || [];
  const rows = [];
  for (const id of ids) {
    const reg = await getRegistration(id);
    if (reg) rows.push(ensureRegistrationDefaults({ ...reg }));
  }
  return rows.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
}

function publicRegistrationState(reg) {
  return {
    id: reg.id,
    client_registration_id: reg.client_registration_id,
    full_name: reg.full_name,
    specialty: reg.specialty,
    phone: reg.phone,
    email: reg.email,
    clinic_name: reg.clinic_name,
    address: reg.address,
    wilaya: reg.wilaya,
    device_fingerprint: reg.device_fingerprint,
    app_version: reg.app_version,
    registered_at: reg.registered_at,
    synced_at: reg.synced_at,
    status: reg.status,
    license_id: reg.license_id || "",
    cloud_doctor_id: reg.cloud_doctor_id || "",
    created_at: reg.created_at,
    updated_at: reg.updated_at,
  };
}

// ---------- licenses ----------
export function ensureLicenseDefaults(license) {
  license.id = license.id || uuid();
  license.key_hash = cleanStr(license.key_hash, 64);
  license.key_hint = cleanStr(license.key_hint, 40);
  if (!LICENSE_TYPES.includes(license.license_type)) license.license_type = "lifetime";
  license.trial_days = license.license_type === "trial"
    ? Math.max(1, parseInt(license.trial_days, 10) || 7)
    : null;
  if (!LICENSE_STATUSES.includes(license.status)) license.status = "generated";
  license.registration_id = cleanStr(license.registration_id, 100);
  license.note = cleanStr(license.note, 300);
  license.device_fingerprint = cleanStr(license.device_fingerprint, 128);
  license.used_at = license.used_at || null;
  license.revoked_at = license.revoked_at || null;
  license.starts_at = license.starts_at || null;
  license.expires_at = license.expires_at || null;
  if (!license.created_at) license.created_at = nowIso();
  return license;
}

export async function getLicense(id) {
  if (!id) return null;
  return await redis.get(`license:${id}`);
}

export async function saveLicense(license) {
  license.updated_at = nowIso();
  await redis.set(`license:${license.id}`, license);
  if (license.key_hash) {
    await redis.set(`license:hash:${license.key_hash}`, license.id);
  }
}

export async function findLicenseByKey(rawKey) {
  const id = await redis.get(`license:hash:${hashSerialKey(rawKey)}`);
  if (!id) return null;
  return await getLicense(id);
}

export async function listLicenses() {
  const ids = (await redis.smembers("licenses:index")) || [];
  const rows = [];
  for (const id of ids) {
    const license = await getLicense(id);
    if (license) rows.push(ensureLicenseDefaults({ ...license }));
  }
  return rows.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
}

function publicLicenseState(license, registration = null) {
  return {
    id: license.id,
    key_hint: license.key_hint,
    license_type: license.license_type,
    trial_days: license.trial_days,
    status: license.status,
    registration_id: license.registration_id || "",
    registration_name: registration?.full_name || "",
    note: license.note || "",
    device_fingerprint: license.device_fingerprint || "",
    used_at: license.used_at,
    revoked_at: license.revoked_at,
    starts_at: license.starts_at,
    expires_at: license.expires_at,
    created_at: license.created_at,
    updated_at: license.updated_at,
  };
}

function computeExpiry(license, activatedAt) {
  if (license.license_type !== "trial") return { starts_at: activatedAt, expires_at: null };
  const start = new Date(activatedAt);
  const end = new Date(start.getTime() + license.trial_days * 24 * 60 * 60 * 1000);
  return { starts_at: start.toISOString(), expires_at: end.toISOString() };
}

async function buildActivationResponse(license, registration) {
  const payload = {
    v: 1,
    registration_id: registration.id,
    client_registration_id: registration.client_registration_id,
    license_id: license.id,
    license_type: license.license_type,
    trial_days: license.trial_days,
    activated_at: license.used_at,
    starts_at: license.starts_at,
    expires_at: license.expires_at,
    device_fingerprint: license.device_fingerprint || "",
    doctor_name: registration.full_name,
  };
  return {
    ok: true,
    activation_token: await signActivationToken(payload),
    license: {
      license_type: license.license_type,
      trial_days: license.trial_days,
      starts_at: license.starts_at,
      expires_at: license.expires_at,
      key_hint: license.key_hint,
    },
    registration_id: registration.id,
  };
}

// Merge fields sent by the desktop app into a registration record.
function applyRegistrationFields(reg, body) {
  const fields = ["full_name", "specialty", "phone", "email", "clinic_name",
    "address", "wilaya", "device_fingerprint", "app_version", "registered_at"];
  for (const field of fields) {
    if (body[field] !== undefined && cleanStr(body[field])) reg[field] = body[field];
  }
}

async function upsertRegistrationFromBody(body) {
  const clientId = cleanStr(body.client_registration_id, 100);
  if (!clientId) return { error: "client_registration_id requis" };
  let reg = await findRegistrationByClientId(clientId);
  if (reg) {
    reg = ensureRegistrationDefaults({ ...reg });
    applyRegistrationFields(reg, body);
    reg.synced_at = nowIso();
    ensureRegistrationDefaults(reg);
    await saveRegistration(reg);
    return { registration: reg, created: false };
  }
  reg = ensureRegistrationDefaults({ id: uuid(), client_registration_id: clientId });
  applyRegistrationFields(reg, body);
  ensureRegistrationDefaults(reg);
  if (!reg.full_name) return { error: "full_name requis" };
  await saveRegistration(reg);
  await redis.sadd("registrations:index", reg.id);
  return { registration: reg, created: true };
}

// ---------- stats ----------
export async function licensingStats() {
  const registrations = await listRegistrations();
  const licenses = await listLicenses();
  return {
    registrations_total: registrations.length,
    registrations_pending: registrations.filter((r) => r.status === "pending_activation").length,
    registrations_activated: registrations.filter((r) => r.status === "activated").length,
    licenses_total: licenses.length,
    licenses_generated: licenses.filter((l) => l.status === "generated").length,
    licenses_used: licenses.filter((l) => l.status === "used").length,
    licenses_revoked: licenses.filter((l) => l.status === "revoked").length,
    licenses_trial: licenses.filter((l) => l.license_type === "trial").length,
    licenses_lifetime: licenses.filter((l) => l.license_type === "lifetime").length,
  };
}

// =====================================================================
// Route handlers. Each returns true when the request was handled.
// ctx = { readJson, ok, err }
// =====================================================================

export async function handleLicensingPublicRoutes(req, res, path, ctx) {
  const { readJson, ok, err } = ctx;

  // Desktop app uploads an offline-created registration (idempotent).
  if (path === "/api/registrations/sync") {
    if (req.method !== "POST") { err(res, 405, "Method not allowed"); return true; }
    const body = await readJson(req);
    const result = await upsertRegistrationFromBody(body);
    if (result.error) { err(res, 400, result.error); return true; }
    ok(res, {
      ok: true,
      registration: publicRegistrationState(result.registration),
      created: result.created,
      message: result.created
        ? "Inscription reçue. Une clé d'activation vous sera envoyée après validation."
        : "Inscription déjà synchronisée.",
    }, result.created ? 201 : 200);
    return true;
  }

  // Desktop app activates with a serial key.
  if (path === "/api/activation/activate") {
    if (req.method !== "POST") { err(res, 405, "Method not allowed"); return true; }
    const body = await readJson(req);
    const rawKey = cleanStr(body.serial_key, 60);
    if (!serialKeyLooksValid(rawKey)) {
      err(res, 400, "Clé d'activation invalide. Vérifiez le format (MEDI-XXXX-XXXX-XXXX-XXXX).");
      return true;
    }

    // Make sure the registration exists server-side. The activate call carries the
    // registration fields too, so activation works even if a previous sync failed.
    const regResult = await upsertRegistrationFromBody(body);
    if (regResult.error) { err(res, 400, regResult.error); return true; }
    const registration = regResult.registration;
    const deviceFingerprint = cleanStr(body.device_fingerprint, 128);

    const stored = await findLicenseByKey(rawKey);
    if (!stored) { err(res, 404, "Clé d'activation inconnue. Vérifiez la clé reçue."); return true; }
    const license = ensureLicenseDefaults({ ...stored });

    if (license.status === "revoked") {
      err(res, 403, "Cette clé d'activation a été révoquée. Contactez le support MediSmart.");
      return true;
    }

    if (license.status === "used") {
      // Idempotent re-activation: the same registration, or the same physical
      // device (reinstall / corrupted local proof), may re-download the
      // activation proof. Anything else is a reuse attempt.
      const sameRegistration = license.registration_id === registration.id;
      const sameDevice = Boolean(license.device_fingerprint) && Boolean(deviceFingerprint)
        && license.device_fingerprint === deviceFingerprint;
      if (sameRegistration || sameDevice) {
        if (!sameRegistration) {
          // Same PC but a fresh local registration: re-link the license.
          license.registration_id = registration.id;
          await saveLicense(license);
          registration.status = "activated";
          registration.license_id = license.id;
          await saveRegistration(registration);
        }
        ok(res, await buildActivationResponse(license, registration));
        return true;
      }
      err(res, 409, "Cette clé d'activation a déjà été utilisée.");
      return true;
    }

    // status === "generated": enforce the doctor linkage when the key was
    // generated for a specific registration.
    if (license.registration_id && license.registration_id !== registration.id) {
      err(res, 403, "Cette clé n'est pas associée à ce compte. Contactez le support MediSmart.");
      return true;
    }

    const activatedAt = nowIso();
    const { starts_at, expires_at } = computeExpiry(license, activatedAt);
    license.status = "used";
    license.used_at = activatedAt;
    license.starts_at = starts_at;
    license.expires_at = expires_at;
    license.registration_id = registration.id;
    license.device_fingerprint = deviceFingerprint;
    await saveLicense(license);

    registration.status = "activated";
    registration.license_id = license.id;
    await saveRegistration(registration);

    ok(res, await buildActivationResponse(license, registration));
    return true;
  }

  // Desktop app re-validates a stored activation token (revocation check).
  if (path === "/api/activation/verify") {
    if (req.method !== "POST") { err(res, 405, "Method not allowed"); return true; }
    const body = await readJson(req);
    const payload = await verifyActivationToken(body.activation_token);
    if (!payload) { ok(res, { valid: false, reason: "invalid_token" }); return true; }
    const license = await getLicense(payload.license_id);
    if (!license) { ok(res, { valid: false, reason: "license_missing" }); return true; }
    if (license.status === "revoked") { ok(res, { valid: false, reason: "revoked" }); return true; }
    ok(res, {
      valid: true,
      license_type: license.license_type,
      starts_at: license.starts_at,
      expires_at: license.expires_at,
    });
    return true;
  }

  return false;
}

export async function handleLicensingAdminRoutes(req, res, path, ctx) {
  const { readJson, ok, err } = ctx;

  if (path === "/api/admin/stats" && req.method === "GET") {
    ok(res, { stats: await licensingStats() });
    return true;
  }

  if (path === "/api/admin/registrations" && req.method === "GET") {
    const registrations = await listRegistrations();
    const licenses = await listLicenses();
    const licenseMap = Object.fromEntries(licenses.map((l) => [l.id, l]));
    ok(res, {
      rows: registrations.map((reg) => ({
        ...publicRegistrationState(reg),
        license: reg.license_id && licenseMap[reg.license_id]
          ? publicLicenseState(licenseMap[reg.license_id])
          : null,
      })),
      stats: await licensingStats(),
    });
    return true;
  }

  const regMatch = path.match(/^\/api\/admin\/registrations\/([a-f0-9-]+)$/);
  if (regMatch && req.method === "DELETE") {
    const reg = await getRegistration(regMatch[1]);
    if (reg?.client_registration_id) {
      await redis.del(`registration:client:${reg.client_registration_id}`);
    }
    await redis.del(`registration:${regMatch[1]}`);
    await redis.srem("registrations:index", regMatch[1]);
    ok(res, { ok: true });
    return true;
  }

  if (path === "/api/admin/licenses" && req.method === "GET") {
    const licenses = await listLicenses();
    const registrations = await listRegistrations();
    const regMap = Object.fromEntries(registrations.map((r) => [r.id, r]));
    ok(res, {
      rows: licenses.map((license) => publicLicenseState(license, regMap[license.registration_id] || null)),
      stats: await licensingStats(),
    });
    return true;
  }

  // Generate a new serial key. The raw key is returned exactly once.
  if (path === "/api/admin/licenses" && req.method === "POST") {
    const body = await readJson(req);
    const licenseType = LICENSE_TYPES.includes(body.license_type) ? body.license_type : null;
    if (!licenseType) { err(res, 400, "license_type doit être 'trial' ou 'lifetime'"); return true; }

    let trialDays = null;
    if (licenseType === "trial") {
      trialDays = parseInt(body.trial_days, 10);
      if (!Number.isFinite(trialDays) || trialDays < 1 || trialDays > 3650) {
        err(res, 400, "trial_days requis pour une clé d'essai (1 à 3650 jours)");
        return true;
      }
    }

    let registration = null;
    const registrationId = cleanStr(body.registration_id, 100);
    if (registrationId) {
      registration = await getRegistration(registrationId);
      if (!registration) { err(res, 404, "Inscription introuvable"); return true; }
    }

    // Generate a unique key (hash collision check).
    let rawKey = "";
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = generateSerialKey();
      if (!(await redis.get(`license:hash:${hashSerialKey(candidate)}`))) { rawKey = candidate; break; }
    }
    if (!rawKey) { err(res, 500, "Impossible de générer une clé unique, réessayez"); return true; }

    const license = ensureLicenseDefaults({
      id: uuid(),
      key_hash: hashSerialKey(rawKey),
      key_hint: serialKeyHint(rawKey),
      license_type: licenseType,
      trial_days: trialDays,
      status: "generated",
      registration_id: registration ? registration.id : "",
      note: cleanStr(body.note, 300),
    });
    await saveLicense(license);
    await redis.sadd("licenses:index", license.id);

    ok(res, {
      ok: true,
      serial_key: rawKey, // shown once, never stored raw
      license: publicLicenseState(license, registration),
    }, 201);
    return true;
  }

  const revokeMatch = path.match(/^\/api\/admin\/licenses\/([a-f0-9-]+)\/revoke$/);
  if (revokeMatch && req.method === "POST") {
    const stored = await getLicense(revokeMatch[1]);
    if (!stored) { err(res, 404, "Licence introuvable"); return true; }
    const license = ensureLicenseDefaults({ ...stored });
    license.status = "revoked";
    license.revoked_at = nowIso();
    await saveLicense(license);
    ok(res, { ok: true, license: publicLicenseState(license) });
    return true;
  }

  const deleteMatch = path.match(/^\/api\/admin\/licenses\/([a-f0-9-]+)$/);
  if (deleteMatch && req.method === "DELETE") {
    const license = await getLicense(deleteMatch[1]);
    if (!license) { err(res, 404, "Licence introuvable"); return true; }
    if (license.status === "used") {
      err(res, 409, "Impossible de supprimer une clé déjà utilisée. Révoquez-la plutôt.");
      return true;
    }
    if (license.key_hash) await redis.del(`license:hash:${license.key_hash}`);
    await redis.del(`license:${license.id}`);
    await redis.srem("licenses:index", license.id);
    ok(res, { ok: true });
    return true;
  }

  return false;
}
