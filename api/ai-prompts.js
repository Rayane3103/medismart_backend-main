// Prompt Library: the central medical intelligence of MediSmart. Every AI
// request (api/ai-brain.js) resolves its system/developer/user prompt from
// here - there is no hardcoded prompt text anywhere in this backend.
//
// Storage:
//   ai:prompt:{id}                        JSON metadata (name, description,
//                                          specialty_id, task_id, status,
//                                          language, confidence_threshold,
//                                          preferred/fallback/second_fallback
//                                          _model_id, guideline_ids,
//                                          variables, expected_json,
//                                          created_by, updated_by,
//                                          current_version)
//   ai:prompts:index                      SET of prompt ids
//   ai:prompt:{id}:version:{n}            JSON version body (system/
//                                          developer/user_template/
//                                          output_schema)
//   ai:prompt:{id}:versions                ZSET (score = version number n)

import { redis, cached, invalidate, mgetExisting } from "./redis.js";
import { uuid, nowIso, cleanStr } from "./ai-store.js";
import { auditLogger } from "./ai-audit.js";
import { buildModelChain, callModelChain, applyPromptLibrary, tryParseStructured } from "./ai-pipeline-core.js";
import { retrieveGuidelineExcerpts } from "./ai-knowledge-base.js";
import { promptAnalytics, readPromptFeedback } from "./ai-usage.js";
import { invalidatePromptCache } from "./ai-cache.js";

// Draft -> Testing -> Published -> Archived. Only a "publish" action (admin-
// only, like every /api/admin/* route) moves a prompt into Published, which
// is the only status the AI brain will actually inject into real doctor
// traffic (see loadActivePromptVersion) - Draft/Testing prompts can still be
// exercised through the Testing Playground / this module's own /test route,
// just never reach a doctor until explicitly published.
const STATUSES = ["draft", "testing", "published", "archived"];

function migrateStatus(raw) {
  if (raw === "active") return "published"; // pre-existing rows from before this status set existed
  if (raw === "deprecated") return "archived";
  return STATUSES.includes(raw) ? raw : "draft";
}

function ensurePromptDefaults(row) {
  row.name = cleanStr(row.name, 150) || "Untitled prompt";
  row.description = cleanStr(row.description, 500);
  row.specialty_id = cleanStr(row.specialty_id, 100);
  row.task_id = cleanStr(row.task_id, 100);
  row.status = migrateStatus(row.status);
  row.language = cleanStr(row.language, 20) || "fr";
  row.confidence_threshold = Number.isFinite(+row.confidence_threshold) ? Math.min(1, Math.max(0, +row.confidence_threshold)) : 0.7;
  row.preferred_model_id = cleanStr(row.preferred_model_id, 100);
  row.fallback_model_id = cleanStr(row.fallback_model_id, 100);
  row.second_fallback_model_id = cleanStr(row.second_fallback_model_id, 100);
  row.guideline_ids = Array.isArray(row.guideline_ids) ? row.guideline_ids.filter(Boolean).slice(0, 10) : [];
  row.variables = Array.isArray(row.variables) ? row.variables.filter(Boolean).slice(0, 50) : [];
  row.expected_json = cleanStr(row.expected_json, 8000);
  row.created_by = cleanStr(row.created_by, 100);
  row.updated_by = cleanStr(row.updated_by, 100);
  row.current_version = Number.isFinite(+row.current_version) ? +row.current_version : 0;
  return row;
}

function ensureVersionDefaults(row) {
  row.system_prompt = cleanStr(row.system_prompt, 20000);
  row.developer_prompt = cleanStr(row.developer_prompt, 20000);
  row.user_template = cleanStr(row.user_template, 20000);
  row.output_schema = cleanStr(row.output_schema, 20000);
  row.created_by = cleanStr(row.created_by, 100);
  row.created_at = row.created_at || nowIso();
  return row;
}

