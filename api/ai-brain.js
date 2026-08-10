// The AI Management "brain" endpoint - the complete pipeline for both
// public doctor-facing AI paths the desktop app calls
// (/api/me/ai/chat, /api/me/ai/analyze-document). Same URL, same response
// shape as before this module existed, so the desktop needs no changes and
// never learns anything about providers/models/keys.
//
// Pipeline (matches the architecture spec 1:1):
//   Doctor Request -> Authentication -> License Validation -> AI Plan
//   Validation -> Feature Flags -> Clinical Task Detection -> Prompt
//   Library -> Prompt Version -> Prompt Variables -> Guidelines Injection
//   -> Model Router -> Model Selection -> Provider Selection -> Retry
//   Policy -> Fallback Model -> AI Provider -> Structured JSON -> Usage ->
//   Costs -> Logs -> Audit(config side, not per-request) -> Desktop Response
//
// Low-level pieces (model cache, connector resolution, retry/fallback walk,
// guideline text building, prompt-template rendering) live in
// api/ai-pipeline-core.js and are shared with the Testing Playground and
// the Prompt Library's own "test this prompt" action.

import { redis } from "./redis.js";
import { nowIso, cleanStr } from "./ai-store.js";
import { getRouterRule } from "./ai-router.js";
import { loadActivePromptVersion } from "./ai-prompts.js";
import { findTaskByActionType, findTaskForRequest, getTask } from "./ai-catalog.js";
import { specialtyPersona } from "./ai-personas.js";
import { retrieveGuidelineExcerpts } from "./ai-knowledge-base.js";
import { getPlan } from "./ai-plans.js";
import { seedModelDefaults } from "./ai-models.js";
import { supportsStreaming, streamAiProviderChat } from "./ai-providers.js";
import { checkRateLimit } from "./ai-ratelimit.js";
import { recordAiUsage, recordPromptFeedback } from "./ai-usage.js";
import { getAiSettings } from "./ai-settings.js";
import { isFlagDisabled, isFlagEnabled, GLOBAL_BRAIN_FLAG } from "./ai-flags.js";
import { getCreditCosts, creditCostFor, logCreditAction } from "./doctor-usage.js";
import { normalizeMessages, messagesHaveImages, messagesHaveFiles } from "./ai-messages.js";
import { getRegistration, getLicense } from "./licensing.js";
import { cachedPrompt, responseCacheKey, getCachedResponse, setCachedResponse } from "./ai-cache.js";
import {
  buildModelChain, callModelChain, applyPromptLibrary,
  tryParseStructured, resolveKeyForModel,
} from "./ai-pipeline-core.js";

const PUBLIC_PATHS = new Set(["/api/me/ai/chat", "/api/me/ai/analyze-document"]);

async function verifyDoctorToken(req) {
  const token = (req.headers["x-doctor-token"] || "").toString().trim();
  if (!token) return null;
  const doctorId = await redis.get(`doctor:token:${token}`);
  if (!doctorId) return null;
  return await redis.get(`doctor:${doctorId}`);
}

// ---------- License Validation ----------
// Doctors created through the desktop activation flow carry a
// registration_id linking back to the licensing system (api/licensing.js).
// Doctors created directly in the admin panel (no desktop license attached)
// have none and are governed by their AI Plan/account status alone - that
// is the existing data model (see DOCTOR_SIDE_INTEGRATION.md), not a new
// bypass introduced here.
async function validateLicense(doctor) {
  if (!doctor.registration_id) return { ok: true };
  const registration = await getRegistration(doctor.registration_id);
  if (!registration || !registration.license_id) return { ok: true };
  const license = await getLicense(registration.license_id);
  if (!license) return { ok: true };
  if (license.status === "revoked") return { ok: false, reason: "Licence révoquée. Contactez le support MediSmart." };
  if (license.license_type === "trial" && license.expires_at) {
    if (Date.now() >= new Date(license.expires_at).getTime()) {
      return { ok: false, reason: "Période d'essai expirée." };
    }
  }
  return { ok: true };
}

