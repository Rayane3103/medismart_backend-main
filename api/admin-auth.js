// Admin sign-in: username + password pairs from the ADMIN_USERS env var.
// Format: "user1:pass1,user2:pass2" (configured in Vercel, never committed).
// Legacy ADMIN_TOKEN is still accepted as a bearer token for scripts/tests.

import crypto from "node:crypto";
import { redis } from "./redis.js";

const SESSION_TTL_SEC = 60 * 60 * 24 * 7; // 7 days

function parseAdminUsers() {
  const raw = String(process.env.ADMIN_USERS || "").trim();
  const map = new Map();
  if (!raw) return map;
  for (const chunk of raw.split(/[,;\n]+/)) {
    const part = chunk.trim();
    if (!part) continue;
    const colon = part.indexOf(":");
    if (colon <= 0) continue;
    const username = part.slice(0, colon).trim().toLowerCase();
    const password = part.slice(colon + 1);
    if (username && password) map.set(username, password);
  }
  return map;
}

export function adminUsersConfigured() {
  return parseAdminUsers().size > 0 || Boolean(String(process.env.ADMIN_TOKEN || "").trim());
}

// Compares secrets in constant time. Hashing first keeps timingSafeEqual happy
// with different-length inputs and stops the comparison from leaking how much
// of a guessed password was correct.
function secretsMatch(a, b) {
  const ha = crypto.createHash("sha256").update(String(a ?? "")).digest();
  const hb = crypto.createHash("sha256").update(String(b ?? "")).digest();
  return crypto.timingSafeEqual(ha, hb);
}

export async function adminLogin(username, password) {
  const users = parseAdminUsers();
  const user = String(username || "").trim().toLowerCase();
  const pass = String(password || "");
  if (!user || !pass) {
    return { ok: false, error: "Nom d'utilisateur et mot de passe requis." };
  }
  if (!users.size) {
    return { ok: false, error: "Aucun compte administrateur configuré (ADMIN_USERS)." };
  }
  const expected = users.get(user);
  if (!expected || !secretsMatch(expected, pass)) {
    return { ok: false, error: "Identifiants incorrects." };
  }
  const token = crypto.randomBytes(32).toString("hex");
  const session = {
    username: user,
    display_name: user.charAt(0).toUpperCase() + user.slice(1),
    created_at: new Date().toISOString(),
  };
  await redis.set(`admin:session:${token}`, session, { ex: SESSION_TTL_SEC });
  return { ok: true, token, user: session };
}

export async function adminLogout(token) {
  if (!token) return;
  await redis.del(`admin:session:${token}`);
}

export async function getAdminSession(token) {
  if (!token) return null;
  const session = await redis.get(`admin:session:${token}`);
  return session || null;
}

export async function verifyAdminRequest(req) {
  const got = (req.headers["x-admin-token"] || req.headers["authorization"] || "")
    .toString().replace(/^Bearer\s+/i, "").trim();
  if (!got) return null;

  // Session token from username/password login.
  const session = await getAdminSession(got);
  if (session) return session;

  // Legacy single shared token (scripts, old deployments).
  const legacy = String(process.env.ADMIN_TOKEN || "").trim();
  if (legacy && secretsMatch(legacy, got)) {
    return { username: "admin", display_name: "Admin", legacy: true };
  }

  return null;
}
