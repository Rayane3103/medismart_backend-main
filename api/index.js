// MediSmart AI Credits API - Single Render/Vercel-compatible Node handler.
// Handles the admin panel, doctor auth, usage limits, and Groq/Gemini proxying.

import crypto from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { redis, mgetExisting, cached, invalidate, withRequestCache } from "./redis.js";
import { ADMIN_CSS, ADMIN_HTML, ADMIN_JS } from "./admin-ui.js";
import {
  adminLogin,
  adminLogout,
  adminUsersConfigured,
  getAdminSession,
  verifyAdminRequest,
} from "./admin-auth.js";
import {
  handleLicensingPublicRoutes,
  handleLicensingAdminRoutes,
  getRegistration,
  saveRegistration,
  ensureRegistrationDefaults,
  verifyActivationToken,
  getLicense,
} from "./licensing.js";
import {
  handleUpdatesPublicRoutes,
  handleUpdatesAdminRoutes,
  handleUpdatesPublishRoute,
  verifyUpdatePublishToken,
} from "./updates.js";
import {
  handleInstallRequestPublicRoutes,
  handleInstallRequestAdminRoutes,
} from "./install-requests.js";
import { handleAiModelsAdminRoutes } from "./ai-models.js";
import { handleAiConnectorsAdminRoutes } from "./ai-connectors.js";
import { handleAiPromptsAdminRoutes } from "./ai-prompts.js";
import { handleAiCatalogAdminRoutes } from "./ai-catalog.js";
import { handleAiKnowledgeBaseAdminRoutes } from "./ai-knowledge-base.js";
import { handleAiFlagsAdminRoutes } from "./ai-flags.js";
import { handleAiPlansAdminRoutes } from "./ai-plans.js";
import { handleAiRouterAdminRoutes } from "./ai-router.js";
import { handleAiKeysAdminRoutes } from "./ai-keys.js";
import { handleAiUsageAdminRoutes } from "./ai-usage.js";
import { handleAiSettingsAdminRoutes } from "./ai-settings.js";
import { handleAiAuditAdminRoutes } from "./ai-audit.js";
import { handleAiBrainRoutes, handleAiPlaygroundRoute, handleAiFeedbackRoute } from "./ai-brain.js";
import { getCreditCosts, readLogs } from "./doctor-usage.js";

const CLOUD_NOT_PROVISIONED_MSG =
  "L'accès IA n'est pas encore activé. Contactez votre administrateur MediSmart.";

