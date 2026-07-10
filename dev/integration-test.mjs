// End-to-end test of the licensing flow against a locally running admin server.
// Prereq: mock-upstash on 8790, server.js on 8791 with ADMIN_USERS=testadmin:testpass

const BASE = "http://127.0.0.1:8791";
const PUBLIC = { "Content-Type": "application/json" };

let passed = 0;
let failed = 0;
let ADMIN = { "Content-Type": "application/json" };

async function adminHeaders() {
  if (ADMIN["X-Admin-Token"]) return ADMIN;
  const login = await call("/api/admin/login", {
    method: "POST",
    body: { username: "testadmin", password: "testpass" },
  });
  if (!login.data.token) throw new Error("admin login failed");
  ADMIN = { "X-Admin-Token": login.data.token, "Content-Type": "application/json" };
  return ADMIN;
}

function check(name, condition, extra = "") {
  if (condition) { passed++; console.log(`  PASS  ${name}`); }
  else { failed++; console.log(`  FAIL  ${name} ${extra}`); }
}

async function call(path, { method = "GET", headers = PUBLIC, body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

await adminHeaders();

// 0. Login works
let r = await call("/api/admin/me", { headers: ADMIN });
check("admin session valid", r.status === 200 && r.data.user?.username === "testadmin");

const runId = Date.now().toString(36);
const registration = {
  client_registration_id: `test-client-reg-${runId}`,
  full_name: "Dr Amine Test",
  specialty: "Cardiologie",
  phone: "0550123456",
  email: "amine@test.dz",
  clinic_name: "Cabinet El Chifa",
  address: "12 Rue Didouche",
  wilaya: "Alger",
  device_fingerprint: "device-fp-AAA",
  app_version: "2.1.0",
  registered_at: "2026-07-09T10:00:00Z",
};

// 1. Health
r = await call("/api/health");
check("health", r.status === 200 && r.data.ok);

// 2. Registration sync (create)
r = await call("/api/registrations/sync", { method: "POST", body: registration });
check("sync creates registration", r.status === 201 && r.data.registration?.status === "pending_activation", JSON.stringify(r.data));

// 3. Idempotent re-sync
r = await call("/api/registrations/sync", { method: "POST", body: registration });
check("re-sync is idempotent", r.status === 200 && r.data.created === false);

// 4. Admin sees it
r = await call("/api/admin/registrations", { headers: ADMIN });
const regRow = (r.data.rows || []).find((row) => row.client_registration_id === registration.client_registration_id);
check("admin lists registration", Boolean(regRow));
const regId = regRow?.id;

// 5. Admin auth required
r = await call("/api/admin/registrations");
check("admin route rejects missing session", r.status === 401);

// 6. Generate trial license (7 days) linked to the registration
r = await call("/api/admin/licenses", { method: "POST", headers: ADMIN, body: { license_type: "trial", trial_days: 7, registration_id: regId } });
const trialKey = r.data.serial_key;
check("trial license generated", r.status === 201 && /^MEDI(-[A-Z0-9]{4}){4}$/.test(trialKey || ""), JSON.stringify(r.data));
check("license stored hashed (hint only)", r.data.license?.key_hint?.includes("****"));

// 7. Trial days required for trial type
r = await call("/api/admin/licenses", { method: "POST", headers: ADMIN, body: { license_type: "trial" } });
check("trial without days rejected", r.status === 400);

// 8. Invalid key format
r = await call("/api/activation/activate", { method: "POST", body: { ...registration, serial_key: "HELLO-WORLD" } });
check("invalid key format rejected", r.status === 400);

// 9. Unknown key
r = await call("/api/activation/activate", { method: "POST", body: { ...registration, serial_key: "MEDI-AAAA-BBBB-CCCC-DDDD" } });
check("unknown key rejected", r.status === 404);

// 10. Activate with the trial key
r = await call("/api/activation/activate", { method: "POST", body: { ...registration, serial_key: trialKey } });
const activationToken = r.data.activation_token;
check("activation succeeds", r.status === 200 && Boolean(activationToken), JSON.stringify(r.data));
check("trial expiry returned", r.status === 200 && r.data.license?.license_type === "trial" && Boolean(r.data.license?.expires_at));
check("trial calendar midnight expiry", String(r.data.license?.expires_at || "").includes("T00:00:00+01:00"), r.data.license?.expires_at);

// 11. Token verifies
r = await call("/api/activation/verify", { method: "POST", body: { activation_token: activationToken } });
check("token verify valid", r.status === 200 && r.data.valid === true);

// 12. Tampered token invalid
r = await call("/api/activation/verify", { method: "POST", body: { activation_token: activationToken.slice(0, -3) + "xyz" } });
check("tampered token invalid", r.data.valid === false);

// 13. Same key, same device+registration: idempotent re-issue (reinstall case)
r = await call("/api/activation/activate", { method: "POST", body: { ...registration, serial_key: trialKey } });
check("same-device re-activation allowed", r.status === 200 && Boolean(r.data.activation_token));

// 14. Same key, different registration: refused
r = await call("/api/activation/activate", {
  method: "POST",
  body: { ...registration, client_registration_id: "other-client-999", full_name: "Dr Voleur", device_fingerprint: "device-fp-ZZZ", serial_key: trialKey },
});
check("key reuse by another account refused", r.status === 409 || r.status === 403, `status=${r.status}`);

// 15. Lifetime upgrade: generate lifetime key for same registration and activate
r = await call("/api/admin/licenses", { method: "POST", headers: ADMIN, body: { license_type: "lifetime", registration_id: regId } });
const lifetimeKey = r.data.serial_key;
check("lifetime license generated", r.status === 201 && Boolean(lifetimeKey));
r = await call("/api/activation/activate", { method: "POST", body: { ...registration, serial_key: lifetimeKey } });
check("trial->lifetime upgrade works", r.status === 200 && r.data.license?.license_type === "lifetime" && r.data.license?.expires_at === null, JSON.stringify(r.data.license));

// 16. Revoke a fresh key, then activation refused
r = await call("/api/admin/licenses", { method: "POST", headers: ADMIN, body: { license_type: "lifetime" } });
const revokeId = r.data.license?.id;
const revokedKey = r.data.serial_key;
await call(`/api/admin/licenses/${revokeId}/revoke`, { method: "POST", headers: ADMIN });
r = await call("/api/activation/activate", { method: "POST", body: { ...registration, serial_key: revokedKey } });
check("revoked key refused", r.status === 403);

// 17. Registration status flipped to activated
r = await call("/api/admin/registrations", { headers: ADMIN });
const updated = (r.data.rows || []).find((row) => row.id === regId);
check("registration marked activated", updated?.status === "activated");

// 18. Stats
r = await call("/api/admin/stats", { headers: ADMIN });
check("stats endpoint", r.status === 200 && r.data.stats?.licenses_used >= 2, JSON.stringify(r.data.stats));

// 19. Create cloud AI doctor from registration
r = await call(`/api/admin/registrations/${regId}/create-cloud-doctor`, { method: "POST", headers: ADMIN, body: {} });
check("cloud AI doctor created from registration", r.status === 201 && Boolean(r.data.doctor?.doctor_id), JSON.stringify(r.data));
r = await call(`/api/admin/registrations/${regId}/create-cloud-doctor`, { method: "POST", headers: ADMIN, body: {} });
check("second cloud doctor link refused", r.status === 409);

// 20. Cloud session from activation proof (desktop auto-connect)
r = await call("/api/auth/cloud-session", {
  method: "POST",
  body: {
    activation_token: activationToken,
    client_registration_id: registration.client_registration_id,
    device_fingerprint: registration.device_fingerprint,
  },
});
check("cloud session from activation", r.status === 200 && Boolean(r.data.token), JSON.stringify(r.data));

// 21. Used license cannot be deleted
r = await call("/api/admin/licenses", { headers: ADMIN });
const usedLicense = (r.data.rows || []).find((row) => row.status === "used");
r = await call(`/api/admin/licenses/${usedLicense.id}`, { method: "DELETE", headers: ADMIN });
check("used license delete refused", r.status === 409);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
