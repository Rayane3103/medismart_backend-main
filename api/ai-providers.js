// Provider adapters for the AI Management brain. Dispatches by CONNECTOR
// TYPE (api/ai-connectors.js: openai_compatible, anthropic, gemini, local)
// rather than a fixed provider enum - a connector's base_url + type is
// enough to reach OpenRouter, OpenAI, Groq, Azure OpenAI, a self-hosted
// vLLM/Ollama box, or any other OpenAI-compatible endpoint, so "unlimited
// providers" is a config operation (add a connector), not a code change.
//
// Messages shape in: [{ role: "system"|"user"|"assistant", content: string |
// [{type:"text",text} | {type:"image_url", image_url:{url:"data:..."}}] }]
// Returns: { text, tokens_in, tokens_out }
// Streaming variants (callXStream) additionally yield text deltas via an
// async generator, for the opt-in SSE path (see api/ai-brain.js).

function dataUrlInfo(url) {
  const match = /^data:([^;,]+);base64,([\s\S]+)$/i.exec(String(url || ""));
  if (!match) return null;
  return { mimeType: match[1].trim().toLowerCase(), data: match[2].replace(/\s/g, "") };
}

async function withTimeout(promiseFactory, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs || 60000);
  try {
    return await promiseFactory(controller.signal);
  } finally {
    clearTimeout(timer);
  }
}

async function readUpstreamJson(upstream) {
  const text = await upstream.text();
  try { return JSON.parse(text); } catch { return { text }; }
}

// ---------- OpenAI-compatible (OpenRouter, OpenAI, Groq, Azure, local/self-hosted) ----------
function openAiCompatibleRequest(connector, model, apiKey) {
  const isAzure = /azure/i.test(connector.name) && connector.azure_api_version;
  if (isAzure) {
    const base = String(connector.base_url || "").replace(/\/+$/, "");
    return {
      url: `${base}/openai/deployments/${encodeURIComponent(model)}/chat/completions?api-version=${connector.azure_api_version}`,
      headers: { "api-key": apiKey, "Content-Type": "application/json" },
    };
  }
  const base = String(connector.base_url || "").replace(/\/+$/, "");
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
  if (/openrouter/i.test(connector.name)) {
    headers["HTTP-Referer"] = "https://medismart.app";
    headers["X-Title"] = "MediSmart AI Management";
  }
  return { url: `${base}/chat/completions`, headers };
}

// OpenAI's Structured Outputs (and every OpenAI-compatible passthrough,
// including OpenRouter -> OpenAI/Azure) HARD REQUIRE the literal word "json"
// to appear somewhere in the input when response_format is json_object -
// otherwise it's a 400, not a fallback-worthy provider error. A Prompt
// Library entry can define a structured output_schema without ever using
// that exact word, and plain chat (no prompt attached) never will - so
// forcing json_mode from the model's own flag alone breaks those calls
// outright. Guarantee the word is present instead of hoping every prompt
// author remembers it.
function messagesContainWordJson(messages) {
  return messages.some((m) => {
    const content = m.content;
    if (typeof content === "string") return /json/i.test(content);
    if (Array.isArray(content)) return content.some((p) => typeof p?.text === "string" && /json/i.test(p.text));
    return false;
  });
}

async function callOpenAiCompatible({ connector, apiKey, model, messages, maxTokens, temperature, topP, timeoutMs, jsonMode }) {
  const { url, headers } = openAiCompatibleRequest(connector, model, apiKey);
  let effectiveMessages = messages;
  if (jsonMode && !messagesContainWordJson(messages)) {
    effectiveMessages = [...messages, { role: "system", content: "Respond only with valid JSON." }];
  }
  const body = { model, messages: effectiveMessages, max_tokens: maxTokens, temperature, top_p: topP };
  if (jsonMode) body.response_format = { type: "json_object" };
  const upstream = await withTimeout(
    (signal) => fetch(url, { method: "POST", headers, body: JSON.stringify(body), signal }),
    timeoutMs,
  );
  const raw = await readUpstreamJson(upstream);
  if (!upstream.ok) {
    throw new Error(raw?.error?.message || raw?.message || raw?.text || `HTTP ${upstream.status}`);
  }
  return {
    text: raw?.choices?.[0]?.message?.content || "",
    tokens_in: raw?.usage?.prompt_tokens || 0,
    tokens_out: raw?.usage?.completion_tokens || 0,
  };
}

// SSE token stream for OpenAI-compatible endpoints (OpenRouter/OpenAI/Groq/
// Azure/local). Yields plain text deltas as they arrive.
async function* streamOpenAiCompatible({ connector, apiKey, model, messages, maxTokens, temperature, topP, timeoutMs }) {
  const { url, headers } = openAiCompatibleRequest(connector, model, apiKey);
  const body = { model, messages, max_tokens: maxTokens, temperature, top_p: topP, stream: true };
  const upstream = await withTimeout(
    (signal) => fetch(url, { method: "POST", headers, body: JSON.stringify(body), signal }),
    timeoutMs,
  );
  if (!upstream.ok || !upstream.body) {
    const raw = await readUpstreamJson(upstream);
    throw new Error(raw?.error?.message || raw?.message || `HTTP ${upstream.status}`);
  }
  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx;
    while ((idx = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 1);
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (payload === "[DONE]") return;
      try {
        const json = JSON.parse(payload);
        const delta = json?.choices?.[0]?.delta?.content;
        if (delta) yield delta;
      } catch { /* skip malformed SSE chunk */ }
    }
  }
}