// The admin CSS/JS are cached hard and busted by content hash, so a deploy is
// picked up on the next normal load instead of leaving admins on stale code
// until the cache expires (or they know to hard-refresh).
const ASSET_VERSION = crypto.createHash("sha1").update(ADMIN_CSS + ADMIN_JS).digest("hex").slice(0, 10);
const ASSET_CACHE_CONTROL = "public, max-age=31536000, immutable";
let _adminHtml = null;
function adminHtml() {
  if (!_adminHtml) _adminHtml = ADMIN_HTML.replace(/__ASSET_VERSION__/g, ASSET_VERSION);
  return _adminHtml;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
let _logoBytes = null;
function adminLogoBytes() {
  if (!_logoBytes) {
    try {
      _logoBytes = readFileSync(join(__dirname, "assets", "medismart-logo.png"));
    } catch {
      _logoBytes = Buffer.alloc(0);
    }
  }
  return _logoBytes;
}

const AI_PROVIDERS = {
  groq: {
    label: "Groq",
    default_model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
  },
  gemini: {
    label: "Gemini",
    default_model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
  },
};

const DEFAULT_LIMITS = {
  monthly_limit: 500,
  daily_limit: 50,
};

const COMPAT_PLANS = {
  custom: { label: "Custom limits", monthly_credits: DEFAULT_LIMITS.monthly_limit, unlimited: false },
};

// ---------- helpers ----------
function uuid() { return crypto.randomUUID(); }
function nowIso() { return new Date().toISOString(); }
function today() { return new Date().toISOString().slice(0, 10); }

function nextRenewalDate(from = new Date()) {
  const d = new Date(from);
  d.setMonth(d.getMonth() + 1);
  d.setDate(Math.min(d.getDate(), 28));
  return d.toISOString().slice(0, 10);
}

function send(res, status, contentType, body, extraHeaders = {}) {
  res.status(status).setHeader("Content-Type", contentType);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Doctor-Token, X-Admin-Token, X-Update-Publish-Token");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  for (const [key, value] of Object.entries(extraHeaders)) res.setHeader(key, value);
  res.send(body);
}

function ok(res, body, status = 200) {
  send(res, status, "application/json", JSON.stringify(body));
}

function err(res, status, message) { ok(res, { error: message }, status); }

async function readJson(req) {
  return new Promise((resolve, reject) => {
    let buf = "";
    req.on("data", (c) => (buf += c));
    req.on("end", () => {
      if (!buf) return resolve({});
      try { resolve(JSON.parse(buf)); } catch (e) { reject(e); }
    });
    req.on("error", reject);
  });
}

function resolveRequestPath(req) {
  const host = req.headers.host || "localhost";
  const url = new URL(req.url || "/", `http://${host}`);

  // Vercel rewrite sends the real path as ?__path=... (see vercel.json).
  const rewritten = url.searchParams.get("__path");
  if (rewritten) {
    const clean = rewritten.startsWith("/") ? rewritten : `/${rewritten}`;
    return clean.replace(/\/+$/, "") || "/";
  }

  // Other platform headers (fallback).
  const headerPath = req.headers["x-vercel-original-path"]
    || req.headers["x-forwarded-uri"]
    || req.headers["x-original-url"];
  if (headerPath) {
    try {
      const parsed = headerPath.startsWith("http")
        ? new URL(headerPath)
        : new URL(headerPath, `http://${host}`);
      return parsed.pathname.replace(/\/+$/, "") || "/";
    } catch {
      const clean = String(headerPath).split("?")[0];
      return (clean.startsWith("/") ? clean : `/${clean}`).replace(/\/+$/, "") || "/";
    }
  }

  return url.pathname.replace(/\/+$/, "") || "/";
}

function normalizeProvider(provider) {
  const key = String(provider || "groq").toLowerCase().trim();
  return AI_PROVIDERS[key] ? key : "groq";
}

function cleanModel(value, provider) {
  const cleanProvider = normalizeProvider(provider);
  const model = String(value || "").trim();
  return model || AI_PROVIDERS[cleanProvider].default_model;
}

function toLimit(value, fallback) {
  const parsed = parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, parsed);
}

function providerConfig() {
  return Object.fromEntries(Object.entries(AI_PROVIDERS).map(([key, value]) => [key, {
    label: value.label,
    default_model: value.default_model,
  }]));
}

async function verifyAdmin(req) {
  const session = await verifyAdminRequest(req);
  return Boolean(session);
}

async function verifyAdminSession(req) {
  return verifyAdminRequest(req);
}

async function verifyDoctor(req) {
  const token = (req.headers["x-doctor-token"] || "").toString().trim();
  if (!token) return null;
  const doctorId = await redis.get(`doctor:token:${token}`);
  if (!doctorId) return null;
  return await getDoctor(doctorId);
}

// ---------- named AI keys ----------
async function getApiKey(keyId) {
  if (!keyId) return null;
  return await redis.get(`api_key:${keyId}`);
}

async function saveApiKey(apiKey) {
  apiKey.updated_at = nowIso();
  await redis.set(`api_key:${apiKey.id}`, apiKey);
  invalidate("api_keys");
}

async function listApiKeyIds() {
  return (await redis.smembers("api_keys:index")) || [];
}

async function indexApiKey(keyId) {
  await redis.sadd("api_keys:index", keyId);
}

async function removeApiKey(keyId) {
  await redis.del(`api_key:${keyId}`);
  await redis.srem("api_keys:index", keyId);
  invalidate("api_keys");
}

async function listApiKeys() {
  return cached("api_keys", async () => {
    const ids = await listApiKeyIds();
    const stored = await mgetExisting(ids.map((id) => `api_key:${id}`));
    const rows = stored.map((key) => migrate(key, ensureApiKeyDefaults));
    await persistMigrated(rows, saveApiKey);
    return rows.map((r) => r.row).sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  });
}

// ensure*Defaults doubles as a lazy migration for older records. Run it on a
// copy and report whether it actually changed anything, so a plain read does
// not write every row back to Redis.
function migrate(stored, ensureDefaults) {
  const before = JSON.stringify(stored);
  const row = ensureDefaults({ ...stored });
  return { row, dirty: JSON.stringify(row) !== before };
}

async function persistMigrated(results, save) {
  const dirty = results.filter((r) => r.dirty).map((r) => r.row);
  if (dirty.length) await Promise.all(dirty.map((row) => save(row)));
}