async function getPrompt(id) {
  const row = await redis.get(`ai:prompt:${id}`);
  return row ? ensurePromptDefaults({ ...row }) : null;
}

async function savePrompt(row) {
  row.updated_at = nowIso();
  await redis.set(`ai:prompt:${row.id}`, row);
  invalidate("ai_prompts");
  // A status change (publish/archive) or any metadata edit must take effect
  // on the very next request, not up to 60s later - see ai-cache.js.
  await invalidatePromptCache(row.id);
}

export async function listPrompts() {
  return cached("ai_prompts", async () => {
    const ids = (await redis.smembers("ai:prompts:index")) || [];
    const rows = await mgetExisting(ids.map((id) => `ai:prompt:${id}`));
    return rows.map((r) => ensurePromptDefaults({ ...r })).sort((a, b) => a.name.localeCompare(b.name));
  });
}

async function getVersion(promptId, n) {
  const row = await redis.get(`ai:prompt:${promptId}:version:${n}`);
  return row ? ensureVersionDefaults({ ...row }) : null;
}

async function saveVersion(promptId, n, row) {
  await redis.set(`ai:prompt:${promptId}:version:${n}`, row);
  await redis.zadd(`ai:prompt:${promptId}:versions`, { score: n, member: String(n) });
}

async function listVersions(promptId) {
  const members = (await redis.zrange(`ai:prompt:${promptId}:versions`, 0, -1, { rev: true })) || [];
  const rows = await Promise.all(members.map((n) => getVersion(promptId, n)));
  return members.map((n, i) => ({ version: Number(n), ...rows[i] })).filter((r) => r.system_prompt !== undefined || r.user_template !== undefined);
}

// Production path (api/ai-brain.js real doctor traffic): only ever returns
// a version when the prompt has been explicitly Published - "Only
// administrators can publish prompts" is enforced right here, not just in
// the UI, since every /api/admin/* route (including publish) already
// requires an admin session and doctors have no route that can reach this
// module at all.
export async function loadActivePromptVersion(promptId, { requirePublished = true } = {}) {
  const prompt = await getPrompt(promptId);
  if (!prompt || !prompt.current_version) return null;
  if (requirePublished && prompt.status !== "published") return null;
  const version = await getVersion(promptId, prompt.current_version);
  return version ? { prompt, version: { version: prompt.current_version, ...version } } : null;
}

async function createVersion(promptId, body, author) {
  const prompt = await getPrompt(promptId);
  if (!prompt) return null;
  const n = prompt.current_version + 1;
  const version = ensureVersionDefaults({ ...body, created_by: author });
  await saveVersion(promptId, n, version);
  prompt.current_version = n;
  // A brand-new version always starts back at Testing, never auto-published -
  // publishing is a separate explicit admin action (see the /publish route).
  if (prompt.status === "published" || prompt.status === "archived") prompt.status = "testing";
  prompt.updated_by = author;
  await savePrompt(prompt);
  return { version: n, ...version };
}

// Auto-extracts {{variable}} placeholders actually referenced by a
// version's templates - a convenience cross-check against the admin-
// declared `variables` list, not a replacement for it.
function extractTemplateVariables(version) {
  const found = new Set();
  const re = /\{\{(\w+)\}\}/g;
  for (const text of [version?.system_prompt, version?.developer_prompt, version?.user_template]) {
    if (!text) continue;
    let m;
    while ((m = re.exec(text))) found.add(m[1]);
  }
  return Array.from(found);
}

