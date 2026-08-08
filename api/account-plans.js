// Account/subscription plans -- what a doctor picks during web registration
// (frontend/src/AuthGate.jsx on medismart-web-full), distinct from ai:plan
// (api/ai-plans.js), which controls AI model access/usage caps for an
// already-provisioned doctor. This one is about what they're signing up
// for/paying for in general, not AI quotas -- a doctor's chosen plan here
// has no automatic effect on anything; it's informational for whoever
// reviews the registration and issues a serial key (see api/licensing.js's
// requested_plan_id on the registration record).
//
// Storage: account:plan:{id} + account:plans:index

import { makeStore, makeCrudRoutes, cleanStr } from "./ai-store.js";
import { auditLogger } from "./ai-audit.js";

const SEED_PLANS = [
  { name: "Basic", description: "Fonctionnalites essentielles pour un cabinet individuel.", price: 0, currency: "DZD", duration_days: 30, active: true },
  { name: "Professionnel", description: "Cabinet avec secretariat et synchronisation multi-poste.", price: 0, currency: "DZD", duration_days: 30, active: true },
  { name: "Etablissement", description: "Plusieurs praticiens, besoins etendus.", price: 0, currency: "DZD", duration_days: 30, active: true },
];

function ensureAccountPlanDefaults(row) {
  row.name = cleanStr(row.name, 100) || "Plan";
  row.description = cleanStr(row.description, 500);
  row.price = Number.isFinite(+row.price) ? Math.max(0, +row.price) : 0;
  row.currency = cleanStr(row.currency, 10) || "DZD";
  row.duration_days = Number.isFinite(+row.duration_days) ? Math.max(1, Math.round(+row.duration_days)) : 30;
  if (typeof row.active !== "boolean") row.active = true;
  return row;
}

const accountPlanStore = makeStore({
  keyPrefix: "account:plan",
  indexKey: "account:plans:index",
  cacheKey: "account_plans",
  ensureDefaults: ensureAccountPlanDefaults,
  sortFn: (a, b) => a.price - b.price,
});

export async function seedAccountPlanDefaults() {
  await accountPlanStore.seedIfEmpty(SEED_PLANS);
}

export async function getAccountPlan(id) { return accountPlanStore.get(id); }
export async function listAccountPlans() { return accountPlanStore.list(); }

// Only the fields a registration form needs to show -- no id-adjacent admin
// metadata beyond what's required to submit a selection (id is needed to
// reference the choice; created_at/updated_at are not).
function toPublicAccountPlan(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: row.price,
    currency: row.currency,
    duration_days: row.duration_days,
  };
}

export async function handleAccountPlansPublicRoutes(req, res, path, ctx) {
  const { ok } = ctx;
  if (path === "/api/plans/account" && req.method === "GET") {
    await seedAccountPlanDefaults();
    const rows = (await listAccountPlans()).filter((p) => p.active);
    ok(res, { rows: rows.map(toPublicAccountPlan) });
    return true;
  }
  return false;
}

const handleAccountPlanCrudRoutes = makeCrudRoutes({
  basePath: "/api/admin/account-plans",
  store: accountPlanStore,
  auditLog: auditLogger("account_plan"),
});

export async function handleAccountPlansAdminRoutes(req, res, path, ctx) {
  await seedAccountPlanDefaults();
  return handleAccountPlanCrudRoutes(req, res, path, ctx);
}
