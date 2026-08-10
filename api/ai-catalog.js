// Medical specialties (= Prompt Library categories) and clinical tasks.
// Guideline storage moved to api/ai-knowledge-base.js (the Medical
// Knowledge Base) - a distinct concern with its own versioning/
// deprecation/multilingual-excerpt-retrieval model.
//
// Storage:
//   ai:specialty:{id}  + ai:specialties:index
//   ai:task:{id}       + ai:tasks:index

import { makeStore, makeCrudRoutes, cleanStr } from "./ai-store.js";
import { auditLogger } from "./ai-audit.js";

// Every speciality the doctor-facing apps can run as must appear here, or
// its traffic silently falls back to another speciality's clinical task
// (see findTaskForRequest). The web app maps its own French speciality ids
// to these names before sending them (BRAIN_SPECIALTY_BY_ID in
// medismart-web-full/frontend/src/cloudAi.js).
const SPECIALTY_NAMES = [
  "General Medicine", "Cardiology", "Radiology", "Laboratory", "Pneumology",
  "Pediatrics", "Rheumatology", "Neurology", "Gastroenterology", "Dermatology",
  "Ophthalmology", "Gynecology", "Obstetrics", "Endocrinology", "Nephrology",
  "Urology", "Orthopedics", "ENT", "Emergency Medicine", "Internal Medicine",
  "Dentistry",
];

// Every clinical task is mapped to one of the action_type values the desktop
// app already sends (chat, lab_analysis, pdf_analysis, ecg_analysis,
// image_analysis, multimodal_analysis, irm_analysis - see DEFAULT_COSTS in
// api/doctor-usage.js and README.md). This is what lets the Model Router
// apply to REAL desktop traffic without any desktop-side change: the brain
// endpoint resolves action_type -> task -> router rule (see
// findTaskByActionType below and api/ai-brain.js). Admin can repoint any
// task's action_type from the Clinical Tasks admin view.
export const KNOWN_ACTION_TYPES = ["chat", "lab_analysis", "pdf_analysis", "ecg_analysis", "image_analysis", "multimodal_analysis", "irm_analysis"];