// ---------- Anthropic (distinct Messages API shape) ----------
function toAnthropicMessages(messages) {
  let system = "";
  const out = [];
  for (const m of messages) {
    if (m.role === "system") {
      system += (typeof m.content === "string" ? m.content : "") + "\n";
      continue;
    }
    const content = Array.isArray(m.content) ? m.content.map((part) => {
      if (part.type === "text") return { type: "text", text: part.text };
      if (part.type === "image_url") {
        const info = dataUrlInfo(part.image_url?.url);
        if (!info) return { type: "text", text: "[image jointe non inline]" };
        return { type: "image", source: { type: "base64", media_type: info.mimeType, data: info.data } };
      }
      return { type: "text", text: "" };
    }) : [{ type: "text", text: String(m.content || "") }];
    out.push({ role: m.role === "assistant" ? "assistant" : "user", content });
  }
  return { system: system.trim(), messages: out };
}

async function callAnthropic({ connector, apiKey, model, messages, maxTokens, temperature, timeoutMs }) {
  const { system, messages: anthMessages } = toAnthropicMessages(messages);
  const base = String(connector.base_url || "https://api.anthropic.com/v1").replace(/\/+$/, "");
  const upstream = await withTimeout(
    (signal) => fetch(`${base}/messages`, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        system: system || undefined,
        messages: anthMessages,
        max_tokens: maxTokens,
        temperature,
      }),
      signal,
    }),
    timeoutMs,
  );
  const raw = await readUpstreamJson(upstream);
  if (!upstream.ok) {
    throw new Error(raw?.error?.message || raw?.message || raw?.text || `HTTP ${upstream.status}`);
  }
  const text = (raw?.content || []).filter((p) => p.type === "text").map((p) => p.text).join("");
  return {
    text,
    tokens_in: raw?.usage?.input_tokens || 0,
    tokens_out: raw?.usage?.output_tokens || 0,
  };
}

// ---------- Gemini ----------
function geminiPartsFor(content) {
  if (typeof content === "string") return content.trim() ? [{ text: content }] : [];
  if (!Array.isArray(content)) return [];
  const parts = [];
  for (const part of content) {
    if (part.type === "text" && part.text) parts.push({ text: part.text });
    if (part.type === "image_url") {
      const info = dataUrlInfo(part.image_url?.url);
      if (info) parts.push({ inline_data: { mime_type: info.mimeType, data: info.data } });
    }
  }
  return parts;
}

async function callGemini({ connector, apiKey, model, messages, maxTokens, temperature, timeoutMs }) {
  const systemParts = [];
  const contents = [];
  for (const m of messages) {
    if (m.role === "system") { systemParts.push(...geminiPartsFor(m.content)); continue; }
    const parts = geminiPartsFor(m.content);
    if (parts.length) contents.push({ role: m.role === "assistant" ? "model" : "user", parts });
  }
  const body = { contents, generationConfig: { maxOutputTokens: maxTokens, temperature } };
  if (systemParts.length) body.systemInstruction = { parts: systemParts };

  const base = String(connector.base_url || "https://generativelanguage.googleapis.com/v1beta/models").replace(/\/+$/, "");
  const modelPath = String(model || "").replace(/^models\//, "");
  const upstream = await withTimeout(
    (signal) => fetch(`${base}/${encodeURIComponent(modelPath)}:generateContent`, {
      method: "POST",
      headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    }),
    timeoutMs,
  );
  const raw = await readUpstreamJson(upstream);
  if (!upstream.ok) {
    throw new Error(raw?.error?.message || raw?.message || raw?.text || `HTTP ${upstream.status}`);
  }
  const text = (raw?.candidates?.[0]?.content?.parts || []).map((p) => p.text || "").join("").trim();
  const usage = raw?.usageMetadata || {};
  return { text, tokens_in: usage.promptTokenCount || 0, tokens_out: usage.candidatesTokenCount || 0 };
}

// ---------- unified dispatch ----------
export async function callAiProviderChat({ connector, apiKey, model, messages, maxTokens, temperature, topP, timeoutMs, jsonMode }) {
  const opts = { connector, model, messages, maxTokens, temperature, topP, timeoutMs, jsonMode };
  switch (connector.type) {
    case "anthropic": return callAnthropic({ apiKey, ...opts });
    case "gemini": return callGemini({ apiKey, ...opts });
    case "openai_compatible":
    case "local":
    default: return callOpenAiCompatible({ apiKey, ...opts });
  }
}

// Streaming is only implemented for OpenAI-compatible connectors today
// (OpenRouter/OpenAI/Groq/Azure/local self-hosted) - Anthropic/Gemini use a
// different SSE event shape and fall back to non-streaming (see
// api/ai-brain.js, which buffers their full response and emits it as one
// chunk so the SSE contract to the desktop stays uniform either way).
export function supportsStreaming(connector) {
  return connector.type === "openai_compatible" || connector.type === "local";
}

export function streamAiProviderChat(params) {
  return streamOpenAiCompatible(params);
}

// Retries with a fixed backoff, honoring the model's configured retry count.
export async function callWithRetry(params, retryCount) {
  let lastError;
  for (let attempt = 0; attempt <= retryCount; attempt++) {
    try {
      return await callAiProviderChat(params);
    } catch (e) {
      lastError = e;
      if (attempt < retryCount) await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
    }
  }
  throw lastError;
}
