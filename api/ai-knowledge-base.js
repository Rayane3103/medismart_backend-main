// Medical Knowledge Base: structured, versioned guideline metadata used by
// the Prompt Library / AI Brain for Guidelines Injection. This module
// stores NO copyrighted guideline text - only original, paraphrased
// summaries and short structured excerpts (recommendation/criteria/risk-
// score/algorithm/contraindication/red-flag/reference) written for AI
// retrieval, each carrying its own evidence level and recommendation
// class, plus a `source_url` pointing to the real publisher for the
// physician to consult the full original document.
//
// Storage: ai:guideline:{id} + ai:guidelines:index (same JSON-blob +
// SET-index pattern as every other AI Management catalog entity).
//
// Retrieval principle (the actual point of this module): the AI Brain
// never injects a whole guideline. retrieveGuidelineExcerpts() scores each
// guideline's SECTIONS against the clinical task's keywords and returns
// only the top few matching excerpts, each individually attributed
// ([ORG vN, Class C, Evidence E]).

import { makeStore, makeCrudRoutes, cleanStr, uuid, nowIso } from "./ai-store.js";
import { auditLogger } from "./ai-audit.js";
import { cachedGuideline } from "./ai-cache.js";
import { redis } from "./redis.js";

export const GUIDELINE_ORGS = [
  "ESC", "AHA", "ACC", "WHO", "ADA", "KDIGO", "GOLD", "ATS", "ERS", "NICE",
  "EULAR", "ESMO", "IDSA", "Surviving Sepsis Campaign", "CDC",
];

const STATUSES = ["draft", "published", "deprecated"];
const SECTION_TYPES = [
  "key_recommendation", "diagnostic_criteria", "risk_score",
  "treatment_algorithm", "contraindication", "red_flag", "reference",
];
const EVIDENCE_LEVELS = ["A", "B", "C", "D", "I", "IIa", "IIb", "III", ""];
const RECOMMENDATION_CLASSES = ["I", "IIa", "IIb", "III", "Strong", "Conditional", ""];
const LANGS = ["fr", "en", "ar"];

function ensureMultilingual(value) {
  const out = { fr: "", en: "", ar: "" };
  if (value && typeof value === "object") {
    for (const l of LANGS) out[l] = cleanStr(value[l], 4000);
  } else if (typeof value === "string") {
    out.fr = cleanStr(value, 4000); // legacy single-string summaries land in fr
  }
  return out;
}

function ensureSection(raw) {
  return {
    id: raw.id || uuid(),
    type: SECTION_TYPES.includes(raw.type) ? raw.type : "key_recommendation",
    title: cleanStr(raw.title, 200),
    keywords: Array.isArray(raw.keywords) ? raw.keywords.map((k) => cleanStr(k, 50)).filter(Boolean).slice(0, 20) : [],
    content: ensureMultilingual(raw.content),
    evidence_level: EVIDENCE_LEVELS.includes(raw.evidence_level) ? raw.evidence_level : "",
    recommendation_class: RECOMMENDATION_CLASSES.includes(raw.recommendation_class) ? raw.recommendation_class : "",
  };
}

