// MediSmart update control plane: releases, paid entitlements, desktop check/heartbeat.
//
// Storage (Upstash Redis):
//   releases:index                         set of release ids
//   release:{id}                           release JSON
//   release:version:{channel}:{version}    release id
//   releases:channel:{channel}:latest      release id (highest published SemVer)
//   entitlements:registration:{regId}      set of SKUs
//   entitlement:{regId}:{sku}              entitlement JSON
//   update:heartbeat:{regId}               last heartbeat JSON
//   update:heartbeats:index                set of registration ids
//   update:signing_secret                  HMAC secret (unless UPDATE_SIGNING_SECRET / LICENSE_SIGNING_SECRET)

import crypto from "node:crypto";
import { redis } from "./redis.js";
import {
  findRegistrationByClientId,
  getRegistration,
  saveRegistration,
  ensureRegistrationDefaults,
  verifyActivationToken,
  listRegistrations,
} from "./licensing.js";

export const UPDATE_CHANNELS = ["stable", "beta", "internal"];
export const UPDATE_SEVERITIES = ["mandatory", "paid", "paid_mandatory"];
export const UPDATE_RELEASE_STATUSES = ["draft", "published", "yanked"];
export const DEFAULT_PAID_SKU = "premium_2026";

function nowIso() { return new Date().toISOString(); }
function uuid() { return crypto.randomUUID(); }

function cleanStr(value, maxLen = 200) {
  return String(value ?? "").trim().slice(0, maxLen);
}

function cleanArr(value, maxItems = 200, maxLen = 100) {
  if (!Array.isArray(value)) return [];
  return value.map((v) => cleanStr(v, maxLen)).filter(Boolean).slice(0, maxItems);
}

// ---------- SemVer ----------
export function parseSemver(raw) {
  const text = String(raw || "").trim().replace(/^v/i, "");
  const m = text.match(/^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/);
  if (!m) return null;
  return { major: +m[1], minor: +m[2], patch: +m[3], raw: text };
}

export function compareSemver(a, b) {
  const left = typeof a === "string" ? parseSemver(a) : a;
  const right = typeof b === "string" ? parseSemver(b) : b;
  if (!left || !right) return 0;
  if (left.major !== right.major) return left.major - right.major;
  if (left.minor !== right.minor) return left.minor - right.minor;
  return left.patch - right.patch;
}

export function isNewerVersion(candidate, current) {
  return compareSemver(candidate, current) > 0;
}

// ---------- signing (entitlement proofs) ----------
async function getUpdateSigningSecret() {
  const configured = String(
    process.env.UPDATE_SIGNING_SECRET
    || process.env.LICENSE_SIGNING_SECRET
    || ""
  ).trim();
  if (configured) return configured;
  let secret = await redis.get("update:signing_secret");
  if (!secret) {
    secret = crypto.randomBytes(32).toString("hex");
    await redis.set("update:signing_secret", secret);
  }
  return secret;
}

function b64url(buf) {
  return Buffer.from(buf).toString("base64url");
}