// name -> which specialty it belongs to (resolved to an id at seed time,
// see seedCatalogDefaults). Task taxonomy only - no clinical/medical content,
// per instruction; the actual prompts are added later via the Prompt
// Library.
const TASK_DEFS = [
  // Cardiology
  { name: "ECG Interpretation", action_type: "ecg_analysis", specialty: "Cardiology" },
  { name: "Echocardiography", action_type: "image_analysis", specialty: "Cardiology" },
  { name: "Holter ECG", action_type: "ecg_analysis", specialty: "Cardiology" },
  { name: "Stress Test", action_type: "ecg_analysis", specialty: "Cardiology" },
  { name: "Chest Pain", action_type: "chat", specialty: "Cardiology" },
  { name: "Heart Failure", action_type: "chat", specialty: "Cardiology" },
  { name: "Hypertension", action_type: "chat", specialty: "Cardiology" },
  { name: "Arrhythmia", action_type: "ecg_analysis", specialty: "Cardiology" },
  { name: "Acute Coronary Syndrome", action_type: "chat", specialty: "Cardiology" },
  // Radiology
  { name: "Chest X-Ray", action_type: "image_analysis", specialty: "Radiology" },
  { name: "CT Scan", action_type: "image_analysis", specialty: "Radiology" },
  { name: "MRI", action_type: "irm_analysis", specialty: "Radiology" },
  { name: "Ultrasound", action_type: "image_analysis", specialty: "Radiology" },
  { name: "Mammography", action_type: "image_analysis", specialty: "Radiology" },
  { name: "Fracture Detection", action_type: "image_analysis", specialty: "Radiology" },
  // Laboratory
  { name: "CBC", action_type: "lab_analysis", specialty: "Laboratory" },
  { name: "CRP", action_type: "lab_analysis", specialty: "Laboratory" },
  { name: "ESR", action_type: "lab_analysis", specialty: "Laboratory" },
  { name: "Liver Function", action_type: "lab_analysis", specialty: "Laboratory" },
  { name: "Kidney Function", action_type: "lab_analysis", specialty: "Laboratory" },
  { name: "Electrolytes", action_type: "lab_analysis", specialty: "Laboratory" },
  { name: "Lipid Profile", action_type: "lab_analysis", specialty: "Laboratory" },
  { name: "HbA1c", action_type: "lab_analysis", specialty: "Laboratory" },
  { name: "Troponin", action_type: "lab_analysis", specialty: "Laboratory" },
  { name: "D-Dimer", action_type: "lab_analysis", specialty: "Laboratory" },
  { name: "Coagulation", action_type: "lab_analysis", specialty: "Laboratory" },
  { name: "Thyroid", action_type: "lab_analysis", specialty: "Laboratory" },
  // Pediatrics
  { name: "Growth Assessment", action_type: "chat", specialty: "Pediatrics" },
  { name: "Vaccination", action_type: "chat", specialty: "Pediatrics" },
  { name: "Development", action_type: "chat", specialty: "Pediatrics" },
  { name: "Nutrition", action_type: "chat", specialty: "Pediatrics" },
  { name: "Fever", action_type: "chat", specialty: "Pediatrics" },
  { name: "Bronchiolitis", action_type: "chat", specialty: "Pediatrics" },
  // Pneumology
  { name: "Spirometry", action_type: "chat", specialty: "Pneumology" },
  { name: "COPD", action_type: "chat", specialty: "Pneumology" },
  { name: "Asthma", action_type: "chat", specialty: "Pneumology" },
  { name: "Pneumonia", action_type: "image_analysis", specialty: "Pneumology" },
  { name: "Pulmonary Embolism", action_type: "chat", specialty: "Pneumology" },
  // Rheumatology
  { name: "Rheumatoid Arthritis", action_type: "chat", specialty: "Rheumatology" },
  { name: "Lupus", action_type: "chat", specialty: "Rheumatology" },
  { name: "Gout", action_type: "chat", specialty: "Rheumatology" },
  { name: "Osteoporosis", action_type: "chat", specialty: "Rheumatology" },
  // Neurology
  { name: "Stroke", action_type: "chat", specialty: "Neurology" },
  { name: "Epilepsy", action_type: "chat", specialty: "Neurology" },
  { name: "Headache", action_type: "chat", specialty: "Neurology" },
  { name: "Peripheral Neuropathy", action_type: "chat", specialty: "Neurology" },
  { name: "Brain MRI", action_type: "irm_analysis", specialty: "Neurology" },
  { name: "Brain CT", action_type: "image_analysis", specialty: "Neurology" },
  // Gastroenterology
  { name: "Abdominal Pain", action_type: "chat", specialty: "Gastroenterology" },
  { name: "GERD", action_type: "chat", specialty: "Gastroenterology" },
  { name: "Inflammatory Bowel Disease", action_type: "chat", specialty: "Gastroenterology" },
  { name: "Liver Disease", action_type: "chat", specialty: "Gastroenterology" },
  { name: "Abdominal CT", action_type: "image_analysis", specialty: "Gastroenterology" },
  // Dermatology
  { name: "Skin Lesion", action_type: "image_analysis", specialty: "Dermatology" },
  { name: "Rash", action_type: "image_analysis", specialty: "Dermatology" },
  { name: "Psoriasis", action_type: "image_analysis", specialty: "Dermatology" },
  { name: "Dermatology Consultation", action_type: "chat", specialty: "Dermatology" },
  { name: "Dermoscopy", action_type: "image_analysis", specialty: "Dermatology" },
  // Ophthalmology
  { name: "Visual Acuity", action_type: "chat", specialty: "Ophthalmology" },
  { name: "Retinal Imaging", action_type: "image_analysis", specialty: "Ophthalmology" },
  { name: "Glaucoma", action_type: "chat", specialty: "Ophthalmology" },
  // Gynecology
  { name: "Pelvic Ultrasound", action_type: "image_analysis", specialty: "Gynecology" },
  { name: "Menstrual Disorders", action_type: "chat", specialty: "Gynecology" },
  { name: "Cervical Screening", action_type: "chat", specialty: "Gynecology" },
  // Obstetrics
  { name: "Prenatal Care", action_type: "chat", specialty: "Obstetrics" },
  { name: "Obstetric Ultrasound", action_type: "image_analysis", specialty: "Obstetrics" },
  { name: "Labor Assessment", action_type: "chat", specialty: "Obstetrics" },
  // Endocrinology
  { name: "Diabetes Management", action_type: "chat", specialty: "Endocrinology" },
  { name: "Thyroid Disorders", action_type: "chat", specialty: "Endocrinology" },
  { name: "Adrenal Disorders", action_type: "chat", specialty: "Endocrinology" },
  // Nephrology
  { name: "Chronic Kidney Disease", action_type: "chat", specialty: "Nephrology" },
  { name: "Acute Kidney Injury", action_type: "chat", specialty: "Nephrology" },
  { name: "Dialysis Assessment", action_type: "chat", specialty: "Nephrology" },
  // Urology
  { name: "Urinary Tract Infection", action_type: "chat", specialty: "Urology" },
  { name: "Kidney Stones", action_type: "chat", specialty: "Urology" },
  { name: "Prostate Assessment", action_type: "chat", specialty: "Urology" },
  // Orthopedics
  { name: "Fracture Assessment", action_type: "image_analysis", specialty: "Orthopedics" },
  { name: "Joint Pain", action_type: "chat", specialty: "Orthopedics" },
  { name: "Back Pain", action_type: "chat", specialty: "Orthopedics" },
  // ENT
  { name: "Sore Throat", action_type: "chat", specialty: "ENT" },
  { name: "Hearing Loss", action_type: "chat", specialty: "ENT" },
  { name: "Sinusitis", action_type: "chat", specialty: "ENT" },
  // Emergency Medicine
  { name: "Triage Assessment", action_type: "chat", specialty: "Emergency Medicine" },
  { name: "Trauma Assessment", action_type: "multimodal_analysis", specialty: "Emergency Medicine" },
  { name: "Sepsis Screening", action_type: "chat", specialty: "Emergency Medicine" },
  // Internal Medicine
  { name: "Drug Interaction", action_type: "chat", specialty: "Internal Medicine" },
  { name: "Prescription Review", action_type: "chat", specialty: "Internal Medicine" },
  { name: "Differential Diagnosis", action_type: "chat", specialty: "Internal Medicine" },
  // Dentistry
  { name: "Dental Consultation", action_type: "chat", specialty: "Dentistry" },
  { name: "Dental Radiograph", action_type: "image_analysis", specialty: "Dentistry" },
  { name: "Periodontal Assessment", action_type: "chat", specialty: "Dentistry" },
  // General Medicine (generic / cross-specialty document tasks)
  { name: "Medical Report", action_type: "pdf_analysis", specialty: "General Medicine" },
  { name: "Referral Letter", action_type: "pdf_analysis", specialty: "General Medicine" },
  { name: "SOAP Note", action_type: "chat", specialty: "General Medicine" },
  { name: "Clinical Summary", action_type: "multimodal_analysis", specialty: "General Medicine" },
  { name: "General Image Review", action_type: "image_analysis", specialty: "General Medicine" },
  // Per-specialty coverage for the two action types every speciality module
  // in the doctor apps can emit (chat from its AI tab, image_analysis from
  // its imaging/photo panels). Without a task of that action_type owned by
  // the speciality, findTaskForRequest falls back to whichever speciality
  // happens to sort first -- e.g. every dermatology image landed on
  // Gastroenterology's "Abdominal CT" before this.
  { name: "Radiology Consultation", action_type: "chat", specialty: "Radiology" },
  { name: "Pediatric Imaging", action_type: "image_analysis", specialty: "Pediatrics" },
  { name: "Joint Ultrasound", action_type: "image_analysis", specialty: "Rheumatology" },
];