// Shared by the real doctor-facing endpoint and the admin Testing
// Playground: Clinical Task Detection -> Model Router -> Prompt Library ->
// Prompt Version -> Guidelines, so both go through identical wiring instead
// of two parallel implementations. Guideline ids are merged from the
// prompt itself (Prompt Library: "each prompt can be linked to one or more
// guidelines") and the router rule (task-level guidelines), so either place
// an admin attaches a guideline takes effect.
async function resolvePipeline({ actionType, taskId, specialty = "", plan, hasImages, hasFiles, requirePublished = true, extraKeywords = [] }) {
  const resolvedTaskId = taskId || (await findTaskForRequest(specialty, actionType))?.id || "";
  const rule = resolvedTaskId ? await getRouterRule(resolvedTaskId) : null;
  const task = resolvedTaskId ? await getTask(resolvedTaskId) : null;

  let promptVersion = null;
  let promptMeta = null;
  let promptCacheHit = false;
  if (rule?.prompt_id) {
    // Only the real (published-required) path is cached: caching an
    // unpublished-allowed lookup under the same key could otherwise leak a
    // draft/testing version into real traffic on the next request.
    if (requirePublished) {
      const { value: active, cacheHit } = await cachedPrompt(rule.prompt_id, () => loadActivePromptVersion(rule.prompt_id));
      promptCacheHit = cacheHit;
      if (active) { promptVersion = active.version; promptMeta = active.prompt; }
    } else {
      const active = await loadActivePromptVersion(rule.prompt_id, { requirePublished: false });
      if (active) { promptVersion = active.version; promptMeta = active.prompt; }
    }
  }

  // Guidelines Injection: retrieve only the relevant excerpts (Medical
  // Knowledge Base, api/ai-knowledge-base.js) - never the whole guideline.
  // Keywords come from the clinical task name + prompt description/name +
  // whatever the caller already knows about this request (e.g. a
  // chief_complaint variable), so retrieval is actually about THIS request,
  // not just "every guideline attached to this task".
  const guidelineIds = [...(promptMeta?.guideline_ids || []), ...(rule?.guideline_ids || [])];
  const keywords = [task?.name, promptMeta?.name, promptMeta?.description, ...extraKeywords].filter(Boolean);
  const { text: guidelineText, cacheHit: guidelineCacheHit } = await retrieveGuidelineExcerpts(guidelineIds, { keywords, language: promptMeta?.language || "fr", requirePublished });

  // Model Selection: a prompt's own recommended models (Preferred/Fallback/
  // Second Fallback) take precedence over the router rule's chain when
  // present, since the Prompt Library is what now owns model compatibility
  // per prompt; falls back to the router rule, then to the enabled catalog.
  let chainIds = null;
  if (promptMeta && (promptMeta.preferred_model_id || promptMeta.fallback_model_id || promptMeta.second_fallback_model_id)) {
    chainIds = [promptMeta.preferred_model_id, promptMeta.fallback_model_id, promptMeta.second_fallback_model_id].filter(Boolean);
  } else if (rule?.primary_model_id) {
    chainIds = [rule.primary_model_id, ...(rule.fallback_model_ids || [])];
  }
  const models = await buildModelChain({ chainIds, plan, needsVision: hasImages || hasFiles });

  return { taskId: resolvedTaskId, rule, promptMeta, promptId: promptMeta?.id || "", promptVersion, guidelineText, cacheHit: guidelineCacheHit || promptCacheHit, models };
}