function ensureGuidelineDefaults(row) {
  row.org = GUIDELINE_ORGS.includes(row.org) ? row.org : (row.org || GUIDELINE_ORGS[0]);
  row.title = cleanStr(row.title, 200) || `${row.org} guideline`;
  row.disease = cleanStr(row.disease, 150);
  row.specialty_id = cleanStr(row.specialty_id, 100);
  row.version = Number.isFinite(+row.version) ? Math.max(1, Math.round(+row.version)) : 1;
  row.publication_year = Number.isFinite(+row.publication_year) ? Math.round(+row.publication_year) : null;
  row.status = STATUSES.includes(row.status) ? row.status : "draft";
  row.supersedes = cleanStr(row.supersedes, 100);
  row.superseded_by = cleanStr(row.superseded_by, 100);
  row.source_url = cleanStr(row.source_url, 500);
  row.summary = ensureMultilingual(row.summary);
  row.default_evidence_level = EVIDENCE_LEVELS.includes(row.default_evidence_level) ? row.default_evidence_level : "";
  row.default_recommendation_class = RECOMMENDATION_CLASSES.includes(row.default_recommendation_class) ? row.default_recommendation_class : "";
  row.sections = Array.isArray(row.sections) ? row.sections.map(ensureSection).slice(0, 100) : [];
  // Legacy field from before the Knowledge Base existed: a single
  // undifferentiated text blob. Never deleted (an admin may still have one
  // linked into a live prompt), but retrieval treats it as one implicit
  // "key_recommendation" section with no keywords (see toRetrievableSections).
  row.text_excerpt = cleanStr(row.text_excerpt, 8000);
  row.created_by = cleanStr(row.created_by, 100);
  row.updated_by = cleanStr(row.updated_by, 100);
  if (typeof row.active !== "boolean") row.active = row.status !== "deprecated";
  return row;
}

const guidelineStore = makeStore({
  keyPrefix: "ai:guideline",
  indexKey: "ai:guidelines:index",
  cacheKey: "ai_guidelines",
  ensureDefaults: ensureGuidelineDefaults,
  sortFn: (a, b) => (a.org || "").localeCompare(b.org || "") || (a.disease || "").localeCompare(b.disease || ""),
});

export async function seedKnowledgeBaseDefaults() {
  // seedIfEmpty for a brand-new deployment; seedMissingByName tops up an
  // already-populated one (e.g. a deployment that only had the original 12
  // orgs before ESMO/Surviving Sepsis Campaign/CDC were added) without
  // touching any guideline an admin has since edited.
  const placeholderRows = GUIDELINE_ORGS.map((org) => ({
    org, title: `${org} guideline`, disease: "", version: 1, status: "draft",
    summary: { fr: "", en: "", ar: "" }, sections: [], active: true,
  }));
  await guidelineStore.seedIfEmpty(placeholderRows);
  await guidelineStore.seedMissingByName(placeholderRows, "org");
}

export async function getGuideline(id) { return guidelineStore.get(id); }
export async function listGuidelines() { return guidelineStore.list(); }
export async function listPublishedGuidelines() {
  const rows = await guidelineStore.list();
  return rows.filter((g) => g.status === "published");
}

// ---------------------------------------------------------------------
// Retrieval: the actual "never inject an entire guideline" mechanism.
// Scores each candidate guideline's sections against the given keywords
// (clinical task name, disease, chief complaint, etc.) and returns only
// the top-N matching excerpts across ALL linked guidelines combined - not
// every section of every guideline.
// ---------------------------------------------------------------------

function toRetrievableSections(guideline) {
  if (guideline.sections.length) return guideline.sections;
  if (guideline.text_excerpt) {
    // Legacy fallback: pre-Knowledge-Base guidelines had one flat
    // text_excerpt field. Treated as a single low-specificity section so
    // they still surface (keyword match falls back to "always include a
    // little", scored lowest) rather than silently disappearing.
    return [{
      id: "legacy", type: "key_recommendation", title: guideline.title,
      keywords: [], content: { fr: guideline.text_excerpt, en: "", ar: "" },
      evidence_level: guideline.default_evidence_level, recommendation_class: guideline.default_recommendation_class,
    }];
  }
  return [];
}

function scoreSection(section, keywordSet) {
  const haystack = [section.title, ...section.keywords].join(" ").toLowerCase();
  let score = 0;
  for (const kw of keywordSet) {
    if (!kw) continue;
    if (haystack.includes(kw)) score += 2;
  }
  if (!section.keywords.length && !score) score = 0.1; // legacy fallback: always eligible, but ranked last
  return score;
}

function formatExcerpt(guideline, section, language) {
  const text = section.content[language] || section.content.fr || section.content.en || section.content.ar || "";
  if (!text) return "";
  const tag = [guideline.org, `v${guideline.version}`, section.recommendation_class && `Class ${section.recommendation_class}`, section.evidence_level && `Evidence ${section.evidence_level}`]
    .filter(Boolean).join(", ");
  return `[${tag}] ${section.title ? section.title + ": " : ""}${text}`;
}