function ensureApiKeyDefaults(apiKey) {
  apiKey.id = apiKey.id || uuid();
  apiKey.name = String(apiKey.name || "AI Key").trim() || "AI Key";
  apiKey.provider = normalizeProvider(apiKey.provider);
  apiKey.model = cleanModel(apiKey.model, apiKey.provider);
  if (typeof apiKey.api_key !== "string") apiKey.api_key = "";
  if (typeof apiKey.active !== "boolean") apiKey.active = true;
  if (!apiKey.created_at) apiKey.created_at = nowIso();
  return apiKey;
}

function publicApiKeyState(apiKey, assignedCount = 0) {
  const provider = normalizeProvider(apiKey.provider);
  return {
    id: apiKey.id,
    name: apiKey.name || "",
    provider,
    provider_label: AI_PROVIDERS[provider].label,
    model: cleanModel(apiKey.model, provider),
    active: !!apiKey.active,
    has_key: Boolean(apiKey.api_key),
    assigned_count: assignedCount,
    created_at: apiKey.created_at,
    updated_at: apiKey.updated_at,
  };
}

function assignedCounts(doctors) {
  const counts = {};
  for (const doctor of doctors) {
    if (doctor.assigned_api_key_id) counts[doctor.assigned_api_key_id] = (counts[doctor.assigned_api_key_id] || 0) + 1;
  }
  return counts;
}

// ---------- doctor records ----------
async function getDoctor(doctorId) {
  const data = await redis.get(`doctor:${doctorId}`);
  return data || null;
}

async function saveDoctor(doctor) {
  doctor.updated_at = nowIso();
  await redis.set(`doctor:${doctor.id}`, doctor);
  invalidate("doctors");
}

async function listDoctorIds() {
  return (await redis.smembers("doctors:index")) || [];
}

async function indexDoctor(doctorId) {
  await redis.sadd("doctors:index", doctorId);
}

async function listDoctors() {
  return cached("doctors", async () => {
    const ids = await listDoctorIds();
    const stored = await mgetExisting(ids.map((id) => `doctor:${id}`));
    const rows = stored.map((doctor) => migrate(doctor, ensureDoctorDefaults));
    await persistMigrated(rows, saveDoctor);
    return rows.map((r) => r.row).sort((a, b) => (a.email || "").localeCompare(b.email || ""));
  });
}