export async function signEntitlementProof(payload) {
  const secret = await getUpdateSigningSecret();
  const body = b64url(JSON.stringify(payload));
  const sig = crypto.createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export async function verifyEntitlementProof(token) {
  const parts = String(token || "").split(".");
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  const secret = await getUpdateSigningSecret();
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

export function updatePublishTokenConfigured() {
  return Boolean(String(process.env.UPDATE_PUBLISH_TOKEN || "").trim());
}

export function verifyUpdatePublishToken(req) {
  const expected = String(process.env.UPDATE_PUBLISH_TOKEN || "").trim();
  if (!expected) return false;
  const provided = String(
    req.headers["x-update-publish-token"]
    || req.headers["x-admin-token"]
    || ""
  ).trim();
  if (!provided || provided.length !== expected.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
  } catch {
    return false;
  }
}

// ---------- releases ----------
export function ensureReleaseDefaults(release) {
  const row = { ...release };
  row.id = row.id || uuid();
  row.version = cleanStr(row.version, 40).replace(/^v/i, "");
  row.channel = UPDATE_CHANNELS.includes(row.channel) ? row.channel : "stable";
  row.severity = UPDATE_SEVERITIES.includes(row.severity) ? row.severity : "mandatory";
  row.status = UPDATE_RELEASE_STATUSES.includes(row.status) ? row.status : "draft";
  row.notes = cleanStr(row.notes, 4000);
  row.sku = cleanStr(row.sku, 80);
  if ((row.severity === "paid" || row.severity === "paid_mandatory") && !row.sku) {
    row.sku = DEFAULT_PAID_SKU;
  }
  let rollout = parseInt(row.rollout_percent, 10);
  if (!Number.isFinite(rollout)) rollout = 100;
  row.rollout_percent = Math.max(0, Math.min(100, rollout));
  row.allowlist_registration_ids = cleanArr(row.allowlist_registration_ids);
  row.denylist_registration_ids = cleanArr(row.denylist_registration_ids);
  row.artifact_url = cleanStr(row.artifact_url, 1000);
  row.artifact_signature = cleanStr(row.artifact_signature, 8000);
  row.platform = cleanStr(row.platform, 40) || "windows-x86_64";
  row.pub_date = cleanStr(row.pub_date, 40) || nowIso();
  row.migration_risk = ["low", "high"].includes(row.migration_risk) ? row.migration_risk : "low";
  row.backup_recommended = Boolean(row.backup_recommended) || row.migration_risk === "high";
  row.min_version = cleanStr(row.min_version, 40);
  row.created_at = cleanStr(row.created_at, 40) || nowIso();
  row.updated_at = cleanStr(row.updated_at, 40) || row.created_at;
  row.published_at = cleanStr(row.published_at, 40);
  return row;
}

export function publicReleaseState(release, { includeArtifacts = false } = {}) {
  const base = {
    id: release.id,
    version: release.version,
    channel: release.channel,
    severity: release.severity,
    status: release.status,
    notes: release.notes,
    sku: release.sku || null,
    rollout_percent: release.rollout_percent,
    platform: release.platform,
    pub_date: release.pub_date,
    migration_risk: release.migration_risk,
    backup_recommended: release.backup_recommended,
    min_version: release.min_version || null,
    published_at: release.published_at || null,
    created_at: release.created_at,
    updated_at: release.updated_at,
  };
  if (includeArtifacts) {
    base.artifact_url = release.artifact_url;
    base.artifact_signature = release.artifact_signature;
  }
  return base;
}

export async function getRelease(id) {
  if (!id) return null;
  const row = await redis.get(`release:${id}`);
  return row ? ensureReleaseDefaults({ ...row }) : null;
}

export async function saveRelease(release) {
  const row = ensureReleaseDefaults({ ...release });
  row.updated_at = nowIso();
  await redis.set(`release:${row.id}`, row);
  await redis.sadd("releases:index", row.id);
  if (row.version && row.channel) {
    await redis.set(`release:version:${row.channel}:${row.version}`, row.id);
  }
  await refreshChannelLatest(row.channel);
  return row;
}

export async function listReleases() {
  const ids = (await redis.smembers("releases:index")) || [];
  const rows = [];
  for (const id of ids) {
    const release = await getRelease(id);
    if (release) rows.push(release);
  }
  return rows.sort((a, b) => {
    const byVersion = compareSemver(b.version, a.version);
    if (byVersion) return byVersion;
    return (b.updated_at || "").localeCompare(a.updated_at || "");
  });
}

async function refreshChannelLatest(channel) {
  const rows = (await listReleases()).filter(
    (r) => r.channel === channel && r.status === "published" && parseSemver(r.version)
  );
  rows.sort((a, b) => compareSemver(b.version, a.version));
  if (!rows.length) {
    await redis.del(`releases:channel:${channel}:latest`);
    return null;
  }
  await redis.set(`releases:channel:${channel}:latest`, rows[0].id);
  return rows[0];
}

export async function getLatestPublishedRelease(channel = "stable") {
  const ch = UPDATE_CHANNELS.includes(channel) ? channel : "stable";
  const id = await redis.get(`releases:channel:${ch}:latest`);
  if (id) {
    const release = await getRelease(id);
    if (release && release.status === "published") return release;
  }
  return refreshChannelLatest(ch);
}

export function inRollout(release, registrationId) {
  const regId = cleanStr(registrationId, 100);
  if (!regId) return release.rollout_percent >= 100;
  if ((release.denylist_registration_ids || []).includes(regId)) return false;
  if ((release.allowlist_registration_ids || []).includes(regId)) return true;
  const percent = Number(release.rollout_percent);
  if (percent >= 100) return true;
  if (percent <= 0) return false;
  const digest = crypto.createHash("sha256").update(`${regId}:${release.id}`).digest();
  const bucket = digest.readUInt32BE(0) % 100;
  return bucket < percent;
}

export async function upsertReleaseFromBody(body, { publish = false, createdBy = "" } = {}) {
  const version = cleanStr(body.version, 40).replace(/^v/i, "");
  if (!parseSemver(version)) return { error: "version SemVer invalide (ex: 2.1.1)", status: 400 };

  const channel = UPDATE_CHANNELS.includes(body.channel) ? body.channel : "stable";
  let existingId = cleanStr(body.id, 100);
  if (!existingId) {
    existingId = await redis.get(`release:version:${channel}:${version}`);
  }
  const existing = existingId ? await getRelease(existingId) : null;

  let artifactUrl = cleanStr(body.artifact_url, 1000);
  let artifactSignature = cleanStr(body.artifact_signature, 8000);
  let platform = cleanStr(body.platform, 40) || "windows-x86_64";
  let notes = cleanStr(body.notes, 4000);
  let pubDate = cleanStr(body.pub_date, 40);

  // Accept Tauri latest.json shape from CI.
  if (body.platforms && typeof body.platforms === "object") {
    const plat = body.platforms[platform] || body.platforms["windows-x86_64"] || Object.values(body.platforms)[0];
    if (plat) {
      artifactUrl = cleanStr(plat.url, 1000) || artifactUrl;
      artifactSignature = cleanStr(plat.signature, 8000) || artifactSignature;
    }
  }

  const severity = UPDATE_SEVERITIES.includes(body.severity)
    ? body.severity
    : (existing?.severity || "mandatory");

  const release = ensureReleaseDefaults({
    ...(existing || {}),
    id: existing?.id || uuid(),
    version,
    channel,
    severity,
    notes: notes || existing?.notes || "",
    sku: body.sku != null ? cleanStr(body.sku, 80) : (existing?.sku || ""),
    rollout_percent: body.rollout_percent != null ? body.rollout_percent : (existing?.rollout_percent ?? 100),
    allowlist_registration_ids: body.allowlist_registration_ids != null
      ? body.allowlist_registration_ids
      : (existing?.allowlist_registration_ids || []),
    denylist_registration_ids: body.denylist_registration_ids != null
      ? body.denylist_registration_ids
      : (existing?.denylist_registration_ids || []),
    artifact_url: artifactUrl || existing?.artifact_url || "",
    artifact_signature: artifactSignature || existing?.artifact_signature || "",
    platform,
    pub_date: pubDate || existing?.pub_date || nowIso(),
    migration_risk: body.migration_risk || existing?.migration_risk || "low",
    backup_recommended: body.backup_recommended != null
      ? Boolean(body.backup_recommended)
      : existing?.backup_recommended,
    min_version: body.min_version != null ? cleanStr(body.min_version, 40) : (existing?.min_version || ""),
    status: publish || body.status === "published"
      ? "published"
      : (body.status && UPDATE_RELEASE_STATUSES.includes(body.status) ? body.status : (existing?.status || "draft")),
    created_by: existing?.created_by || cleanStr(createdBy, 100),
  });

  if (release.status === "published") {
    if (!release.artifact_url || !release.artifact_signature) {
      return { error: "artifact_url et artifact_signature requis pour publier", status: 400 };
    }
    if (!release.published_at) release.published_at = nowIso();
  }

  const saved = await saveRelease(release);
  return { release: saved, created: !existing };
}

// ---------- entitlements ----------
export function entitlementKey(registrationId, sku) {
  return `entitlement:${registrationId}:${sku}`;
}

export async function listEntitlementsForRegistration(registrationId) {
  const regId = cleanStr(registrationId, 100);
  if (!regId) return [];
  const skus = (await redis.smembers(`entitlements:registration:${regId}`)) || [];
  const rows = [];
  for (const sku of skus) {
    const row = await redis.get(entitlementKey(regId, sku));
    if (row && row.status !== "revoked") rows.push(row);
  }
  return rows.sort((a, b) => (b.granted_at || "").localeCompare(a.granted_at || ""));
}

export async function grantEntitlement({ registrationId, sku, grantedBy = "", note = "" }) {
  const regId = cleanStr(registrationId, 100);
  const productSku = cleanStr(sku, 80) || DEFAULT_PAID_SKU;
  if (!regId) return { error: "registration_id requis", status: 400 };
  const registration = await getRegistration(regId);
  if (!registration) return { error: "Inscription introuvable", status: 404 };

  const existing = await redis.get(entitlementKey(regId, productSku));
  const row = {
    id: existing?.id || uuid(),
    registration_id: regId,
    sku: productSku,
    status: "active",
    granted_at: existing?.granted_at || nowIso(),
    granted_by: cleanStr(grantedBy, 100) || existing?.granted_by || "",
    note: cleanStr(note, 300),
    revoked_at: "",
    updated_at: nowIso(),
  };
  await redis.set(entitlementKey(regId, productSku), row);
  await redis.sadd(`entitlements:registration:${regId}`, productSku);

  const reg = ensureRegistrationDefaults({ ...registration });
  const skus = new Set(Array.isArray(reg.update_skus) ? reg.update_skus : []);
  skus.add(productSku);
  reg.update_skus = Array.from(skus);
  await saveRegistration(reg);

  return { entitlement: row, registration: reg };
}

export async function revokeEntitlement({ registrationId, sku, revokedBy = "" }) {
  const regId = cleanStr(registrationId, 100);
  const productSku = cleanStr(sku, 80) || DEFAULT_PAID_SKU;
  const existing = await redis.get(entitlementKey(regId, productSku));
  if (!existing) return { error: "Entitlement introuvable", status: 404 };
  const row = {
    ...existing,
    status: "revoked",
    revoked_at: nowIso(),
    revoked_by: cleanStr(revokedBy, 100),
    updated_at: nowIso(),
  };
  await redis.set(entitlementKey(regId, productSku), row);

  const registration = await getRegistration(regId);
  if (registration) {
    const reg = ensureRegistrationDefaults({ ...registration });
    reg.update_skus = (Array.isArray(reg.update_skus) ? reg.update_skus : []).filter((s) => s !== productSku);
    await saveRegistration(reg);
  }
  return { entitlement: row };
}

export async function hasActiveEntitlement(registrationId, sku) {
  if (!sku) return true;
  const row = await redis.get(entitlementKey(cleanStr(registrationId, 100), cleanStr(sku, 80)));
  return Boolean(row && row.status === "active");
}

export async function buildEntitlementProof(registration, entitlements) {
  const payload = {
    v: 1,
    type: "update_entitlements",
    registration_id: registration.id,
    client_registration_id: registration.client_registration_id || "",
    skus: entitlements.map((e) => e.sku),
    issued_at: nowIso(),
  };
  return {
    proof: await signEntitlementProof(payload),
    payload,
  };
}

// ---------- heartbeats / telemetry ----------
export async function saveHeartbeat(registrationId, payload) {
  const regId = cleanStr(registrationId, 100);
  if (!regId) return null;
  const row = {
    registration_id: regId,
    app_version: cleanStr(payload.app_version, 40),
    channel: UPDATE_CHANNELS.includes(payload.channel) ? payload.channel : "stable",
    update_status: cleanStr(payload.update_status, 60) || "unknown",
    last_error: cleanStr(payload.last_error, 300),
    device_fingerprint: cleanStr(payload.device_fingerprint, 128),
    os: cleanStr(payload.os, 40),
    arch: cleanStr(payload.arch, 40),
    reported_at: nowIso(),
  };
  await redis.set(`update:heartbeat:${regId}`, row);
  await redis.sadd("update:heartbeats:index", regId);

  const registration = await getRegistration(regId);
  if (registration) {
    const reg = ensureRegistrationDefaults({ ...registration });
    if (row.app_version) reg.app_version = row.app_version;
    if (payload.channel && UPDATE_CHANNELS.includes(payload.channel)) {
      reg.update_channel = payload.channel;
    }
    await saveRegistration(reg);
  }
  return row;
}

export async function listHeartbeats() {
  const ids = (await redis.smembers("update:heartbeats:index")) || [];
  const rows = [];
  for (const id of ids) {
    const row = await redis.get(`update:heartbeat:${id}`);
    if (row) rows.push(row);
  }
  return rows.sort((a, b) => (b.reported_at || "").localeCompare(a.reported_at || ""));
}

export async function updateStats() {
  const releases = await listReleases();
  const heartbeats = await listHeartbeats();
  const registrations = await listRegistrations();
  let entitlementsActive = 0;
  for (const reg of registrations) {
    entitlementsActive += (await listEntitlementsForRegistration(reg.id)).length;
  }
  const latestStable = await getLatestPublishedRelease("stable");
  const onLatest = latestStable
    ? heartbeats.filter((h) => h.app_version === latestStable.version).length
    : 0;
  return {
    releases_total: releases.length,
    releases_published: releases.filter((r) => r.status === "published").length,
    releases_draft: releases.filter((r) => r.status === "draft").length,
    heartbeats_total: heartbeats.length,
    installs_on_latest_stable: onLatest,
    entitlements_active: entitlementsActive,
    latest_stable_version: latestStable?.version || null,
  };
}

// ---------- policy check ----------
async function resolveRegistrationFromCheckBody(body) {
  const clientId = cleanStr(body.client_registration_id, 100);
  const registrationId = cleanStr(body.registration_id, 100);
  let registration = null;
  if (registrationId) registration = await getRegistration(registrationId);
  if (!registration && clientId) registration = await findRegistrationByClientId(clientId);

  const activationToken = cleanStr(body.activation_token, 4000);
  if (activationToken) {
    const payload = await verifyActivationToken(activationToken);
    if (payload?.registration_id) {
      const fromToken = await getRegistration(payload.registration_id);
      if (fromToken) registration = fromToken;
    }
  }
  return registration ? ensureRegistrationDefaults({ ...registration }) : null;
}

function deny(reason, extra = {}) {
  return {
    available: false,
    severity: "none",
    reason,
    ...extra,
  };
}

export async function evaluateUpdateCheck(body) {
  const currentVersion = cleanStr(body.current_version || body.app_version, 40).replace(/^v/i, "");
  if (!parseSemver(currentVersion)) {
    return { error: "current_version SemVer invalide", status: 400 };
  }

  const registration = await resolveRegistrationFromCheckBody(body);
  if (!registration) {
    return { error: "Inscription introuvable. Synchronisez le compte médecin d'abord.", status: 404 };
  }

  const requestedChannel = UPDATE_CHANNELS.includes(body.channel)
    ? body.channel
    : (UPDATE_CHANNELS.includes(registration.update_channel) ? registration.update_channel : "stable");

  const release = await getLatestPublishedRelease(requestedChannel);
  if (!release) {
    return {
      response: deny("no_published_release", {
        channel: requestedChannel,
        current_version: currentVersion,
        entitlement: { required: false, granted: true, skus: [] },
      }),
    };
  }

  if (!isNewerVersion(release.version, currentVersion)) {
    return {
      response: deny("up_to_date", {
        channel: requestedChannel,
        current_version: currentVersion,
        latest_version: release.version,
        entitlement: { required: false, granted: true, skus: [] },
      }),
    };
  }

  if (!inRollout(release, registration.id)) {
    return {
      response: deny("not_in_rollout", {
        channel: requestedChannel,
        current_version: currentVersion,
        latest_version: release.version,
        severity: release.severity,
        entitlement: { required: false, granted: true, skus: [] },
      }),
    };
  }

  const needsEntitlement = release.severity === "paid" || release.severity === "paid_mandatory";
  const entitlements = await listEntitlementsForRegistration(registration.id);
  const granted = needsEntitlement
    ? await hasActiveEntitlement(registration.id, release.sku)
    : true;

  if (needsEntitlement && !granted) {
    return {
      response: deny("entitlement_required", {
        channel: requestedChannel,
        current_version: currentVersion,
        latest_version: release.version,
        severity: release.severity,
        sku: release.sku,
        notes: release.notes,
        entitlement: {
          required: true,
          granted: false,
          skus: entitlements.map((e) => e.sku),
        },
      }),
    };
  }

  return {
    response: {
      available: true,
      reason: "update_available",
      severity: release.severity,
      channel: release.channel,
      version: release.version,
      current_version: currentVersion,
      notes: release.notes,
      sku: release.sku || null,
      release_id: release.id,
      artifacts: {
        url: release.artifact_url,
        signature: release.artifact_signature,
        platform: release.platform,
      },
      // Tauri static-manifest compatible fragment for convenience
      tauri: {
        version: release.version,
        notes: release.notes,
        pub_date: release.pub_date,
        url: release.artifact_url,
        signature: release.artifact_signature,
      },
      migration: {
        risk: release.migration_risk,
        backup_recommended: release.backup_recommended,
      },
      install: {
        background_download: true,
        require_confirm_restart: true,
        force_when_idle: release.severity === "mandatory" || release.severity === "paid_mandatory",
      },
      entitlement: {
        required: needsEntitlement,
        granted: true,
        skus: entitlements.map((e) => e.sku),
      },
    },
  };
}


export async function importReleaseFromGitHub({ tag = "", createdBy = "" } = {}) {
  const repo = cleanStr(process.env.GITHUB_DESKTOP_REPO || "Rayane3103/medismart-desktop", 200);
  const token = cleanStr(process.env.GITHUB_RELEASES_TOKEN || process.env.GITHUB_TOKEN || process.env.GH_TOKEN, 200);
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "MediSmart-UpdateControl",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const url = tag
    ? `https://api.github.com/repos/${repo}/releases/tags/${encodeURIComponent(tag.startsWith("v") ? tag : `v${tag}`)}`
    : `https://api.github.com/repos/${repo}/releases/latest`;

  const res = await fetch(url, { headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const hint = !token
      ? " Ajoutez GITHUB_RELEASES_TOKEN (classic PAT repo) sur le backend si le dépôt est privé."
      : "";
    return { error: (data.message || `GitHub ${res.status}`) + hint, status: res.status === 404 ? 404 : 502 };
  }

  const assets = Array.isArray(data.assets) ? data.assets : [];
  const byName = Object.fromEntries(assets.map((a) => [a.name, a]));
  let latestJson = null;
  const latestAsset = assets.find((a) => a.name === "latest.json");
  if (latestAsset) {
    const lr = await fetch(latestAsset.browser_download_url, { headers });
    if (lr.ok) latestJson = await lr.json().catch(() => null);
  }

  let artifactUrl = "";
  let artifactSignature = "";
  let version = cleanStr(data.tag_name || "", 40).replace(/^v/i, "");
  let notes = cleanStr(data.body || data.name || "", 4000);

  if (latestJson) {
    version = cleanStr(latestJson.version || version, 40).replace(/^v/i, "");
    notes = cleanStr(latestJson.notes || notes, 4000);
    const plat = (latestJson.platforms || {})["windows-x86_64"] || Object.values(latestJson.platforms || {})[0];
    if (plat) {
      artifactUrl = cleanStr(plat.url, 1000);
      artifactSignature = cleanStr(plat.signature, 8000);
    }
  }

  if (!artifactUrl) {
    const exe = assets.find((a) => /setup\.exe$/i.test(a.name) || /\.exe$/i.test(a.name));
    if (exe) artifactUrl = exe.browser_download_url;
  }
  if (!artifactSignature) {
    const sig = assets.find((a) => /\.sig$/i.test(a.name));
    if (sig) {
      const sr = await fetch(sig.browser_download_url, { headers });
      if (sr.ok) artifactSignature = cleanStr(await sr.text(), 8000);
    }
  }

  if (!parseSemver(version)) {
    return { error: "Impossible de déterminer la version GitHub", status: 400 };
  }
  if (!artifactUrl || !artifactSignature) {
    return {
      error: "Release GitHub trouvée mais sans artefact/.sig (attendez la fin du workflow CI).",
      status: 409,
    };
  }

  return upsertReleaseFromBody({
    version,
    channel: "stable",
    severity: "mandatory",
    notes,
    rollout_percent: 100,
    artifact_url: artifactUrl,
    artifact_signature: artifactSignature,
    status: "draft",
    migration_risk: "low",
  }, { publish: false, createdBy: createdBy || "github-import" });
}

// ---------- HTTP handlers ----------
export async function handleUpdatesPublicRoutes(req, res, path, ctx) {
  const { readJson, ok, err } = ctx;

  if (path === "/api/updates/check") {
    if (req.method !== "POST") { err(res, 405, "Method not allowed"); return true; }
    try {
      const body = await readJson(req);
      const result = await evaluateUpdateCheck(body);
      if (result.error) { err(res, result.status || 400, result.error); return true; }
      ok(res, { ok: true, ...result.response });
    } catch (e) {
      err(res, 500, e.message || "Erreur check update");
    }
    return true;
  }

  if (path === "/api/updates/entitlements/refresh") {
    if (req.method !== "POST") { err(res, 405, "Method not allowed"); return true; }
    try {
      const body = await readJson(req);
      const registration = await resolveRegistrationFromCheckBody(body);
      if (!registration) { err(res, 404, "Inscription introuvable"); return true; }
      const entitlements = await listEntitlementsForRegistration(registration.id);
      const proof = await buildEntitlementProof(registration, entitlements);
      ok(res, {
        ok: true,
        registration_id: registration.id,
        skus: entitlements.map((e) => e.sku),
        entitlements,
        entitlement_proof: proof.proof,
        issued_at: proof.payload.issued_at,
      });
    } catch (e) {
      err(res, 500, e.message || "Erreur refresh entitlements");
    }
    return true;
  }

  if (path === "/api/updates/heartbeat") {
    if (req.method !== "POST") { err(res, 405, "Method not allowed"); return true; }
    try {
      const body = await readJson(req);
      const registration = await resolveRegistrationFromCheckBody(body);
      if (!registration) { err(res, 404, "Inscription introuvable"); return true; }
      const heartbeat = await saveHeartbeat(registration.id, body);
      ok(res, { ok: true, heartbeat });
    } catch (e) {
      err(res, 500, e.message || "Erreur heartbeat");
    }
    return true;
  }

  return false;
}

export async function handleUpdatesAdminRoutes(req, res, path, ctx) {
  const { readJson, ok, err } = ctx;

  // CI publish can use UPDATE_PUBLISH_TOKEN without a full admin session when
  // called from handleUpdatesPublishRoute; this admin handler assumes session.


  if (path === "/api/admin/releases/import-github" && req.method === "POST") {
    const body = await readJson(req);
    const result = await importReleaseFromGitHub({
      tag: body.tag || "",
      createdBy: ctx.adminUsername || "admin",
    });
    if (result.error) { err(res, result.status || 400, result.error); return true; }
    ok(res, {
      ok: true,
      created: result.created,
      release: publicReleaseState(result.release, { includeArtifacts: true }),
    }, result.created ? 201 : 200);
    return true;
  }

  if (path === "/api/admin/releases" && req.method === "GET") {
    const rows = await listReleases();
    ok(res, { rows: rows.map((r) => publicReleaseState(r, { includeArtifacts: true })), stats: await updateStats() });
    return true;
  }

  if (path === "/api/admin/releases" && req.method === "POST") {
    const body = await readJson(req);
    const result = await upsertReleaseFromBody(body, {
      publish: body.status === "published" || body.publish === true,
      createdBy: ctx.adminUsername || "",
    });
    if (result.error) { err(res, result.status || 400, result.error); return true; }
    ok(res, {
      ok: true,
      created: result.created,
      release: publicReleaseState(result.release, { includeArtifacts: true }),
    }, result.created ? 201 : 200);
    return true;
  }

  const releaseMatch = path.match(/^\/api\/admin\/releases\/([a-f0-9-]+)$/);
  if (releaseMatch && req.method === "GET") {
    const release = await getRelease(releaseMatch[1]);
    if (!release) { err(res, 404, "Release introuvable"); return true; }
    ok(res, { release: publicReleaseState(release, { includeArtifacts: true }) });
    return true;
  }

  if (releaseMatch && (req.method === "PUT" || req.method === "PATCH")) {
    const existing = await getRelease(releaseMatch[1]);
    if (!existing) { err(res, 404, "Release introuvable"); return true; }
    const body = await readJson(req);
    const result = await upsertReleaseFromBody({ ...existing, ...body, id: existing.id, version: body.version || existing.version }, {
      publish: body.status === "published" || body.publish === true,
      createdBy: ctx.adminUsername || "",
    });
    if (result.error) { err(res, result.status || 400, result.error); return true; }
    ok(res, { ok: true, release: publicReleaseState(result.release, { includeArtifacts: true }) });
    return true;
  }

  if (releaseMatch && req.method === "DELETE") {
    const release = await getRelease(releaseMatch[1]);
    if (!release) { err(res, 404, "Release introuvable"); return true; }
    await redis.del(`release:${release.id}`);
    await redis.srem("releases:index", release.id);
    if (release.channel && release.version) {
      await redis.del(`release:version:${release.channel}:${release.version}`);
    }
    await refreshChannelLatest(release.channel);
    ok(res, { ok: true });
    return true;
  }

  const publishMatch = path.match(/^\/api\/admin\/releases\/([a-f0-9-]+)\/publish$/);
  if (publishMatch && req.method === "POST") {
    const existing = await getRelease(publishMatch[1]);
    if (!existing) { err(res, 404, "Release introuvable"); return true; }
    const result = await upsertReleaseFromBody({ ...existing, status: "published" }, { publish: true });
    if (result.error) { err(res, result.status || 400, result.error); return true; }
    ok(res, { ok: true, release: publicReleaseState(result.release, { includeArtifacts: true }) });
    return true;
  }

  // Grant / revoke paid update entitlement on a registration
  const grantMatch = path.match(/^\/api\/admin\/registrations\/([a-f0-9-]+)\/entitlements$/);
  if (grantMatch && req.method === "GET") {
    const registration = await getRegistration(grantMatch[1]);
    if (!registration) { err(res, 404, "Inscription introuvable"); return true; }
    const entitlements = await listEntitlementsForRegistration(grantMatch[1]);
    ok(res, { registration_id: grantMatch[1], rows: entitlements });
    return true;
  }

  if (grantMatch && req.method === "POST") {
    const body = await readJson(req);
    const result = await grantEntitlement({
      registrationId: grantMatch[1],
      sku: body.sku || DEFAULT_PAID_SKU,
      grantedBy: ctx.adminUsername || "",
      note: body.note || "",
    });
    if (result.error) { err(res, result.status || 400, result.error); return true; }
    ok(res, { ok: true, entitlement: result.entitlement }, 201);
    return true;
  }

  const revokeEntMatch = path.match(/^\/api\/admin\/registrations\/([a-f0-9-]+)\/entitlements\/([^/]+)\/revoke$/);
  if (revokeEntMatch && req.method === "POST") {
    const result = await revokeEntitlement({
      registrationId: revokeEntMatch[1],
      sku: decodeURIComponent(revokeEntMatch[2]),
      revokedBy: ctx.adminUsername || "",
    });
    if (result.error) { err(res, result.status || 400, result.error); return true; }
    ok(res, { ok: true, entitlement: result.entitlement });
    return true;
  }

  // Optional: set update channel on registration
  const channelMatch = path.match(/^\/api\/admin\/registrations\/([a-f0-9-]+)\/update-channel$/);
  if (channelMatch && req.method === "POST") {
    const registration = await getRegistration(channelMatch[1]);
    if (!registration) { err(res, 404, "Inscription introuvable"); return true; }
    const body = await readJson(req);
    if (!UPDATE_CHANNELS.includes(body.channel)) {
      err(res, 400, "channel doit être stable, beta ou internal");
      return true;
    }
    const reg = ensureRegistrationDefaults({ ...registration });
    reg.update_channel = body.channel;
    await saveRegistration(reg);
    ok(res, { ok: true, registration_id: reg.id, update_channel: reg.update_channel });
    return true;
  }

  if (path === "/api/admin/update-telemetry" && req.method === "GET") {
    ok(res, { rows: await listHeartbeats(), stats: await updateStats() });
    return true;
  }

  if (path === "/api/admin/update-stats" && req.method === "GET") {
    ok(res, { stats: await updateStats() });
    return true;
  }

  return false;
}

/** CI endpoint: publish/register a release with UPDATE_PUBLISH_TOKEN (or admin session). */
export async function handleUpdatesPublishRoute(req, res, path, ctx) {
  const { readJson, ok, err } = ctx;
  if (path !== "/api/admin/releases/publish") return false;
  if (req.method !== "POST") { err(res, 405, "Method not allowed"); return true; }

  const hasPublishToken = verifyUpdatePublishToken(req);
  const hasAdmin = Boolean(ctx.adminSession);
  if (!hasPublishToken && !hasAdmin) {
    err(res, 401, "X-Update-Publish-Token ou session admin requis");
    return true;
  }

  try {
    const body = await readJson(req);
    const result = await upsertReleaseFromBody({
      ...body,
      channel: body.channel || "stable",
      severity: body.severity || "mandatory",
      status: "published",
    }, {
      publish: true,
      createdBy: hasAdmin ? (ctx.adminUsername || "admin") : "ci",
    });
    if (result.error) { err(res, result.status || 400, result.error); return true; }
    ok(res, {
      ok: true,
      created: result.created,
      release: publicReleaseState(result.release, { includeArtifacts: true }),
    }, result.created ? 201 : 200);
  } catch (e) {
    err(res, 500, e.message || "Erreur publish release");
  }
  return true;
}
