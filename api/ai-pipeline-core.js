// Shared low-level pipeline pieces: Model Cache/Connector Cache resolution,
// Provider Selection + Retry Policy + Fallback Model (callModelChain),
// Guidelines Injection text-building, and Prompt Library template
// rendering. Extracted out of api/ai-brain.js so the doctor-facing brain
// endpoint, the admin Testing Playground, AND the Prompt Library's own
// "test this prompt" action (api/ai-prompts.js) all call the exact same
// code instead of three copies of it.

import { cleanStr } from "./ai-store.js";
import { getModel, listEnabledModels, recordModelCallStats } from "./ai-models.js";
import { getConnector, recordConnectorHealth } from "./ai-connectors.js";
import { getDecryptedKey, listApiKeysForConnector } from "./ai-keys.js";
import { callWithRetry } from "./ai-providers.js";
import { cachedModel, cachedConnector } from "./ai-cache.js";
import { messageText } from "./ai-messages.js";

export async function cachedGetModel(id) {
  const { value } = await cachedModel(id, () => getModel(id));
  return value;
}

export async function cachedGetConnector(id) {
  const { value } = await cachedConnector(id, () => getConnector(id));
  return value;
}

export async function resolveKeyForModel(model) {
  const connector = await cachedGetConnector(model.connector_id);
  if (!connector || !connector.enabled) return null;
  const keys = await listApiKeysForConnector(connector.id);
  if (!keys.length) return null;
  const decrypted = await getDecryptedKey(keys[0].id);
  return decrypted ? { key: decrypted, name: keys[0].name, connector } : null;
}

// Builds the ordered candidate model chain: an explicit id list (router
// rule's primary+fallback, or a prompt's preferred/fallback/second_fallback)
// or, absent one, the enabled catalog sorted by priority - gated by the
// doctor's AI Plan allowed_model_ids (empty allow-list = no restriction),
// and - when the request carries images/files - filtered down to
// vision-capable models only.
export async function buildModelChain({ chainIds, plan, needsVision }) {
  let ids = chainIds;
  if (!ids || !ids.length) {
    const enabled = await listEnabledModels();
    ids = enabled.map((m) => m.id);
  }
  const models = (await Promise.all(ids.map((id) => cachedGetModel(id)))).filter((m) => m && m.enabled);
  const allowed = plan && Array.isArray(plan.allowed_model_ids) && plan.allowed_model_ids.length
    ? models.filter((m) => plan.allowed_model_ids.includes(m.id))
    : models;
  const capable = needsVision ? allowed.filter((m) => m.vision) : allowed;
  return capable;
}

// Provider Selection + Retry Policy + Fallback Model, in one walk: each
// candidate model's connector is resolved, the call is attempted with that
// model's own retry count, and on failure (including "no key configured")
// the next model in the chain is tried. Also updates the passive health/
// perf trackers (connector + model) on every attempt, success or failure.
export async function callModelChain(models, messages, overrides) {
  let lastError;
  let networkMs = 0;
  for (const model of models) {
    const resolved = await resolveKeyForModel(model);
    if (!resolved) { lastError = new Error(`Aucune clé API active pour le connecteur de ${model.name}`); continue; }
    const startedAt = Date.now();
    try {
      const result = await callWithRetry({
        connector: resolved.connector,
        apiKey: resolved.key,
        model: model.model_id,
        messages,
        maxTokens: overrides.maxTokens ?? model.max_tokens,
        temperature: overrides.temperature ?? model.temperature,
        topP: model.top_p,
        timeoutMs: model.timeout_ms,
        jsonMode: model.json_mode,
        // Forwarded to OpenRouter's "reasoning" param (openai_compatible
        // connectors only - see ai-providers.js). The model row already
        // carried reasoning_level; it was never actually sent anywhere,
        // so a "high"-effort reasoning model like GPT-5 spent its request
        // budget on hidden reasoning tokens with no way to bound that
        // share, and a short response could come back empty.
        reasoningEffort: model.reasoning_level,
      }, model.retry);
      networkMs = Date.now() - startedAt;
      await Promise.all([
        recordModelCallStats(model.id, { latencyMs: networkMs, success: true }),
        recordConnectorHealth(resolved.connector.id, { success: true, latencyMs: networkMs }),
      ]);
      return { ...result, model, connector: resolved.connector, keyName: resolved.name, usedFallback: model.id !== models[0].id, networkMs };
    } catch (e) {
      networkMs = Date.now() - startedAt;
      await Promise.all([
        recordModelCallStats(model.id, { latencyMs: networkMs, success: false }),
        recordConnectorHealth(resolved.connector.id, { success: false, latencyMs: networkMs, error: e.message }),
      ]);
      lastError = e;
    }
  }
  throw lastError || new Error("Aucun modèle disponible pour cette tâche");
}

// Guidelines Injection now lives in api/ai-knowledge-base.js
// (retrieveGuidelineExcerpts) - it scores and retrieves only the relevant
// sections of each linked guideline instead of dumping whole guideline
// text, and is used directly by api/ai-brain.js and api/ai-prompts.js.

export function renderTemplate(template, vars) {
  return String(template || "").replace(/\{\{(\w+)\}\}/g, (_, key) => cleanStr(vars[key] ?? "", 4000));
}

// Layers the Prompt Library on top of the raw conversation the client sent:
// injects one system message (system + developer prompt + guideline
// excerpts) and re-renders the last user turn through the prompt's
// user_template with Prompt Variables. Untouched (pure passthrough) when no
// prompt is configured yet, so behavior for not-yet-configured tasks
// matches a plain passthrough exactly.
export function applyPromptLibrary(messages, promptVersion, guidelineText, variables) {
  if (!promptVersion) return messages;
  const systemText = [promptVersion.system_prompt, promptVersion.developer_prompt, guidelineText ? `Guidelines:\n${guidelineText}` : ""]
    .filter(Boolean).join("\n\n");
  const withoutSystem = messages.filter((m) => m.role !== "system");
  const lastIndex = withoutSystem.length - 1;
  if (lastIndex >= 0 && promptVersion.user_template) {
    const last = withoutSystem[lastIndex];
    const lastText = messageText(last.content);
    const rendered = renderTemplate(promptVersion.user_template, { ...variables, message: lastText });
    if (typeof last.content === "string") {
      withoutSystem[lastIndex] = { ...last, content: rendered };
    } else if (Array.isArray(last.content)) {
      withoutSystem[lastIndex] = {
        ...last,
        content: last.content.map((part) => (part.type === "text" ? { ...part, text: rendered } : part)),
      };
    }
  }
  return systemText ? [{ role: "system", content: systemText }, ...withoutSystem] : withoutSystem;
}

// Structured JSON: when the model was asked for JSON (json_mode or the
// prompt declares an output_schema), attempt to parse the raw text so admin
// tooling and future desktop versions can rely on a parsed object -
// additive, never replaces the raw text response.
export function tryParseStructured(text, promptVersion, model) {
  if (!promptVersion?.output_schema && !model?.json_mode) return null;
  if (!text) return null;
  const trimmed = String(text).trim().replace(/^```json\s*/i, "").replace(/```$/, "");
  try { return JSON.parse(trimmed); } catch { return null; }
}