function displayNameFromEmail(email) {
  const clean = String(email || "").trim();
  if (!clean) return "Doctor";
  return clean.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function ensureDoctorDefaults(doctor) {
  doctor.id = doctor.id || uuid();
  doctor.email = String(doctor.email || "").trim();
  doctor.name = String(doctor.name || displayNameFromEmail(doctor.email)).trim() || displayNameFromEmail(doctor.email);
  if (!doctor.secret) doctor.secret = crypto.randomBytes(12).toString("hex");

  doctor.monthly_limit = toLimit(doctor.monthly_limit ?? doctor.monthly_credits, DEFAULT_LIMITS.monthly_limit);
  doctor.daily_limit = toLimit(doctor.daily_limit, DEFAULT_LIMITS.daily_limit);
  doctor.monthly_used = toLimit(doctor.monthly_used ?? doctor.used_credits, 0);
  doctor.daily_used = toLimit(doctor.daily_used, 0);
  doctor.assigned_api_key_id = String(doctor.assigned_api_key_id || doctor.api_key_id || "").trim();
  doctor.ai_plan_id = String(doctor.ai_plan_id || "").trim();

  if (typeof doctor.ai_enabled !== "boolean") doctor.ai_enabled = true;
  if (typeof doctor.active !== "boolean") doctor.active = true;
  if (!doctor.renewal_date) doctor.renewal_date = nextRenewalDate();
  if (!doctor.daily_usage_date) doctor.daily_usage_date = today();
  if (!doctor.created_at) doctor.created_at = nowIso();

  if (doctor.renewal_date && doctor.renewal_date <= today()) {
    doctor.monthly_used = 0;
    doctor.renewal_date = nextRenewalDate();
  }
  if (doctor.daily_usage_date !== today()) {
    doctor.daily_used = 0;
    doctor.daily_usage_date = today();
  }

  // Compatibility aliases for older doctor clients.
  doctor.monthly_credits = doctor.monthly_limit;
  doctor.used_credits = doctor.monthly_used;
  doctor.unlimited = false;
  return doctor;
}

function publicDoctorState(doctor, apiKey = null) {
  const monthlyRemaining = Math.max(0, (doctor.monthly_limit || 0) - (doctor.monthly_used || 0));
  const dailyRemaining = Math.max(0, (doctor.daily_limit || 0) - (doctor.daily_used || 0));
  return {
    doctor_id: doctor.id,
    name: doctor.name || "",
    email: doctor.email || "",
    active: !!doctor.active,
    ai_enabled: !!doctor.ai_enabled,
    assigned_api_key_id: doctor.assigned_api_key_id || "",
    assigned_api_key_name: apiKey?.name || "",
    assigned_api_key_active: !!apiKey?.active,
    has_assigned_api_key: Boolean(apiKey?.api_key),
    ai_provider: apiKey ? normalizeProvider(apiKey.provider) : "",
    ai_provider_label: apiKey ? AI_PROVIDERS[normalizeProvider(apiKey.provider)].label : "",
    ai_model: apiKey ? cleanModel(apiKey.model, apiKey.provider) : "",
    monthly_limit: doctor.monthly_limit || 0,
    monthly_used: doctor.monthly_used || 0,
    monthly_remaining: monthlyRemaining,
    daily_limit: doctor.daily_limit || 0,
    daily_used: doctor.daily_used || 0,
    daily_remaining: dailyRemaining,
    daily_usage_date: doctor.daily_usage_date,
    renewal_date: doctor.renewal_date,
    // Compatibility aliases.
    plan_name: "custom",
    plan_label: "Custom",
    monthly_credits: doctor.monthly_limit || 0,
    used_credits: doctor.monthly_used || 0,
    remaining_credits: monthlyRemaining,
    unlimited: false,
  };
}

function adminDoctorState(doctor, apiKey = null) {
  return {
    ...publicDoctorState(doctor, apiKey),
    id: doctor.id,
    secret: doctor.secret || "",
  };
}

async function publicDoctorWithAssignedKey(doctor) {
  const apiKey = await getApiKey(doctor.assigned_api_key_id);
  return publicDoctorState(doctor, apiKey);
}

async function adminDoctorWithAssignedKey(doctor) {
  const apiKey = await getApiKey(doctor.assigned_api_key_id);
  return adminDoctorState(doctor, apiKey);
}

function applyDoctorUpdate(doctor, body) {
  if (body.email !== undefined) doctor.email = String(body.email || "").trim();
  if (body.name !== undefined) doctor.name = String(body.name || "").trim() || displayNameFromEmail(doctor.email);
  if (body.monthly_limit !== undefined) doctor.monthly_limit = toLimit(body.monthly_limit, doctor.monthly_limit || DEFAULT_LIMITS.monthly_limit);
  if (body.daily_limit !== undefined) doctor.daily_limit = toLimit(body.daily_limit, doctor.daily_limit || DEFAULT_LIMITS.daily_limit);
  if (body.assigned_api_key_id !== undefined) doctor.assigned_api_key_id = String(body.assigned_api_key_id || "").trim();
  if (body.ai_plan_id !== undefined) doctor.ai_plan_id = String(body.ai_plan_id || "").trim();
  if (body.api_key_id !== undefined) doctor.assigned_api_key_id = String(body.api_key_id || "").trim();
  if (body.ai_enabled !== undefined) doctor.ai_enabled = !!body.ai_enabled;
  if (body.active !== undefined) doctor.active = !!body.active;
  if (typeof body.set_monthly_used === "number") doctor.monthly_used = Math.max(0, parseInt(body.set_monthly_used, 10));
  if (typeof body.set_daily_used === "number") doctor.daily_used = Math.max(0, parseInt(body.set_daily_used, 10));
  if (body.reset_monthly === true) {
    doctor.monthly_used = 0;
    doctor.renewal_date = nextRenewalDate();
  }
  if (body.reset_daily === true) {
    doctor.daily_used = 0;
    doctor.daily_usage_date = today();
  }
}

// ---------- main router ----------
// Each request gets its own cache so the collection helpers can be called
// freely by the stats builders without re-reading Redis. It is discarded when
// the request ends and is never shared between requests.
export default function handler(req, res) {
  return withRequestCache(() => handleRequest(req, res));
}

async function handleRequest(req, res) {
  try {
    if (req.method === "OPTIONS") return ok(res, {});

    const path = resolveRequestPath(req);

    // ---- admin frontend ----
    if (req.method === "GET" && (path === "/" || path === "/admin")) {
      // Never cache the HTML: it carries the asset version that busts the rest.
      return send(res, 200, "text/html; charset=utf-8", adminHtml(), { "Cache-Control": "no-cache" });
    }
    if (req.method === "GET" && path === "/admin.css") {
      return send(res, 200, "text/css; charset=utf-8", ADMIN_CSS, { "Cache-Control": ASSET_CACHE_CONTROL });
    }
    if (req.method === "GET" && path === "/admin.js") {
      return send(res, 200, "text/javascript; charset=utf-8", ADMIN_JS, { "Cache-Control": ASSET_CACHE_CONTROL });
    }
    if (req.method === "GET" && (path === "/admin/logo.png" || path === "/logo.png")) {
      const logo = adminLogoBytes();
      if (!logo.length) return err(res, 404, "Logo introuvable");
      return send(res, 200, "image/png", logo, { "Cache-Control": "public, max-age=86400" });
    }

    // ---- public ----
    if (path === "/api" || path === "/api/health") {
      return ok(res, {
        ok: true,
        service: "medismart-ai-credits",
        providers: providerConfig(),
        default_limits: DEFAULT_LIMITS,
        features: {
          licensing: true,
          registration_sync: true,
          activation: true,
          updates: true,
          entitlements: true,
        },
      });
    }

    if (path === "/api/plans") {
      return ok(res, { plans: COMPAT_PLANS, credit_costs: await getCreditCosts(), providers: providerConfig(), default_limits: DEFAULT_LIMITS });
    }

    // ---- licensing: registration sync + serial key activation (public) ----
    if (await handleLicensingPublicRoutes(req, res, path, { readJson, ok, err })) return;

    // ---- updates: desktop check / entitlements / heartbeat (public) ----
    if (await handleUpdatesPublicRoutes(req, res, path, { readJson, ok, err })) return;

    // ---- install demands from the landing page (public) ----
    if (await handleInstallRequestPublicRoutes(req, res, path, { readJson, ok, err })) return;

    // ---- CI release publish with UPDATE_PUBLISH_TOKEN (no admin session needed) ----
    if (path === "/api/admin/releases/publish" && req.method === "POST") {
      if (verifyUpdatePublishToken(req)) {
        if (await handleUpdatesPublishRoute(req, res, path, { readJson, ok, err })) return;
      }
      // else fall through to admin session auth below
    }

    // ---- admin sign-in (public) ----
    if (path === "/api/admin/login" && req.method === "POST") {
      const body = await readJson(req);
      const result = await adminLogin(body.username, body.password);
      if (!result.ok) return err(res, 401, result.error);
      return ok(res, { ok: true, token: result.token, user: result.user });
    }

    // ---- doctor authentication via activation proof (desktop auto-connect) ----
    if (path === "/api/auth/cloud-session") {
      if (req.method !== "POST") return err(res, 405, "Method not allowed");
      const body = await readJson(req);
      const activationToken = String(body.activation_token || "").trim();
      const clientRegistrationId = String(body.client_registration_id || "").trim();
      const deviceFingerprint = String(body.device_fingerprint || "").trim();
      if (!activationToken || !clientRegistrationId) {
        return err(res, 400, "activation_token and client_registration_id required");
      }

      const payload = await verifyActivationToken(activationToken);
      if (!payload) return err(res, 401, "Preuve d'activation invalide");

      if (String(payload.client_registration_id || "") !== clientRegistrationId) {
        return err(res, 403, "Inscription non concordante");
      }

      const registration = await getRegistration(payload.registration_id);
      if (!registration) return err(res, 404, "Inscription introuvable");
      const reg = ensureRegistrationDefaults({ ...registration });

      const allowedDevices = new Set(
        [String(payload.device_fingerprint || "").trim(), reg.device_fingerprint].filter(Boolean),
      );
      if (deviceFingerprint && allowedDevices.size && !allowedDevices.has(deviceFingerprint)) {
        return err(res, 403, "Appareil non autorisé pour ce compte");
      }

      const license = await getLicense(payload.license_id);
      if (!license || license.status === "revoked") {
        return err(res, 403, "Licence révoquée ou introuvable");
      }
      if (license.license_type === "trial" && license.expires_at) {
        if (Date.now() >= new Date(license.expires_at).getTime()) {
          return err(res, 403, "Période d'essai expirée");
        }
      }

      if (!reg.cloud_doctor_id) return err(res, 403, CLOUD_NOT_PROVISIONED_MSG);

      const doctor = await getDoctor(reg.cloud_doctor_id);
      if (!doctor) return err(res, 403, CLOUD_NOT_PROVISIONED_MSG);

      const fresh = ensureDoctorDefaults({ ...doctor });
      if (!fresh.active) return err(res, 403, "Compte IA inactif. Contactez votre administrateur MediSmart.");
      if (!fresh.ai_enabled) return err(res, 403, "IA désactivée pour ce compte. Contactez votre administrateur MediSmart.");

      await saveDoctor(fresh);
      const token = uuid();
      await redis.set(`doctor:token:${token}`, fresh.id, { ex: 60 * 60 * 24 * 7 });
      return ok(res, { token, doctor: await publicDoctorWithAssignedKey(fresh), provisioned: true });
    }

    // ---- doctor authentication: exchange uuid+secret for session token (legacy/scripts) ----
    if (path === "/api/auth/doctor") {
      if (req.method !== "POST") return err(res, 405, "Method not allowed");
      const { doctor_id, secret } = await readJson(req);
      if (!doctor_id || !secret) return err(res, 400, "doctor_id and secret required");
      const doctor = await getDoctor(doctor_id);
      if (!doctor || !doctor.active) return err(res, 401, "Compte inactif ou inconnu");
      if (doctor.secret !== secret) return err(res, 401, "Identifiants incorrects");
      const fresh = ensureDoctorDefaults({ ...doctor });
      await saveDoctor(fresh);
      const token = uuid();
      await redis.set(`doctor:token:${token}`, fresh.id, { ex: 60 * 60 * 24 * 7 });
      return ok(res, { token, doctor: await publicDoctorWithAssignedKey(fresh) });
    }

    // ---- doctor: their own subscription ----
    if (path === "/api/me/subscription") {
      const doctor = await verifyDoctor(req);
      if (!doctor) return err(res, 401, "Token medecin invalide");
      const fresh = ensureDoctorDefaults({ ...doctor });
      await saveDoctor(fresh);
      return ok(res, { ...(await publicDoctorWithAssignedKey(fresh)), plans: COMPAT_PLANS, credit_costs: await getCreditCosts(), providers: providerConfig() });
    }

    if (path === "/api/me/logs") {
      const doctor = await verifyDoctor(req);
      if (!doctor) return err(res, 401, "Token medecin invalide");
      const logs = await readLogs(doctor.id, 100);
      const total_used = logs.reduce((s, l) => s + (l.credits_used || 0), 0);
      const byDay = {};
      for (const l of logs) {
        const day = (l.created_at || "").slice(0, 10);
        byDay[day] = (byDay[day] || 0) + (l.credits_used || 0);
      }
      const daily = Object.entries(byDay).map(([day, credits]) => ({ day, credits }))
        .sort((a, b) => b.day.localeCompare(a.day)).slice(0, 30);
      return ok(res, { rows: logs.slice(0, 50), total_used, daily });
    }

    // ---- doctor: AI chat / document analysis ----
    // Fully owned by the AI Management brain (api/ai-brain.js): license/
    // subscription validation, prompt library + versioning, model router
    // (+ fallback chain), AI plan model gating, feature flags, guideline
    // injection, provider call, usage/cost/log recording. Same public paths
    // and response shapes the desktop app already calls - refactored
    // in-place rather than duplicated under a second endpoint.
    if (await handleAiBrainRoutes(req, res, path, { readJson, ok, err })) return;
    if (await handleAiFeedbackRoute(req, res, path, { readJson, ok, err })) return;

    // =============================================================
    // SUPER ADMIN ENDPOINTS (require X-Admin-Token)
    // =============================================================
    if (path.startsWith("/api/admin/")) {
      const session = await verifyAdminSession(req);
      if (!session) return err(res, 401, "Session administrateur invalide ou expirée");

      if (path === "/api/admin/logout" && req.method === "POST") {
        const token = (req.headers["x-admin-token"] || "").toString().trim();
        await adminLogout(token);
        return ok(res, { ok: true });
      }

      if (path === "/api/admin/me" && req.method === "GET") {
        return ok(res, {
          ok: true,
          user: session,
          auth_configured: adminUsersConfigured(),
        });
      }

      // Licensing admin routes (registrations, licenses, stats).
      if (await handleLicensingAdminRoutes(req, res, path, { readJson, ok, err })) return;

      // Update control plane (releases, entitlements, telemetry).
      if (await handleUpdatesAdminRoutes(req, res, path, {
        readJson,
        ok,
        err,
        adminUsername: session.username || "",
        adminSession: session,
      })) return;

      // Install demands (landing-page leads).
      if (await handleInstallRequestAdminRoutes(req, res, path, { readJson, ok, err })) return;

      // ---- AI Management admin routes (models, prompts, specialties,
      // clinical tasks, guidelines, flags, plans, router, keys, usage,
      // costs, logs, audit, settings, testing playground). ----
      const aiCtx = { readJson, ok, err, session, send };
      if (await handleAiConnectorsAdminRoutes(req, res, path, aiCtx)) return;
      if (await handleAiModelsAdminRoutes(req, res, path, aiCtx)) return;
      if (await handleAiPromptsAdminRoutes(req, res, path, aiCtx)) return;
      if (await handleAiCatalogAdminRoutes(req, res, path, aiCtx)) return;
      if (await handleAiKnowledgeBaseAdminRoutes(req, res, path, aiCtx)) return;
      if (await handleAiFlagsAdminRoutes(req, res, path, aiCtx)) return;
      if (await handleAiPlansAdminRoutes(req, res, path, aiCtx)) return;
      if (await handleAiRouterAdminRoutes(req, res, path, aiCtx)) return;
      if (await handleAiKeysAdminRoutes(req, res, path, aiCtx)) return;
      if (await handleAiUsageAdminRoutes(req, res, path, aiCtx)) return;
      if (await handleAiSettingsAdminRoutes(req, res, path, aiCtx)) return;
      if (await handleAiAuditAdminRoutes(req, res, path, aiCtx)) return;
      if (await handleAiPlaygroundRoute(req, res, path, aiCtx)) return;

      // Same publish endpoint also usable with admin session.
      if (await handleUpdatesPublishRoute(req, res, path, {
        readJson,
        ok,
        err,
        adminUsername: session.username || "",
        adminSession: session,
      })) return;

      // Create a cloud AI doctor account from a synced registration and link them.
      const cloudDoctorMatch = path.match(/^\/api\/admin\/registrations\/([a-f0-9-]+)\/create-cloud-doctor$/);
      if (cloudDoctorMatch && req.method === "POST") {
        const registration = await getRegistration(cloudDoctorMatch[1]);
        if (!registration) return err(res, 404, "Inscription introuvable");
        const reg = ensureRegistrationDefaults({ ...registration });
        if (reg.cloud_doctor_id && await getDoctor(reg.cloud_doctor_id)) {
          return err(res, 409, "Un compte IA est déjà lié à cette inscription");
        }
        const body = await readJson(req);
        const doctor = ensureDoctorDefaults({
          id: uuid(),
          email: String(body.email || reg.email || "").trim(),
          name: String(body.name || reg.full_name || "").trim(),
          secret: crypto.randomBytes(12).toString("hex"),
          registration_id: reg.id,
          monthly_limit: toLimit(body.monthly_limit, DEFAULT_LIMITS.monthly_limit),
          daily_limit: toLimit(body.daily_limit, DEFAULT_LIMITS.daily_limit),
          assigned_api_key_id: String(body.assigned_api_key_id || "").trim(),
          ai_enabled: body.ai_enabled !== false,
          active: body.active !== false,
        });
        await saveDoctor(doctor);
        await indexDoctor(doctor.id);
        reg.cloud_doctor_id = doctor.id;
        await saveRegistration(reg);
        const doctorPublic = await adminDoctorWithAssignedKey(doctor);
        delete doctorPublic.secret;
        return ok(res, { doctor: doctorPublic, registration_id: reg.id }, 201);
      }

      if (path === "/api/admin/health") {
        return ok(res, {
          ok: true,
          doctors: (await listDoctorIds()).length,
          api_keys: (await listApiKeyIds()).length,
          providers: providerConfig(),
          admin: session.username,
        });
      }

      if (path === "/api/admin/providers") {
        return ok(res, { providers: providerConfig() });
      }

      // Named API keys
      if (path === "/api/admin/api-keys" && req.method === "GET") {
        const doctors = await listDoctors();
        const counts = assignedCounts(doctors);
        const keys = await listApiKeys();
        return ok(res, { rows: keys.map((key) => publicApiKeyState(key, counts[key.id] || 0)), providers: providerConfig() });
      }

      if (path === "/api/admin/api-keys" && req.method === "POST") {
        const body = await readJson(req);
        if (!String(body.name || "").trim()) return err(res, 400, "Nom de cle requis");
        if (!String(body.api_key || "").trim()) return err(res, 400, "Secret API requis");
        const provider = normalizeProvider(body.provider);
        const apiKey = ensureApiKeyDefaults({
          id: uuid(),
          name: String(body.name || "").trim(),
          provider,
          model: cleanModel(body.model, provider),
          api_key: String(body.api_key || "").trim(),
          active: body.active !== false,
        });
        await saveApiKey(apiKey);
        await indexApiKey(apiKey.id);
        return ok(res, { api_key: publicApiKeyState(apiKey) }, 201);
      }

      const apiKeyMatch = path.match(/^\/api\/admin\/api-keys\/([a-f0-9-]+)$/);
      if (apiKeyMatch && (req.method === "PUT" || req.method === "PATCH")) {
        const keyId = apiKeyMatch[1];
        const apiKey = await getApiKey(keyId);
        if (!apiKey) return err(res, 404, "Cle API introuvable");
        const fresh = ensureApiKeyDefaults({ ...apiKey });
        const body = await readJson(req);
        if (body.name !== undefined) fresh.name = String(body.name || "").trim() || fresh.name;
        if (body.provider !== undefined) fresh.provider = normalizeProvider(body.provider);
        if (body.model !== undefined) fresh.model = cleanModel(body.model, fresh.provider);
        if (body.api_key !== undefined && String(body.api_key || "").trim()) fresh.api_key = String(body.api_key || "").trim();
        if (body.clear_api_key === true) fresh.api_key = "";
        if (body.active !== undefined) fresh.active = !!body.active;
        await saveApiKey(fresh);
        return ok(res, { api_key: publicApiKeyState(fresh) });
      }

      if (apiKeyMatch && req.method === "DELETE") {
        await removeApiKey(apiKeyMatch[1]);
        return ok(res, { ok: true });
      }

      // List all doctors
      if (path === "/api/admin/doctors" && req.method === "GET") {
        const doctors = await listDoctors();
        const keys = await listApiKeys();
        const keyMap = Object.fromEntries(keys.map((key) => [key.id, key]));
        const counts = assignedCounts(doctors);
        return ok(res, {
          rows: doctors.map((doctor) => adminDoctorState(doctor, keyMap[doctor.assigned_api_key_id] || null)),
          api_keys: keys.map((key) => publicApiKeyState(key, counts[key.id] || 0)),
          providers: providerConfig(),
          default_limits: DEFAULT_LIMITS,
        });
      }

      // Create doctor
      if (path === "/api/admin/doctors" && req.method === "POST") {
        const body = await readJson(req);
        if (!String(body.email || "").trim()) return err(res, 400, "Email requis");
        const doctor = ensureDoctorDefaults({
          id: uuid(),
          email: String(body.email || "").trim(),
          name: String(body.name || "").trim() || displayNameFromEmail(body.email),
          secret: crypto.randomBytes(12).toString("hex"),
          monthly_limit: toLimit(body.monthly_limit, DEFAULT_LIMITS.monthly_limit),
          daily_limit: toLimit(body.daily_limit, DEFAULT_LIMITS.daily_limit),
          assigned_api_key_id: String(body.assigned_api_key_id || body.api_key_id || "").trim(),
          ai_enabled: body.ai_enabled !== false,
          active: body.active !== false,
        });
        await saveDoctor(doctor);
        await indexDoctor(doctor.id);
        return ok(res, { doctor: await adminDoctorWithAssignedKey(doctor) }, 201);
      }

      // Update doctor
      const updateMatch = path.match(/^\/api\/admin\/doctors\/([a-f0-9-]+)$/);
      if (updateMatch && (req.method === "PUT" || req.method === "PATCH")) {
        const id = updateMatch[1];
        const doctor = await getDoctor(id);
        if (!doctor) return err(res, 404, "Medecin introuvable");
        const fresh = ensureDoctorDefaults({ ...doctor });
        const body = await readJson(req);
        applyDoctorUpdate(fresh, body);
        const normalized = ensureDoctorDefaults(fresh);
        await saveDoctor(normalized);
        return ok(res, { doctor: await adminDoctorWithAssignedKey(normalized) });
      }

      // Delete doctor
      if (updateMatch && req.method === "DELETE") {
        const id = updateMatch[1];
        await redis.del(`doctor:${id}`);
        await redis.srem("doctors:index", id);
        await redis.del(`logs:${id}`);
        invalidate("doctors");
        return ok(res, { ok: true });
      }

      // Logs for one doctor
      const logsMatch = path.match(/^\/api\/admin\/doctors\/([a-f0-9-]+)\/logs$/);
      if (logsMatch) {
        const logs = await readLogs(logsMatch[1], 200);
        return ok(res, { rows: logs });
      }

      return err(res, 404, "Route admin inconnue");
    }

    return err(res, 404, "Route inconnue");
  } catch (e) {
    return err(res, 500, e.message || "Erreur serveur");
  }
}
