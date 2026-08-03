// AI Plans (Basic/Professional/Enterprise) and subscription management.
// A plan controls which models a doctor can use and their default caps.
// Doctor <-> plan linkage reuses the EXISTING doctor record (`doctor:{id}`,
// api/index.js) via a new `ai_plan_id` field - no parallel doctor entity.
//
// Storage: ai:plan:{id} + ai:plans:index

import { makeStore, makeCrudRoutes, cleanStr } from "./ai-store.js";
import { auditLogger } from "./ai-audit.js";

const SEED_PLANS = [
  { name: "Basic", allowed_model_ids: [], monthly_limit: 200, daily_limit: 20, rate_limit_per_min: 5 },
  { name: "Professional", allowed_model_ids: [], monthly_limit: 1000, daily_limit: 100, rate_limit_per_min: 20 },
  { name: "Enterprise", allowed_model_ids: [], monthly_limit: 10000, daily_limit: 1000, rate_limit_per_min: 60 },
];

function ensurePlanDefaults(row) {
  row.name = cleanStr(row.name, 100) || "Plan";
  row.description = cleanStr(row.description, 300);
  row.allowed_model_ids = Array.isArray(row.allowed_model_ids) ? row.allowed_model_ids.filter(Boolean) : [];
  row.monthly_limit = Number.isFinite(+row.monthly_limit) ? Math.max(0, Math.round(+row.monthly_limit)) : 500;
  row.daily_limit = Number.isFinite(+row.daily_limit) ? Math.max(0, Math.round(+row.daily_limit)) : 50;
  row.rate_limit_per_min = Number.isFinite(+row.rate_limit_per_min) ? Math.max(1, Math.round(+row.rate_limit_per_min)) : 10;
  if (typeof row.active !== "boolean") row.active = true;
  return row;
}

const planStore = makeStore({
  keyPrefix: "ai:plan",
  indexKey: "ai:plans:index",
  cacheKey: "ai_plans",
  ensureDefaults: ensurePlanDefaults,
  sortFn: (a, b) => a.monthly_limit - b.monthly_limit,
});

export async function seedPlanDefaults() {
  await planStore.seedIfEmpty(SEED_PLANS);
}

export async function getPlan(id) { return planStore.get(id); }
export async function listPlans() { return planStore.list(); }

const handlePlanRoutes = makeCrudRoutes({
  basePath: "/api/admin/ai/plans",
  store: planStore,
  auditLog: auditLogger("plan"),
});

export async function handleAiPlansAdminRoutes(req, res, path, ctx) {
  await seedPlanDefaults();
  return handlePlanRoutes(req, res, path, ctx);
}