// guidelineIds: ids linked from a prompt (guideline_ids) and/or a router
// rule (guideline_ids) - merged by the caller before this is invoked.
// keywords: free-text terms describing the current request (clinical task
// name, disease, chief complaint) - lower-cased by this function.
export async function retrieveGuidelineExcerpts(guidelineIds, { keywords = [], language = "fr", maxExcerpts = 3, requirePublished = true } = {}) {
  const keywordSet = keywords.filter(Boolean).map((k) => String(k).toLowerCase());
  const candidates = [];
  let anyCacheHit = false;

  for (const gid of (guidelineIds || []).slice(0, 10)) {
    // Only the published-required path is cached, same reasoning as prompt
    // gating: caching an unpublished-allowed lookup could otherwise leak a
    // draft guideline into real traffic on the next request.
    let guideline;
    if (requirePublished) {
      const cached = await cachedGuideline(gid, () => getGuideline(gid));
      guideline = cached.value;
      anyCacheHit = anyCacheHit || cached.cacheHit;
    } else {
      guideline = await getGuideline(gid);
    }
    if (!guideline || (requirePublished && guideline.status !== "published")) continue; // never inject draft/deprecated guidelines into real traffic
    for (const section of toRetrievableSections(guideline)) {
      const score = scoreSection(section, keywordSet);
      if (score > 0) candidates.push({ guideline, section, score });
    }
  }

  candidates.sort((a, b) => b.score - a.score);
  const top = candidates.slice(0, maxExcerpts);
  const text = top.map((c) => formatExcerpt(c.guideline, c.section, language)).filter(Boolean).join("\n\n");
  const used = top.map((c) => ({ guideline_id: c.guideline.id, org: c.guideline.org, version: c.guideline.version, section_id: c.section.id, section_type: c.section.type }));
  return { text, used, cacheHit: anyCacheHit };
}

// ---------------------------------------------------------------------
// Versioning: a "new version" clones the current guideline into a fresh
// record (new id, version+1, status back to draft), marks the OLD one
// deprecated + superseded_by the new id, and links supersedes on the new
// one - immutable history, exactly like Prompt Library versioning.
// ---------------------------------------------------------------------

async function createNewVersion(sourceId, author) {
  const source = await guidelineStore.get(sourceId);
  if (!source) return null;
  const next = ensureGuidelineDefaults({
    ...source,
    id: uuid(),
    version: source.version + 1,
    status: "draft",
    supersedes: source.id,
    superseded_by: "",
    created_by: author,
    updated_by: author,
    created_at: nowIso(),
  });
  await guidelineStore.save(next);
  await redis.sadd("ai:guidelines:index", next.id);

  source.status = "deprecated";
  source.superseded_by = next.id;
  source.updated_by = author;
  await guidelineStore.save(source);

  return next;
}

const handleGuidelineRoutes = makeCrudRoutes({
  basePath: "/api/admin/ai/guidelines",
  store: guidelineStore,
  auditLog: auditLogger("guideline"),
});