function ensureSpecialtyDefaults(row) {
  row.name = cleanStr(row.name, 100);
  row.description = cleanStr(row.description, 500);
  if (typeof row.active !== "boolean") row.active = true;
  return row;
}

function ensureTaskDefaults(row) {
  row.name = cleanStr(row.name, 100);
  row.description = cleanStr(row.description, 500);
  row.default_specialty_id = cleanStr(row.default_specialty_id, 100);
  row.action_type = KNOWN_ACTION_TYPES.includes(row.action_type) ? row.action_type : "chat";
  if (typeof row.active !== "boolean") row.active = true;
  return row;
}

const specialtyStore = makeStore({
  keyPrefix: "ai:specialty",
  indexKey: "ai:specialties:index",
  cacheKey: "ai_specialties",
  ensureDefaults: ensureSpecialtyDefaults,
  sortFn: (a, b) => a.name.localeCompare(b.name),
});

const taskStore = makeStore({
  keyPrefix: "ai:task",
  indexKey: "ai:tasks:index",
  cacheKey: "ai_tasks",
  ensureDefaults: ensureTaskDefaults,
  sortFn: (a, b) => a.name.localeCompare(b.name),
});

export async function seedCatalogDefaults() {
  // seedIfEmpty covers a brand-new deployment; seedMissingByName then tops
  // up an already-populated one with any new catalog entries added since -
  // existing rows (including anything an admin already edited) are never
  // touched either way.
  await specialtyStore.seedIfEmpty(SPECIALTY_NAMES.map((name) => ({ name, description: "", active: true })));
  await specialtyStore.seedMissingByName(SPECIALTY_NAMES.map((name) => ({ name, description: "", active: true })));

  const specialties = await specialtyStore.list();
  const specialtyIdByName = Object.fromEntries(specialties.map((s) => [s.name, s.id]));
  const taskRows = TASK_DEFS.map((t) => ({
    name: t.name,
    description: "",
    action_type: t.action_type,
    default_specialty_id: specialtyIdByName[t.specialty] || "",
    active: true,
  }));
  await taskStore.seedIfEmpty(taskRows);
  await taskStore.seedMissingByName(taskRows);
}