function applyPromptFields(prompt, body) {
  if (body.name !== undefined) prompt.name = cleanStr(body.name, 150);
  if (body.description !== undefined) prompt.description = cleanStr(body.description, 500);
  if (body.specialty_id !== undefined) prompt.specialty_id = cleanStr(body.specialty_id, 100);
  if (body.task_id !== undefined) prompt.task_id = cleanStr(body.task_id, 100);
  if (body.status !== undefined && STATUSES.includes(body.status)) prompt.status = body.status;
  if (body.language !== undefined) prompt.language = cleanStr(body.language, 20) || "fr";
  if (body.confidence_threshold !== undefined) prompt.confidence_threshold = Math.min(1, Math.max(0, +body.confidence_threshold || 0));
  if (body.preferred_model_id !== undefined) prompt.preferred_model_id = cleanStr(body.preferred_model_id, 100);
  if (body.fallback_model_id !== undefined) prompt.fallback_model_id = cleanStr(body.fallback_model_id, 100);
  if (body.second_fallback_model_id !== undefined) prompt.second_fallback_model_id = cleanStr(body.second_fallback_model_id, 100);
  if (body.guideline_ids !== undefined) prompt.guideline_ids = Array.isArray(body.guideline_ids) ? body.guideline_ids.filter(Boolean).slice(0, 10) : [];
  if (body.variables !== undefined) prompt.variables = Array.isArray(body.variables) ? body.variables.filter(Boolean).slice(0, 50) : [];
  if (body.expected_json !== undefined) prompt.expected_json = cleanStr(body.expected_json, 8000);
}

// ---------------------------------------------------------------------
// Export / Import serialization: JSON (round-trips with import), YAML and
// Markdown (human-readable export only - no YAML/Markdown parser is added
// for import, to avoid pulling in a parsing dependency for a rarely-used
// path; JSON import remains the supported round-trip format).
// ---------------------------------------------------------------------

