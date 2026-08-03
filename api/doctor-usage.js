// Per-doctor credit accounting and usage log, relocated verbatim from
// api/index.js so the AI brain (api/ai-brain.js) can share the exact same
// accounting/log used by the pre-existing doctor-facing endpoints
// (/api/me/subscription, /api/me/logs, /api/admin/doctors/:id/logs) instead
// of inventing a second bookkeeping system.
//
// Storage: logs:{doctorId} (LIST, lpush + ltrim, bounded) - unchanged key.

import crypto from "node:crypto";
import { redis } from "./redis.js";

function uuid() { return crypto.randomUUID(); }
function nowIso() { return new Date().toISOString(); }

export const DEFAULT_COSTS = {
  chat: 1,
  lab_analysis: 3,
  pdf_analysis: 3,
  ecg_analysis: 3,
  image_analysis: 3,
  multimodal_analysis: 3,
  irm_analysis: 3,
};

export async function getCreditCosts() {
  const stored = await redis.get("config:credit_costs");
  return { ...DEFAULT_COSTS, ...(stored || {}), chat: 1, lab_analysis: 3, pdf_analysis: 3, ecg_analysis: 3, image_analysis: 3, multimodal_analysis: 3, irm_analysis: 3 };
}

export function creditCostFor(costs, action) {
  return String(action || "chat") === "chat" ? (costs.chat ?? 1) : 3;
}

export async function logCreditAction(doctorId, action, credits, success, cached, details = "") {
  const entry = {
    id: uuid(),
    doctor_id: doctorId,
    action_type: action,
    credits_used: credits,
    success: !!success,
    cached: !!cached,
    details: String(details || "").slice(0, 500),
    created_at: nowIso(),
  };
  await redis.lpush(`logs:${doctorId}`, JSON.stringify(entry));
  await redis.ltrim(`logs:${doctorId}`, 0, 499);
  return entry;
}

export async function readLogs(doctorId, limit = 50) {
  const raw = await redis.lrange(`logs:${doctorId}`, 0, limit - 1);
  return (raw || []).map((s) => {
    try { return typeof s === "string" ? JSON.parse(s) : s; } catch { return null; }
  }).filter(Boolean);
}
