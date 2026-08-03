// Shared chat-message normalization (multi-turn history, image_url / input_file
// attachment parts). Relocated verbatim from the old inline handler in
// api/index.js so both the legacy public paths (now routed through the AI
// brain, see api/ai-brain.js) and the Testing Playground use one
// implementation instead of two - this is the exact contract the desktop
// app already sends today (messages array with text/image_url/input_file
// parts), so moving it must not change its behavior.

export function normalizeRole(role) {
  const clean = String(role || "user").toLowerCase();
  if (clean === "system" || clean === "assistant" || clean === "user") return clean;
  if (clean === "model") return "assistant";
  return "user";
}

export function dataUrlInfo(url) {
  const match = /^data:([^;,]+);base64,([\s\S]+)$/i.exec(String(url || ""));
  if (!match) return null;
  return {
    mimeType: match[1].trim().toLowerCase(),
    data: match[2].replace(/\s/g, ""),
  };
}

function normalizeImageUrlPart(part) {
  const rawImage = part?.image_url || part?.imageUrl || part?.input_image || part?.image || {};
  const url = typeof rawImage === "string" ? rawImage : rawImage.url || rawImage.data_url || rawImage.dataUrl;
  if (!url) return null;
  return {
    type: "image_url",
    image_url: {
      url: String(url),
      detail: rawImage.detail || part.detail || "high",
    },
  };
}

function normalizeFilePart(part) {
  const rawFile = part?.file || part?.input_file || {};
  const url = rawFile.url || rawFile.data_url || rawFile.dataUrl || part.url;
  if (!url) return null;
  return {
    type: "input_file",
    file: {
      filename: rawFile.filename || part.filename || "document",
      url: String(url),
    },
  };
}

function normalizeContentPart(part) {
  if (typeof part === "string") {
    const text = part.trim();
    return text ? { type: "text", text } : null;
  }
  if (!part || typeof part !== "object") return null;
  const type = String(part.type || "").toLowerCase();
  if (type === "image_url" || type === "input_image" || part.image_url || part.imageUrl) {
    return normalizeImageUrlPart(part);
  }
  if (type === "input_file" || type === "file" || part.file || part.input_file) {
    return normalizeFilePart(part);
  }
  if (type === "text" || type === "input_text" || part.text || part.input_text) {
    const text = String(part.text || part.input_text || "").trim();
    return text ? { type: "text", text } : null;
  }
  const text = String(part.content || part.message || "").trim();
  return text ? { type: "text", text } : null;
}

export function normalizeMessageContent(content) {
  if (typeof content === "string") return content.trim();
  if (Array.isArray(content)) {
    const parts = content.map(normalizeContentPart).filter(Boolean);
    return parts.length ? parts : "";
  }
  if (content && typeof content === "object") {
    const part = normalizeContentPart(content);
    return part ? [part] : "";
  }
  return "";
}

export function messageText(content) {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content.map((part) => {
      if (typeof part === "string") return part;
      if (!part || typeof part !== "object") return "";
      if (part.type === "image_url") return "[image jointe]";
      if (part.type === "input_file" || part.type === "file") return `[fichier joint: ${part.file?.filename || "document"}]`;
      return part.text || part.input_text || "";
    }).filter(Boolean).join("\n");
  }
  if (content && typeof content === "object") {
    if (content.type === "image_url") return "[image jointe]";
    if (content.type === "input_file" || content.type === "file") return `[fichier joint: ${content.file?.filename || "document"}]`;
    return content.text || content.input_text || content.content || "";
  }
  return "";
}

export function hasMessageContent(content) {
  if (typeof content === "string") return Boolean(content.trim());
  if (!Array.isArray(content)) return false;
  return content.some((part) => {
    if (!part || typeof part !== "object") return false;
    if (part.type === "text") return Boolean(String(part.text || "").trim());
    if (part.type === "image_url") return Boolean(part.image_url?.url);
    if (part.type === "input_file") return Boolean(part.file?.url);
    return false;
  });
}

export function contentHasImage(content) {
  return Array.isArray(content) && content.some((part) => part?.type === "image_url" && part.image_url?.url);
}

export function messagesHaveImages(messages) {
  return messages.some((message) => contentHasImage(message.content));
}

export function contentHasFiles(content) {
  return Array.isArray(content) && content.some((part) => part?.type === "input_file" && part.file?.url);
}

export function messagesHaveFiles(messages) {
  return messages.some((message) => contentHasFiles(message.content));
}

// Accepts either a single `message` string (Testing Playground, simple
// clients) or a full `messages` array (desktop app conversation history with
// attachments) - same input contract the legacy endpoint accepted.
export function normalizeMessages(body) {
  const source = Array.isArray(body.messages) && body.messages.length
    ? body.messages
    : [{ role: "user", content: (body.message || "").toString() }];
  return source.map((m) => ({
    role: normalizeRole(m?.role),
    content: normalizeMessageContent(m?.content ?? ""),
  })).filter((m) => hasMessageContent(m.content));
}