function yamlEscape(value) {
  if (value == null) return '""';
  const s = String(value);
  if (s === "") return '""';
  if (/[:#\-\n"']/.test(s) || /^\s|\s$/.test(s)) return JSON.stringify(s);
  return s;
}

function toYaml(promptsWithVersions) {
  const lines = ["prompts:"];
  for (const p of promptsWithVersions) {
    lines.push(`  - id: ${yamlEscape(p.id)}`);
    lines.push(`    name: ${yamlEscape(p.name)}`);
    lines.push(`    specialty_id: ${yamlEscape(p.specialty_id)}`);
    lines.push(`    task_id: ${yamlEscape(p.task_id)}`);
    lines.push(`    status: ${yamlEscape(p.status)}`);
    lines.push(`    language: ${yamlEscape(p.language)}`);
    lines.push(`    confidence_threshold: ${p.confidence_threshold}`);
    lines.push(`    preferred_model_id: ${yamlEscape(p.preferred_model_id)}`);
    lines.push(`    fallback_model_id: ${yamlEscape(p.fallback_model_id)}`);
    lines.push(`    second_fallback_model_id: ${yamlEscape(p.second_fallback_model_id)}`);
    lines.push(`    guideline_ids: [${(p.guideline_ids || []).map(yamlEscape).join(", ")}]`);
    lines.push(`    variables: [${(p.variables || []).map(yamlEscape).join(", ")}]`);
    lines.push("    versions:");
    for (const v of p.versions || []) {
      lines.push(`      - version: ${v.version}`);
      lines.push(`        system_prompt: ${yamlEscape(v.system_prompt)}`);
      lines.push(`        developer_prompt: ${yamlEscape(v.developer_prompt)}`);
      lines.push(`        user_template: ${yamlEscape(v.user_template)}`);
      lines.push(`        output_schema: ${yamlEscape(v.output_schema)}`);
    }
  }
  return lines.join("\n") + "\n";
}

function toMarkdown(promptsWithVersions) {
  const lines = ["# MediSmart Prompt Library Export", "", `_Exported ${nowIso()}_`, ""];
  for (const p of promptsWithVersions) {
    lines.push(`## ${p.name}`);
    lines.push("");
    lines.push(`- **Status**: ${p.status}`);
    lines.push(`- **Language**: ${p.language}`);
    lines.push(`- **Confidence threshold**: ${p.confidence_threshold}`);
    lines.push(`- **Models**: preferred=${p.preferred_model_id || "-"}, fallback=${p.fallback_model_id || "-"}, second fallback=${p.second_fallback_model_id || "-"}`);
    lines.push(`- **Variables**: ${(p.variables || []).join(", ") || "-"}`);
    lines.push(`- **Description**: ${p.description || "-"}`);
    lines.push("");
    const latest = (p.versions || [])[0];
    if (latest) {
      lines.push(`### Current version (v${latest.version})`);
      lines.push("");
      lines.push("**System prompt**");
      lines.push("```");
      lines.push(latest.system_prompt || "");
      lines.push("```");
      lines.push("**User template**");
      lines.push("```");
      lines.push(latest.user_template || "");
      lines.push("```");
    }
    lines.push("");
  }
  return lines.join("\n");
}

// Direct AI test for a specific prompt (Prompt Testing: sample patient/ECG/
// lab/MRI/CT/X-ray), bypassing task/router resolution entirely - uses the
// prompt's own recommended models (preferred/fallback/second fallback),
// falling back to the enabled catalog if none are set. Never touches doctor
// credits/usage/logs (this is an admin preview tool, not real traffic).
async function runPromptAiTest(prompt, version, { variables = {}, message = "", attachments = [] } = {}) {
  const content = [];
  if (message) content.push({ type: "text", text: message });
  for (const url of (attachments || []).slice(0, 6)) {
    if (typeof url === "string" && url.startsWith("data:")) content.push({ type: "image_url", image_url: { url } });
  }
  const messages = [{ role: "user", content: content.length ? content : (message || "Test") }];

  const keywords = [prompt.name, prompt.description, message].filter(Boolean);
  const { text: guidelineText } = await retrieveGuidelineExcerpts(prompt.guideline_ids || [], {
    keywords, language: prompt.language || "fr", requirePublished: false,
  });
  const finalMessages = applyPromptLibrary(messages, version, guidelineText, variables);

  const chainIds = [prompt.preferred_model_id, prompt.fallback_model_id, prompt.second_fallback_model_id].filter(Boolean);
  const models = await buildModelChain({ chainIds, plan: null, needsVision: attachments.length > 0 });
  if (!models.length) throw new Error("Aucun modèle disponible (configurez preferred_model_id ou activez des modèles).");

  const startedAt = Date.now();
  const result = await callModelChain(models, finalMessages, {});
  const latencyMs = Date.now() - startedAt;
  const structured = tryParseStructured(result.text, version, result.model);
  const costMicros = Math.round(
    (result.tokens_in || 0) * (result.model.price_per_million_in || 0) + (result.tokens_out || 0) * (result.model.price_per_million_out || 0),
  );

  return {
    latency_ms: latencyMs,
    tokens_in: result.tokens_in || 0,
    tokens_out: result.tokens_out || 0,
    cost_usd: costMicros / 1_000_000,
    confidence: Number.isFinite(structured?.confidence) ? structured.confidence : null,
    below_confidence_threshold: Number.isFinite(structured?.confidence) ? structured.confidence < prompt.confidence_threshold : null,
    returned_json: structured,
    raw_text: result.text,
    provider: result.connector.name,
    model: result.model.model_id,
    used_fallback: result.usedFallback,
  };
}

export async function handleAiPromptsAdminRoutes(req, res, path, ctx) {
  const { readJson, ok, err, session } = ctx;
  const audit = auditLogger("prompt");
  const author = session?.username || "admin";

  if (path === "/api/admin/ai/prompts" && req.method === "GET") {
    ok(res, { rows: await listPrompts() });
    return true;
  }

  if (path === "/api/admin/ai/prompts" && req.method === "POST") {
    const body = await readJson(req);
    const prompt = ensurePromptDefaults({
      id: uuid(),
      created_by: author,
      updated_by: author,
      created_at: nowIso(),
    });
    applyPromptFields(prompt, body);
    await savePrompt(prompt);
    await redis.sadd("ai:prompts:index", prompt.id);
    // Every new prompt starts with version 1 if a body was supplied.
    if (body.system_prompt || body.user_template) {
      await createVersion(prompt.id, body, author);
    }
    await audit(session, "create", prompt.id, { name: prompt.name });
    const fresh = await getPrompt(prompt.id);
    ok(res, { row: fresh }, 201);
    return true;
  }

  if (path === "/api/admin/ai/prompts/export" && req.method === "GET") {
    const url = new URL(req.url, "http://x");
    const format = (url.searchParams.get("format") || "json").toLowerCase();
    const rows = await listPrompts();
    const withVersions = await Promise.all(rows.map(async (p) => ({ ...p, versions: await listVersions(p.id) })));
    if (format === "yaml") {
      ctx.send ? ctx.send(res, 200, "application/x-yaml", toYaml(withVersions)) : ok(res, { yaml: toYaml(withVersions) });
      return true;
    }
    if (format === "markdown" || format === "md") {
      ctx.send ? ctx.send(res, 200, "text/markdown; charset=utf-8", toMarkdown(withVersions)) : ok(res, { markdown: toMarkdown(withVersions) });
      return true;
    }
    ok(res, { export: withVersions, exported_at: nowIso() });
    return true;
  }

  if (path === "/api/admin/ai/prompts/import" && req.method === "POST") {
    const body = await readJson(req);
    const items = Array.isArray(body.export) ? body.export : [];
    let imported = 0;
    for (const item of items) {
      const prompt = ensurePromptDefaults({
        id: uuid(),
        created_by: author,
        updated_by: author,
        created_at: nowIso(),
      });
      applyPromptFields(prompt, item);
      if (!item.name) prompt.name = "Imported prompt";
      await savePrompt(prompt);
      await redis.sadd("ai:prompts:index", prompt.id);
      for (const v of (item.versions || []).slice().reverse()) {
        await createVersion(prompt.id, v, author);
      }
      imported += 1;
    }
    await audit(session, "import", "-", { count: imported });
    ok(res, { ok: true, imported });
    return true;
  }

  const idMatch = path.match(/^\/api\/admin\/ai\/prompts\/([a-f0-9-]+)$/);
  if (idMatch && req.method === "GET") {
    const prompt = await getPrompt(idMatch[1]);
    if (!prompt) { err(res, 404, "Prompt introuvable"); return true; }
    ok(res, { row: prompt, versions: await listVersions(prompt.id) });
    return true;
  }

  if (idMatch && (req.method === "PATCH" || req.method === "PUT")) {
    const prompt = await getPrompt(idMatch[1]);
    if (!prompt) { err(res, 404, "Prompt introuvable"); return true; }
    const body = await readJson(req);
    applyPromptFields(prompt, body);
    prompt.updated_by = author;
    await savePrompt(prompt);
    await audit(session, "update", prompt.id, { name: prompt.name });
    ok(res, { row: prompt });
    return true;
  }

  if (idMatch && req.method === "DELETE") {
    const prompt = await getPrompt(idMatch[1]);
    if (prompt) {
      const versions = await listVersions(prompt.id);
      await Promise.all(versions.map((v) => redis.del(`ai:prompt:${prompt.id}:version:${v.version}`)));
      await redis.del(`ai:prompt:${prompt.id}:versions`);
    }
    await redis.del(`ai:prompt:${idMatch[1]}`);
    await redis.srem("ai:prompts:index", idMatch[1]);
    invalidate("ai_prompts");
    await invalidatePromptCache(idMatch[1]);
    await audit(session, "delete", idMatch[1], {});
    ok(res, { ok: true });
    return true;
  }

  // New version (system/developer/user_template/output_schema).
  const versionsMatch = path.match(/^\/api\/admin\/ai\/prompts\/([a-f0-9-]+)\/versions$/);
  if (versionsMatch && req.method === "POST") {
    const body = await readJson(req);
    const created = await createVersion(versionsMatch[1], body, author);
    if (!created) { err(res, 404, "Prompt introuvable"); return true; }
    await audit(session, "new_version", versionsMatch[1], { version: created.version });
    ok(res, { version: created }, 201);
    return true;
  }
  if (versionsMatch && req.method === "GET") {
    ok(res, { rows: await listVersions(versionsMatch[1]) });
    return true;
  }

  // Compare Versions: field-by-field diff of two version numbers.
  const compareMatch = path.match(/^\/api\/admin\/ai\/prompts\/([a-f0-9-]+)\/compare$/);
  if (compareMatch && req.method === "GET") {
    const url = new URL(req.url, "http://x");
    const a = parseInt(url.searchParams.get("a"), 10);
    const b = parseInt(url.searchParams.get("b"), 10);
    const [va, vb] = await Promise.all([getVersion(compareMatch[1], a), getVersion(compareMatch[1], b)]);
    if (!va || !vb) { err(res, 404, "Version introuvable"); return true; }
    const fields = ["system_prompt", "developer_prompt", "user_template", "output_schema"];
    const diff = fields.map((f) => ({ field: f, a: va[f] || "", b: vb[f] || "", changed: (va[f] || "") !== (vb[f] || "") }));
    ok(res, { a: { version: a, ...va }, b: { version: b, ...vb }, diff });
    return true;
  }

  // Rollback: make an older version the current one again (recorded as a new
  // version entry so history is never destructive).
  const rollbackMatch = path.match(/^\/api\/admin\/ai\/prompts\/([a-f0-9-]+)\/rollback$/);
  if (rollbackMatch && req.method === "POST") {
    const body = await readJson(req);
    const targetVersion = parseInt(body.version, 10);
    const old = await getVersion(rollbackMatch[1], targetVersion);
    if (!old) { err(res, 404, "Version introuvable"); return true; }
    const created = await createVersion(rollbackMatch[1], old, author);
    await audit(session, "rollback", rollbackMatch[1], { to_version: targetVersion, new_version: created.version });
    ok(res, { version: created });
    return true;
  }

  // Clone: duplicate a prompt (metadata + current version) as a new draft prompt.
  const cloneMatch = path.match(/^\/api\/admin\/ai\/prompts\/([a-f0-9-]+)\/clone$/);
  if (cloneMatch && req.method === "POST") {
    const source = await getPrompt(cloneMatch[1]);
    if (!source) { err(res, 404, "Prompt introuvable"); return true; }
    const sourceVersion = source.current_version ? await getVersion(source.id, source.current_version) : null;
    const clone = ensurePromptDefaults({
      ...source,
      id: uuid(),
      name: `${source.name} (copie)`,
      status: "draft",
      current_version: 0,
      created_by: author,
      updated_by: author,
      created_at: nowIso(),
    });
    await savePrompt(clone);
    await redis.sadd("ai:prompts:index", clone.id);
    if (sourceVersion) await createVersion(clone.id, sourceVersion, author);
    await audit(session, "clone", clone.id, { source: source.id });
    ok(res, { row: await getPrompt(clone.id) }, 201);
    return true;
  }

  // Publish / Archive: explicit status transitions, admin-only (this entire
  // module sits behind verifyAdminSession in api/index.js) - "Doctors cannot
  // modify prompts" holds because doctors have no route into this file at
  // all, only into api/ai-brain.js's read-only loadActivePromptVersion.
  const publishMatch = path.match(/^\/api\/admin\/ai\/prompts\/([a-f0-9-]+)\/publish$/);
  if (publishMatch && req.method === "POST") {
    const prompt = await getPrompt(publishMatch[1]);
    if (!prompt) { err(res, 404, "Prompt introuvable"); return true; }
    if (!prompt.current_version) { err(res, 409, "Aucune version à publier - créez une version d'abord."); return true; }
    prompt.status = "published";
    prompt.updated_by = author;
    await savePrompt(prompt);
    await audit(session, "publish", prompt.id, { version: prompt.current_version });
    ok(res, { row: prompt });
    return true;
  }

  const archiveMatch = path.match(/^\/api\/admin\/ai\/prompts\/([a-f0-9-]+)\/archive$/);
  if (archiveMatch && req.method === "POST") {
    const prompt = await getPrompt(archiveMatch[1]);
    if (!prompt) { err(res, 404, "Prompt introuvable"); return true; }
    prompt.status = "archived";
    prompt.updated_by = author;
    await savePrompt(prompt);
    await audit(session, "archive", prompt.id, {});
    ok(res, { row: prompt });
    return true;
  }

  // Variables: auto-extracted {{var}} occurrences in the current version,
  // for cross-checking against the admin-declared `variables` list.
  const variablesMatch = path.match(/^\/api\/admin\/ai\/prompts\/([a-f0-9-]+)\/variables$/);
  if (variablesMatch && req.method === "GET") {
    const prompt = await getPrompt(variablesMatch[1]);
    if (!prompt || !prompt.current_version) { err(res, 404, "Aucune version pour ce prompt"); return true; }
    const version = await getVersion(prompt.id, prompt.current_version);
    ok(res, { declared: prompt.variables, detected: extractTemplateVariables(version) });
    return true;
  }

  // Analytics: usage / success rate / avg confidence / avg latency / avg
  // cost / most used models for this prompt.
  const analyticsMatch = path.match(/^\/api\/admin\/ai\/prompts\/([a-f0-9-]+)\/analytics$/);
  if (analyticsMatch && req.method === "GET") {
    ok(res, { analytics: await promptAnalytics(analyticsMatch[1], 30) });
    return true;
  }

  // Doctor Feedback (read side - see api/ai-usage.js for the write side,
  // reachable from the doctor-facing POST /api/me/ai/feedback).
  const feedbackMatch = path.match(/^\/api\/admin\/ai\/prompts\/([a-f0-9-]+)\/feedback$/);
  if (feedbackMatch && req.method === "GET") {
    ok(res, { rows: await readPromptFeedback(feedbackMatch[1], 100) });
    return true;
  }

  // Test: render the user_template against sample variables. With
  // `run_ai: true`, also actually calls the AI (Prompt Testing: Sample
  // Patient/ECG/Laboratory/MRI/CT/X-Ray) and reports latency/tokens/cost/
  // confidence/returned JSON - ignores publish status (draft/testing
  // prompts are exactly what this is for).
  const testMatch = path.match(/^\/api\/admin\/ai\/prompts\/([a-f0-9-]+)\/test$/);
  if (testMatch && req.method === "POST") {
    const prompt = await getPrompt(testMatch[1]);
    if (!prompt || !prompt.current_version) { err(res, 404, "Aucune version active pour ce prompt"); return true; }
    const version = await getVersion(prompt.id, prompt.current_version);
    const body = await readJson(req);
    const vars = body.variables && typeof body.variables === "object" ? body.variables : {};

    if (body.run_ai === true) {
      try {
        const result = await runPromptAiTest(prompt, version, {
          variables: vars, message: cleanStr(body.message, 8000), attachments: body.attachments || [],
        });
        ok(res, result);
      } catch (e) {
        err(res, 502, e.message);
      }
      return true;
    }

    const rendered = String(version.user_template || "").replace(/\{\{(\w+)\}\}/g, (_, key) => cleanStr(vars[key] ?? `{{${key}}}`, 2000));
    ok(res, { system_prompt: version.system_prompt, developer_prompt: version.developer_prompt, rendered_user_prompt: rendered });
    return true;
  }

  return false;
}