export async function handleAiKnowledgeBaseAdminRoutes(req, res, path, ctx) {
  await seedKnowledgeBaseDefaults();
  const { readJson, ok, err, session } = ctx;
  const author = session?.username || "admin";
  const audit = auditLogger("guideline");

  if (path === "/api/admin/ai/guideline-orgs" && req.method === "GET") {
    ok(res, { orgs: GUIDELINE_ORGS, section_types: SECTION_TYPES, evidence_levels: EVIDENCE_LEVELS, recommendation_classes: RECOMMENDATION_CLASSES });
    return true;
  }

  // New version (Support versioning / Support updates).
  const versionMatch = path.match(/^\/api\/admin\/ai\/guidelines\/([a-f0-9-]+)\/new-version$/);
  if (versionMatch && req.method === "POST") {
    const created = await createNewVersion(versionMatch[1], author);
    if (!created) { err(res, 404, "Guideline introuvable"); return true; }
    await audit(session, "new_version", created.id, { supersedes: versionMatch[1], version: created.version });
    ok(res, { row: created }, 201);
    return true;
  }

  // Deprecate (Support deprecation) - no replacement implied, just retired.
  const deprecateMatch = path.match(/^\/api\/admin\/ai\/guidelines\/([a-f0-9-]+)\/deprecate$/);
  if (deprecateMatch && req.method === "POST") {
    const guideline = await guidelineStore.get(deprecateMatch[1]);
    if (!guideline) { err(res, 404, "Guideline introuvable"); return true; }
    guideline.status = "deprecated";
    guideline.updated_by = author;
    await guidelineStore.save(guideline);
    await audit(session, "deprecate", guideline.id, {});
    ok(res, { row: guideline });
    return true;
  }

  // Publish (mirrors Prompt Library: draft -> published is explicit,
  // admin-only, and is what actually makes a guideline eligible for
  // real-traffic retrieval - see retrieveGuidelineExcerpts's status check).
  const publishMatch = path.match(/^\/api\/admin\/ai\/guidelines\/([a-f0-9-]+)\/publish$/);
  if (publishMatch && req.method === "POST") {
    const guideline = await guidelineStore.get(publishMatch[1]);
    if (!guideline) { err(res, 404, "Guideline introuvable"); return true; }
    guideline.status = "published";
    guideline.updated_by = author;
    await guidelineStore.save(guideline);
    await audit(session, "publish", guideline.id, {});
    ok(res, { row: guideline });
    return true;
  }

  // Section management: add/update/remove one structured excerpt at a time
  // (title/keywords/content per language/evidence level/recommendation
  // class), rather than requiring the admin to hand-edit the whole array.
  const sectionsMatch = path.match(/^\/api\/admin\/ai\/guidelines\/([a-f0-9-]+)\/sections$/);
  if (sectionsMatch && req.method === "POST") {
    const guideline = await guidelineStore.get(sectionsMatch[1]);
    if (!guideline) { err(res, 404, "Guideline introuvable"); return true; }
    const body = await readJson(req);
    const section = ensureSection(body);
    guideline.sections.push(section);
    guideline.updated_by = author;
    await guidelineStore.save(guideline);
    await audit(session, "add_section", guideline.id, { section_id: section.id, type: section.type });
    ok(res, { row: guideline }, 201);
    return true;
  }

  const sectionItemMatch = path.match(/^\/api\/admin\/ai\/guidelines\/([a-f0-9-]+)\/sections\/([a-zA-Z0-9-]+)$/);
  if (sectionItemMatch && (req.method === "PATCH" || req.method === "PUT")) {
    const guideline = await guidelineStore.get(sectionItemMatch[1]);
    if (!guideline) { err(res, 404, "Guideline introuvable"); return true; }
    const idx = guideline.sections.findIndex((s) => s.id === sectionItemMatch[2]);
    if (idx === -1) { err(res, 404, "Section introuvable"); return true; }
    const body = await readJson(req);
    guideline.sections[idx] = ensureSection({ ...guideline.sections[idx], ...body, id: sectionItemMatch[2] });
    guideline.updated_by = author;
    await guidelineStore.save(guideline);
    await audit(session, "update_section", guideline.id, { section_id: sectionItemMatch[2] });
    ok(res, { row: guideline });
    return true;
  }

  if (sectionItemMatch && req.method === "DELETE") {
    const guideline = await guidelineStore.get(sectionItemMatch[1]);
    if (!guideline) { err(res, 404, "Guideline introuvable"); return true; }
    guideline.sections = guideline.sections.filter((s) => s.id !== sectionItemMatch[2]);
    guideline.updated_by = author;
    await guidelineStore.save(guideline);
    await audit(session, "remove_section", guideline.id, { section_id: sectionItemMatch[2] });
    ok(res, { row: guideline });
    return true;
  }

  return handleGuidelineRoutes(req, res, path, ctx);
}