export async function handleAiBrainRoutes(req, res, path, ctx) {
  const { readJson, ok, err } = ctx;
  if (!PUBLIC_PATHS.has(path)) return false;
  if (req.method !== "POST") { err(res, 405, "Method not allowed"); return true; }

  // ---- Authentication ----
  const doctor = await verifyDoctorToken(req);
  if (!doctor) { err(res, 401, "Token medecin invalide"); return true; }
  if (!doctor.active || !doctor.ai_enabled) { err(res, 403, "IA desactivee pour ce compte"); return true; }

  // ---- License Validation ----
  const licenseCheck = await validateLicense(doctor);
  if (!licenseCheck.ok) { err(res, 403, licenseCheck.reason); return true; }

  // ---- Feature Flags (global kill switch, or this doctor's own opt-out - see Doctor AI Configuration) ----
  const globalFlagDisabled = await isFlagDisabled(GLOBAL_BRAIN_FLAG);
  const doctorOptedOut = (doctor.disabled_flag_keys || []).includes(GLOBAL_BRAIN_FLAG);
  if (doctorOptedOut || globalFlagDisabled) {
    // Temporary diagnostic: this 503 was reported as persisting even after
    // disabled_flag_keys was confirmed empty in the admin panel -- logging
    // the exact values this specific request read so the next occurrence
    // is provable from a Vercel log instead of another guess-and-check
    // round trip. Remove once the live cause is confirmed.
    console.error("[ai-brain] global flag 503", {
      doctorId: doctor.id, email: doctor.email, doctorOptedOut,
      disabledFlagKeys: doctor.disabled_flag_keys, globalFlagDisabled,
    });
    err(res, 503, "IA temporairement désactivée par l'administrateur.");
    return true;
  }

  // ---- AI Plan Validation (credits + rate limit) ----
  const plan = doctor.ai_plan_id ? await getPlan(doctor.ai_plan_id) : null;
  // Doctor AI Configuration: a per-doctor model allow-list narrower than the
  // plan's (never wider - the plan remains the outer boundary). Applied as
  // an extra intersection at model-chain build time, see buildModelChain's
  // plan.allowed_model_ids usage in api/ai-pipeline-core.js.
  const effectivePlan = (doctor.allowed_model_ids_override || []).length
    ? { ...(plan || {}), allowed_model_ids: (plan?.allowed_model_ids?.length ? plan.allowed_model_ids.filter((id) => doctor.allowed_model_ids_override.includes(id)) : doctor.allowed_model_ids_override) }
    : plan;
  const monthlyLimit = plan?.monthly_limit ?? doctor.monthly_limit ?? 0;
  const dailyLimit = plan?.daily_limit ?? doctor.daily_limit ?? 0;

  const costs = await getCreditCosts();
  const requestStartedAt = Date.now();
  const body = await readJson(req);
  const actionType = (body.action_type || "chat").toString();
  const cost = creditCostFor(costs, actionType);

  const monthlyRemaining = Math.max(0, monthlyLimit - (doctor.monthly_used || 0));
  const dailyRemaining = Math.max(0, dailyLimit - (doctor.daily_used || 0));
  if (monthlyRemaining < cost) { err(res, 402, "Limite mensuelle atteinte"); return true; }
  if (dailyRemaining < cost) { err(res, 429, "Limite journaliere atteinte"); return true; }

  const rateLimitPerMin = plan?.rate_limit_per_min || 20;
  const rate = await checkRateLimit(doctor.id, rateLimitPerMin);
  if (!rate.allowed) { err(res, 429, `Trop de requêtes (limite ${rate.limit}/min). Réessayez dans un instant.`); return true; }

  const messages = normalizeMessages(body);
  if (!messages.length) { err(res, 400, "Message requis"); return true; }
  const hasImages = messagesHaveImages(messages);
  const hasFiles = messagesHaveFiles(messages);

  // ---- Clinical Task Detection ----
  // body.specialty is the caller's current medical speciality, sent by the
  // web app (see cloudAi.js) so this resolves to that speciality's own task
  // instead of whichever task sorts first for this action_type. Optional:
  // the desktop app sends nothing and keeps the previous behaviour.
  // Falls back to the speciality captured on the doctor's own account at
  // activation (provisionCloudAiDoctor in api/licensing.js), so a client that
  // sends nothing -- the desktop app today -- still gets its speciality's
  // task, prompt and persona rather than the first task matching action_type.
  const requestSpecialty = cleanStr(body.specialty || doctor.specialty_name || "", 100);
  const resolvedTaskId = (body.task_id || (await findTaskForRequest(requestSpecialty, actionType))?.id || "");
  if (resolvedTaskId && ((doctor.disabled_flag_keys || []).includes(`task:${resolvedTaskId}`) || await isFlagDisabled(`task:${resolvedTaskId}`))) {
    err(res, 503, "Cette tâche clinique est temporairement désactivée par l'administrateur.");
    return true;
  }

  // ---- Model catalog self-heal ----
  // seedModelDefaults()/seedConnectorDefaults() previously ran ONLY from the
  // admin panel's Connectors/Models tabs (handleAiConnectorsAdminRoutes /
  // handleAiModelsAdminRoutes) -- on a deployment where no admin had ever
  // opened those specific tabs, ai:model stayed genuinely empty and every
  // doctor got "Aucun modele IA disponible" (line ~360 below) forever, with
  // no way to recover short of an admin stumbling into the right screen.
  // seedIfEmpty() is a no-op once the store is populated, so this is a cheap
  // safety net, not a real seeding cost on the hot path after the first call.
  await seedModelDefaults();

  // ---- Prompt Library / Prompt Version / Guidelines Injection / Model Router ----
  const promptRenderStartedAt = Date.now();
  const { rule, promptId, promptVersion, guidelineText, cacheHit: pipelineCacheHit, models } = await resolvePipeline({
    actionType, taskId: resolvedTaskId, specialty: requestSpecialty, plan: effectivePlan, hasImages, hasFiles,
    extraKeywords: [body.variables?.chief_complaint, body.variables?.clinical_notes].filter(Boolean),
  });

  if (!models.length) {
    const reason = hasImages || hasFiles
      ? "Aucun modèle avec support vision n'est disponible pour votre offre IA."
      : "Aucun modèle IA disponible pour votre offre IA. Contactez votre administrateur MediSmart.";
    err(res, 409, reason);
    return true;
  }

  // ---- Prompt Variables (defaults {{language}} to this doctor's configured
  // default when the caller doesn't specify one - see Doctor AI Configuration) ----
  const variables = { language: doctor.default_language || "fr", ...(body.variables || {}) };
  let finalMessages = applyPromptLibrary(messages, promptVersion, guidelineText, variables);
  // Built-in speciality persona -- the floor for tasks whose Prompt Library
  // entry hasn't been authored/published yet, which is EVERY task on a fresh
  // deployment (the library ships empty on purpose, it is the clinically
  // reviewed path). applyPromptLibrary is a pure passthrough in that case, so
  // without this the model got only whatever raw system message the calling
  // app happened to send -- and nothing at all from a caller that sends none.
  //
  // Only when there is no published prompt: a real prompt version always
  // wins, so this can never override admin-authored clinical content. Unlike
  // applyPromptLibrary (which replaces the client's system message), this
  // PREPENDS, so an app's own speciality prompt still applies on top.
  if (!promptVersion) {
    const personaSpecialty = requestSpecialty || cleanStr(doctor.specialty_name || "", 100);
    const personaText = [specialtyPersona(personaSpecialty, actionType), guidelineText ? `Guidelines:\n${guidelineText}` : ""]
      .filter(Boolean).join("\n\n");
    finalMessages = [{ role: "system", content: personaText }, ...finalMessages];
  }
  const promptRenderMs = Date.now() - promptRenderStartedAt;
  // 512 was too small a default once reasoning-heavy models (GPT-5 and
  // similar) entered the router chain - they spend part of the token budget
  // on internal reasoning before the visible answer, so a tight default cut
  // the real content down to nothing even though the call itself succeeded.
  const maxTokens = Math.min(8192, Math.max(64, parseInt(body.max_tokens || 2048, 10)));

  const settings = await getAiSettings();

  // ---- Response Cache (opt-in, off by default) ----
  const responseCacheOn = await isFlagEnabled("ai_response_cache_enabled");
  const cacheKey = responseCacheOn
    ? responseCacheKey({ taskId: resolvedTaskId, modelId: models[0].id, promptVersion: rule?.prompt_version || 0, messages: finalMessages })
    : null;
  if (cacheKey) {
    const cachedHit = await getCachedResponse(cacheKey);
    if (cachedHit) {
      await recordAiUsage({
        doctorId: doctor.id, modelId: models[0].id, specialtyId: resolvedTaskId, actionType,
        success: true, details: "response cache hit", latencyMs: Date.now() - requestStartedAt,
        promptRenderMs, guidelineMs: 0, modelLatencyMs: 0, networkMs: 0, cacheHit: true,
      });
      ok(res, cachedHit);
      return true;
    }
  }

  // ---- Streaming (opt-in via body.stream === true; only OpenAI-compatible
  // connectors support it today - see api/ai-providers.js) ----
  if (body.stream === true) {
    const primaryModel = models[0];
    const resolved = await resolveKeyForModel(primaryModel);
    if (resolved && supportsStreaming(resolved.connector)) {
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      });
      let full = "";
      try {
        for await (const delta of streamAiProviderChat({
          connector: resolved.connector, apiKey: resolved.key, model: primaryModel.model_id,
          messages: finalMessages, maxTokens, temperature: rule?.temperature_override ?? primaryModel.temperature,
          topP: primaryModel.top_p, timeoutMs: primaryModel.timeout_ms,
        })) {
          full += delta;
          res.write(`data: ${JSON.stringify({ delta })}\n\n`);
        }
        doctor.monthly_used = (doctor.monthly_used || 0) + cost;
        doctor.daily_used = (doctor.daily_used || 0) + cost;
        doctor.updated_at = nowIso();
        await redis.set(`doctor:${doctor.id}`, doctor);
        await logCreditAction(doctor.id, actionType, cost, true, false, `${resolved.name} (stream)`);
        await recordAiUsage({
          doctorId: doctor.id, modelId: primaryModel.id, specialtyId: resolvedTaskId, actionType,
          success: true, details: "stream", latencyMs: Date.now() - requestStartedAt, promptRenderMs,
        });
        res.write(`data: ${JSON.stringify({ done: true, credits_used: cost, safety_note: settings.safety_note })}\n\n`);
      } catch (e) {
        res.write(`data: ${JSON.stringify({ error: e.message })}\n\n`);
      }
      res.end();
      return true;
    }
    // Falls through to the normal buffered path if the primary model's
    // connector can't stream - the desktop still gets one full response.
  }

  // ---- AI Provider (Provider Selection + Retry Policy + Fallback Model) ----
  let callResult;
  try {
    callResult = await callModelChain(models, finalMessages, {
      maxTokens,
      temperature: rule?.temperature_override,
    });
  } catch (e) {
    await logCreditAction(doctor.id, actionType, 0, false, false, e.message);
    await recordAiUsage({
      doctorId: doctor.id, modelId: models[0]?.id, specialtyId: resolvedTaskId, promptId, actionType,
      success: false, details: e.message, latencyMs: Date.now() - requestStartedAt,
      promptRenderMs, guidelineMs: 0, cacheHit: false,
    });
    err(res, 502, `Erreur IA: ${e.message}`);
    return true;
  }

  const totalLatencyMs = Date.now() - requestStartedAt;
  const model = callResult.model;
  const costMicros = Math.round(
    callResult.tokens_in * (model.price_per_million_in || 0) + callResult.tokens_out * (model.price_per_million_out || 0),
  );

  // ---- Structured JSON ----
  const structured = tryParseStructured(callResult.text, promptVersion, model);

  doctor.monthly_used = (doctor.monthly_used || 0) + cost;
  doctor.daily_used = (doctor.daily_used || 0) + cost;
  doctor.updated_at = nowIso();
  await redis.set(`doctor:${doctor.id}`, doctor);

  // ---- Usage / Costs / Logs ----
  await logCreditAction(doctor.id, actionType, cost, true, false, `${callResult.keyName} (${model.name})${callResult.usedFallback ? " [fallback]" : ""}`);
  await recordAiUsage({
    doctorId: doctor.id, modelId: model.id, specialtyId: resolvedTaskId, promptId, actionType,
    tokensIn: callResult.tokens_in, tokensOut: callResult.tokens_out, latencyMs: totalLatencyMs, costMicros,
    success: true, details: `${model.name}${callResult.usedFallback ? " [fallback]" : ""}`,
    promptRenderMs, guidelineMs: 0, modelLatencyMs: callResult.networkMs, networkMs: callResult.networkMs,
    cacheHit: pipelineCacheHit, confidence: structured?.confidence,
  });

  // ---- Desktop Response ----
  const response = {
    content: callResult.text,
    provider: model.name,
    model: model.model_id,
    model_auto_routed: callResult.usedFallback,
    api_key_name: callResult.keyName,
    credits_used: cost,
    monthly_remaining: Math.max(0, monthlyLimit - doctor.monthly_used),
    daily_remaining: Math.max(0, dailyLimit - doctor.daily_used),
    credits_remaining: Math.max(0, monthlyLimit - doctor.monthly_used),
    safety_note: settings.safety_note,
  };
  if (structured) response.structured = structured;

  if (cacheKey) await setCachedResponse(cacheKey, response, settings.response_cache_ttl_seconds);

  ok(res, response);
  return true;
}

