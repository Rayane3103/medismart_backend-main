// Install demands captured from the public landing page ("Télécharger MediSmart"
// form). These are pre-activation leads — distinct from registrations, which
// come from the desktop app after install. The landing route forwards each
// demand here; the admin panel lists them in the "Demandes d'installation" tab.
//
// Storage (Upstash Redis):
//   install_requests:index        set of demand ids
//   install_request:{id}          demand JSON
//   install_requests:seen_at      ISO timestamp of the last "mark all seen"
//                                  (drives the unseen badge in the sidebar)

import crypto from "node:crypto";
import { redis, mgetExisting, cached, invalidate } from "./redis.js";
import { sendEmail, adminNotifyTo, installRequestNotificationTemplate } from "./email.js";

const STATUSES = ["new", "contacted", "archived"];
const SEEN_KEY = "install_requests:seen_at";

function nowIso() { return new Date().toISOString(); }
function uuid() { return crypto.randomUUID(); }
function cleanStr(value, maxLen = 200) {
  return String(value ?? "").trim().slice(0, maxLen);
}

function ensureDefaults(reqData) {
  reqData.id = reqData.id || uuid();
  reqData.nom = cleanStr(reqData.nom, 120);
  reqData.prenom = cleanStr(reqData.prenom, 120);
  reqData.cabinet = cleanStr(reqData.cabinet, 200);
  reqData.specialite = cleanStr(reqData.specialite, 120);
  reqData.ville = cleanStr(reqData.ville, 120);
  reqData.telephone = cleanStr(reqData.telephone, 50);
  reqData.email = cleanStr(reqData.email, 200);
  reqData.consent = Boolean(reqData.consent);
  reqData.source = cleanStr(reqData.source, 60) || "landing";
  if (!STATUSES.includes(reqData.status)) reqData.status = "new";
  if (!reqData.created_at) reqData.created_at = nowIso();
  return reqData;
}

function publicState(reqData) {
  return {
    id: reqData.id,
    nom: reqData.nom,
    prenom: reqData.prenom,
    full_name: [reqData.prenom, reqData.nom].filter(Boolean).join(" ").trim(),
    cabinet: reqData.cabinet,
    specialite: reqData.specialite,
    ville: reqData.ville,
    telephone: reqData.telephone,
    email: reqData.email,
    consent: reqData.consent,
    source: reqData.source,
    status: reqData.status,
    created_at: reqData.created_at,
    updated_at: reqData.updated_at || null,
  };
}

async function getRequest(id) {
  if (!id) return null;
  return await redis.get(`install_request:${id}`);
}

async function saveRequest(reqData) {
  reqData.updated_at = nowIso();
  await redis.set(`install_request:${reqData.id}`, reqData);
  await redis.sadd("install_requests:index", reqData.id);
  invalidate("install_requests");
}

export async function listInstallRequests() {
  return cached("install_requests", async () => {
    const ids = (await redis.smembers("install_requests:index")) || [];
    const rows = await mgetExisting(ids.map((id) => `install_request:${id}`));
    return rows
      .map((r) => ensureDefaults({ ...r }))
      .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
  });
}

// A demand is "unseen" if it arrived after the admin last opened the tab.
function countUnseen(rows, seenAt) {
  if (!seenAt) return rows.length;
  return rows.filter((r) => (r.created_at || "") > seenAt).length;
}

// =====================================================================
// Public route: the landing page forwards demands here (no auth).
// =====================================================================
export async function handleInstallRequestPublicRoutes(req, res, path, ctx) {
  const { readJson, ok, err } = ctx;

  if (path === "/api/install-requests" && req.method === "POST") {
    const body = await readJson(req);
    const email = cleanStr(body.email, 200);
    const nom = cleanStr(body.nom, 120);
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!nom || !emailOk) {
      err(res, 400, "Nom et email valides requis");
      return true;
    }

    const reqData = ensureDefaults({
      id: uuid(),
      nom, prenom: body.prenom, cabinet: body.cabinet, specialite: body.specialite,
      ville: body.ville, telephone: body.telephone, email, consent: body.consent,
      source: body.source || "landing",
    });
    await saveRequest(reqData);

    // Notify the admin by email. Best-effort: a failed/again-unconfigured email
    // must never fail the lead capture, or the site download flow would break.
    try {
      const to = adminNotifyTo();
      if (to) {
        await sendEmail({
          to,
          subject: `Nouvelle demande d'installation — ${publicState(reqData).full_name || email}`,
          html: installRequestNotificationTemplate(reqData),
          replyTo: email,
        });
      }
    } catch (e) {
      console.error("[install-requests] notification email failed:", e.message);
    }

    ok(res, { ok: true, id: reqData.id });
    return true;
  }

  return false;
}

// =====================================================================
// Admin routes (require X-Admin-Token; gated by the caller in index.js).
// =====================================================================
export async function handleInstallRequestAdminRoutes(req, res, path, ctx) {
  const { readJson, ok, err } = ctx;

  if (path === "/api/admin/install-requests" && req.method === "GET") {
    const rows = await listInstallRequests();
    const seenAt = (await redis.get(SEEN_KEY)) || "";
    ok(res, {
      rows: rows.map(publicState),
      unseen: countUnseen(rows, seenAt),
      seen_at: seenAt,
      total: rows.length,
    });
    return true;
  }

  if (path === "/api/admin/install-requests/seen" && req.method === "POST") {
    await redis.set(SEEN_KEY, nowIso());
    ok(res, { ok: true });
    return true;
  }

  const idMatch = path.match(/^\/api\/admin\/install-requests\/([a-f0-9-]+)$/);

  if (idMatch && req.method === "PATCH") {
    const reqData = await getRequest(idMatch[1]);
    if (!reqData) { err(res, 404, "Demande introuvable"); return true; }
    const body = await readJson(req);
    const next = ensureDefaults({ ...reqData });
    if (STATUSES.includes(body.status)) next.status = body.status;
    await saveRequest(next);
    ok(res, { ok: true, request: publicState(next) });
    return true;
  }

  if (idMatch && req.method === "DELETE") {
    await redis.del(`install_request:${idMatch[1]}`);
    await redis.srem("install_requests:index", idMatch[1]);
    invalidate("install_requests");
    ok(res, { ok: true });
    return true;
  }

  return false;
}
