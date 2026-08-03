// Model Router: for each clinical task, which model handles it, which prompt
// version to use, per-task temperature/max_tokens overrides, and an ordered
// fallback chain of models to try if the primary fails.
//
// Storage: ai:router:{taskId} + ai:router:index (SET of taskIds)

import { redis, cached, invalidate, mgetExisting } from "./redis.js";
import { nowIso, cleanStr } from "./ai-store.js";
import { auditLogger } from "./ai-audit.js";
import { listTasks } from "./ai-catalog.js";
import { listPrompts } from "./ai-prompts.js";
import { listEnabledModels } from "./ai-models.js";

function ensureRuleDefaults(row) {
  row.task_id = cleanStr(row.task_id, 100);
  row.primary_model_id = cleanStr(row.primary_model_id, 100);
  row.prompt_id = cleanStr(row.prompt_id, 100);
  row.prompt_version = Number.isFinite(+row.prompt_version) ? +row.prompt_version : 0;
  row.temperature_override = row.temperature_override === "" || row.temperature_override == null
    ? null : Math.min(2, Math.max(0, +row.temperature_override));
  row.max_tokens_override = row.max_tokens_override === "" || row.max_tokens_override == null
    ? null : Math.max(1, Math.round(+row.max_tokens_override));
  row.fallback_model_ids = Array.isArray(row.fallback_model_ids) ? row.fallback_model_ids.filter(Boolean) : [];
  row.guideline_ids = Array.isArray(row.guideline_ids) ? row.guideline_ids.filter(Boolean) : [];
  return row;
}

export async function getRouterRule(taskId) {
  const row = await redis.get(`ai:router:${taskId}`);
  return row ? ensureRuleDefaults({ ...row }) : null;
}

export async function listRouterRules() {
  return cached("ai_router", async () => {
    const ids = (await redis.smembers("ai:router:index")) || [];
    const rows = await mgetExisting(ids.map((id) => `ai:router:${id}`));
    return rows.map((r) => ensureRuleDefaults({ ...r }));
  });
}

async function saveRule(row) {
  row.updated_at = nowIso();
  await redis.set(`ai:router:${row.task_id}`, row);
  await redis.sadd("ai:router:index", row.task_id);
  invalidate("ai_router");
}

export async function handleAiRouterAdminRoutes(req, res, path, ctx) {
  const { readJson, ok, err, session } = ctx;
  const audit = auditLogger("router_rule");

  if (path === "/api/admin/ai/router" && req.method === "GET") {
    ok(res, { rows: await listRouterRules() });
    return true;
  }

  // Auto-assign: wires every clinical task's router rule to the prompt
  // imported for it (matched by task_id, set at import time - see
  // import-prompt-seed.mjs) and a default model, so "every clinical task
  // must automatically load prompt/version/model" holds without hand-
  // configuring 90 router rules one by one. Never overwrites a rule an
  // admin already configured (fills gaps only) unless force=true is passed.
  // Publishing each prompt (clinical review gate) remains separate and
  // manual - this only wires the ROUTING, not what goes live for doctors.
  if (path === "/api/admin/ai/router/auto-assign" && req.method === "POST") {
    const body = await readJson(req);
    const force = body.force === true;
    const [tasks, prompts, models, existingRules] = await Promise.all([
      listTasks(), listPrompts(), listEnabledModels(), listRouterRules(),
    ]);
    const promptByTaskId = {};
    for (const p of prompts) if (p.task_id && !promptByTaskId[p.task_id]) promptByTaskId[p.task_id] = p;
    const rulesByTaskId = Object.fromEntries(existingRules.map((r) => [r.task_id, r]));
    const defaultModelId = models[0]?.id || "";

    let assigned = 0;
    const skipped = [];
    for (const task of tasks) {
      const prompt = promptByTaskId[task.id];
      if (!prompt) { skipped.push({ task: task.name, reason: "no matching prompt" }); continue; }
      const existing = rulesByTaskId[task.id];
      if (existing && !force && existing.prompt_id) continue; // already configured, don't clobber

      const primaryModelId = prompt.preferred_model_id || existing?.primary_model_id || defaultModelId;
      if (!primaryModelId) { skipped.push({ task: task.name, reason: "no model available" }); continue; }

      const rule = ensureRuleDefaults({
        ...(existing || {}),
        task_id: task.id,
        prompt_id: prompt.id,
        primary_model_id: primaryModelId,
        fallback_model_ids: existing?.fallback_model_ids?.length ? existing.fallback_model_ids
          : [prompt.fallback_model_id, prompt.second_fallback_model_id].filter(Boolean),
        guideline_ids: existing?.guideline_ids?.length ? existing.guideline_ids : (prompt.guideline_ids || []),
      });
      await saveRule(rule);
      assigned++;
    }
    await audit(session, "auto_assign", "-", { assigned, skipped: skipped.length, force });
    ok(res, { ok: true, assigned, skipped });
    return true;
  }

  const match = path.match(/^\/api\/admin\/ai\/router\/([^/]+)$/);
  if (match && req.method === "GET") {
    const rule = await getRouterRule(decodeURIComponent(match[1]));
    if (!rule) { err(res, 404, "Aucune règle pour cette tâche clinique"); return true; }
    ok(res, { row: rule });
    return true;
  }

  // Create or fully replace the rule for a task (PUT is the natural verb
  // here since the taskId itself is the key, not a generated id).
  if (match && (req.method === "PUT" || req.method === "POST" || req.method === "PATCH")) {
    const taskId = decodeURIComponent(match[1]);
    const existing = await getRouterRule(taskId) || {};
    const body = await readJson(req);
    const rule = ensureRuleDefaults({ ...existing, ...body, task_id: taskId, created_at: existing.created_at || nowIso() });
    if (!rule.primary_model_id) { err(res, 400, "primary_model_id requis"); return true; }
    await saveRule(rule);
    await audit(session, "upsert", taskId, { primary_model_id: rule.primary_model_id });
    ok(res, { row: rule });
    return true;
  }

  if (match && req.method === "DELETE") {
    const taskId = decodeURIComponent(match[1]);
    await redis.del(`ai:router:${taskId}`);
    await redis.srem("ai:router:index", taskId);
    invalidate("ai_router");
    await audit(session, "delete", taskId, {});
    ok(res, { ok: true });
    return true;
  }

  return false;
}