export async function getSpecialty(id) { return specialtyStore.get(id); }
export async function listSpecialties() { return specialtyStore.list(); }
export async function getTask(id) { return taskStore.get(id); }
export async function listTasks() { return taskStore.list(); }

// Resolves the desktop's action_type (the only clinical-task signal it sends
// today) to a configured clinical task, so the Model Router applies to real
// traffic without any desktop change. Picks the first active task whose
// action_type matches; admin can repoint this via the Clinical Tasks view.
export async function findTaskByActionType(actionType) {
  const tasks = await listTasks();
  return tasks.find((t) => t.active && t.action_type === actionType) || null;
}

// Speciality-aware task resolution. findTaskByActionType alone matches ONLY
// on action_type against a list sorted alphabetically by task name, so every
// caller sending the same action_type got the same clinical task -- and
// therefore the same Prompt Library entry, model chain and guidelines --
// regardless of which speciality the doctor was actually working in. In
// practice that meant every `chat` in the whole product resolved to
// "Abdominal Pain" (Gastroenterology) and every `image_analysis` to
// "Abdominal CT", because those sort first. A dermatologist's skin photo was
// being analysed under a gastroenterology CT task.
//
// Now: prefer a task owned by the caller's speciality, fall back to the old
// action_type-only behaviour when the caller sends no speciality (the desktop
// app today) or when that speciality owns no task of this action_type. The
// fallback is what keeps this backwards-compatible.
export async function findTaskForRequest(specialtyName, actionType) {
  const tasks = await listTasks();
  const wanted = cleanStr(specialtyName, 100).toLowerCase();
  if (wanted) {
    const specialties = await listSpecialties();
    const specialty = specialties.find((s) => s.name.toLowerCase() === wanted);
    if (specialty) {
      const owned = tasks.find(
        (t) => t.active && t.action_type === actionType && t.default_specialty_id === specialty.id,
      );
      if (owned) return owned;
    }
  }
  return tasks.find((t) => t.active && t.action_type === actionType) || null;
}

const handleSpecialtyRoutes = makeCrudRoutes({
  basePath: "/api/admin/ai/specialties",
  store: specialtyStore,
  auditLog: auditLogger("specialty"),
});

const handleTaskRoutes = makeCrudRoutes({
  basePath: "/api/admin/ai/tasks",
  store: taskStore,
  auditLog: auditLogger("task"),
});

export async function handleAiCatalogAdminRoutes(req, res, path, ctx) {
  await seedCatalogDefaults();
  if (await handleSpecialtyRoutes(req, res, path, ctx)) return true;
  if (await handleTaskRoutes(req, res, path, ctx)) return true;
  return false;
}