// Admin-only dry run for the Testing Playground: same resolvePipeline/
// callModelChain wiring as the real endpoint, but bypasses doctor auth,
// license, credits and rate limiting (admin session already required by
// the caller) and never writes doctor usage/logs - only used to preview a
// task's current Prompt Library + Model Router + Guideline configuration.
export async function handleAiPlaygroundRoute(req, res, path, ctx) {
  const { readJson, ok, err } = ctx;
  if (path !== "/api/admin/ai/playground" || req.method !== "POST") return false;

  const body = await readJson(req);
  const actionType = cleanStr(body.action_type || "chat", 50);
  const messages = normalizeMessages(body);
  if (!messages.length) { err(res, 400, "Message requis"); return true; }
  const hasImages = messagesHaveImages(messages);
  const hasFiles = messagesHaveFiles(messages);

  const { taskId, rule, promptVersion, guidelineText, models } = await resolvePipeline({
    actionType, taskId: cleanStr(body.task_id, 100), plan: null, hasImages, hasFiles, requirePublished: false,
    extraKeywords: [body.variables?.chief_complaint, body.variables?.clinical_notes].filter(Boolean),
  });

  if (!models.length) { err(res, 503, "Aucun modèle IA disponible (vérifiez Models / Model Router / AI Plans)."); return true; }

  const finalMessages = applyPromptLibrary(messages, promptVersion, guidelineText, body.variables || {});

  try {
    const result = await callModelChain(models, finalMessages, {
      maxTokens: body.max_tokens,
      temperature: rule?.temperature_override,
    });
    ok(res, {
      raw_text: result.text,
      structured_preview: tryParseStructured(result.text, promptVersion, result.model),
      resolved_task_id: taskId,
      prompt_used: Boolean(promptVersion),
      guideline_injected: Boolean(guidelineText),
      provider: result.connector.name,
      model: result.model.model_id,
      used_fallback: result.usedFallback,
      network_ms: result.networkMs,
    });
  } catch (e) {
    err(res, 502, e.message);
  }
  return true;
}

// Doctor Feedback (Prompt Analytics requirement): infrastructure-complete
// and reachable today with a valid X-Doctor-Token, but the current desktop
// app has no UI wired to call it yet - same status as SSE streaming above,
// backend-ready and opt-in from the client side, no desktop change made
// here per instruction.
export async function handleAiFeedbackRoute(req, res, path, ctx) {
  const { readJson, ok, err } = ctx;
  if (path !== "/api/me/ai/feedback") return false;
  if (req.method !== "POST") { err(res, 405, "Method not allowed"); return true; }

  const doctor = await verifyDoctorToken(req);
  if (!doctor) { err(res, 401, "Token medecin invalide"); return true; }

  const body = await readJson(req);
  const promptId = cleanStr(body.prompt_id, 100);
  if (!promptId) { err(res, 400, "prompt_id requis"); return true; }

  const entry = await recordPromptFeedback(promptId, {
    doctorId: doctor.id, rating: body.rating, comment: body.comment,
  });
  ok(res, { ok: true, feedback: entry }, 201);
  return true;
}
