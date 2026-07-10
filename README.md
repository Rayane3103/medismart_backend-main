# MediSmart AI Backend

Cloud backend for MediSmart Pro. It provides:

- Super admin panel at `/admin` (Dashboard, Registrations, Licenses, AI doctors & keys)
- Doctor registration sync from the desktop app (offline-first registrations)
- Serial key / license management: one-time keys `MEDI-XXXX-XXXX-XXXX-XXXX`,
  trial (N calendar days, Algeria time — expires at midnight) or lifetime, stored hashed, revocable
- Activation endpoint returning an HMAC-signed activation token for the desktop app
- Named Groq/Gemini API keys managed in the admin panel
- Doctor accounts with email, daily usage limit, monthly usage limit, and one assigned named API key
- Usage tracking and enforcement before every AI call
- Upstash Redis storage for accounts, keys, usage, and logs

Provider secrets are not fixed in code and are not stored in Render/Vercel environment variables. Add them from the admin panel, name them, then assign a named key to each doctor.

## Environment Variables

Required:

```txt
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
ADMIN_USERS
```

`ADMIN_USERS` defines admin sign-in accounts for the web panel (username:password pairs, comma-separated):

```txt
ADMIN_USERS=mouad:Mouad123,rayane:24052003
```

Optional legacy token (scripts/tests only):

```txt
ADMIN_TOKEN=your-long-random-token
```

Optional model defaults:

```txt
GROQ_MODEL=llama-3.3-70b-versatile
GEMINI_MODEL=gemini-2.5-flash
```

Recommended for licensing:

```txt
LICENSE_SIGNING_SECRET=<long random string>
```

Signs activation tokens. If unset, a random secret is generated once and stored
in Redis (`license:signing_secret`). Set it explicitly so tokens survive a
Redis wipe.

## Local Development

```bash
npm install
npm run dev
```

Open:

```txt
http://localhost:3000/admin
```

Sign in with a username and password from `ADMIN_USERS`.

## Render Deploy

Use these settings:

```txt
Service type: Web Service
Runtime: Node
Build command: npm install
Start command: npm start
```

Add the required environment variables in Render, then open:

```txt
https://your-service.onrender.com/admin
```

## Admin Flow

1. Add a named API key, for example `Groq main` or `Gemini backup`.
2. Choose the provider and model for that key.
3. From **Inscriptions**, click **Créer compte IA** (or create a doctor manually under **IA & Médecins**) with:
   - Email / name
   - **Requêtes / jour** and **Requêtes / mois** limits
   - Assigned named API key
   - Active + IA enabled toggles
4. Adjust usage anytime via **Modifier** (set used counts, reset day/month, change limits).
5. The desktop app connects **automatically** after license activation — no Doctor ID / secret for the doctor to enter.
6. Each AI request increments usage and is blocked if the daily or monthly limit is reached.

## Endpoints

### Public

| Method | Path | Description |
|---|---|---|
| GET | `/admin` | Super admin panel |
| GET | `/api/health` | Service info, providers, default limits |
| GET | `/api/plans` | Provider defaults, default limits, action costs |
| POST | `/api/registrations/sync` | Desktop app uploads an offline-created doctor registration (idempotent by `client_registration_id`) |
| POST | `/api/activation/activate` | Body includes `serial_key` + registration fields + `device_fingerprint`; validates the key, enforces one-time use, returns a signed activation token |
| POST | `/api/activation/verify` | Re-validates a stored activation token (revocation check) |

### Doctor

Use header `X-Doctor-Token`.

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/cloud-session` | Desktop auto-connect: `{ activation_token, client_registration_id, device_fingerprint }` → `{ token }` |
| POST | `/api/auth/doctor` | Legacy: `{ doctor_id, secret }` → `{ token }` (scripts/old installs) |
| GET | `/api/me/subscription` | Current limits, usage, and assigned key status |
| GET | `/api/me/logs` | Recent AI usage logs |
| POST | `/api/me/ai/chat` | Calls assigned Groq/Gemini key and enforces daily/monthly limits |

### Super Admin

Use header `X-Admin-Token` (session token from `POST /api/admin/login`).

| Method | Path | Description |
|---|---|---|
| POST | `/api/admin/login` | Public — `{ username, password }` → session token |
| GET | `/api/admin/me` | Current admin session |
| POST | `/api/admin/logout` | End session |
| GET | `/api/admin/health` | Verify session |
| GET | `/api/admin/doctors` | Doctors, named keys, default limits |
| POST | `/api/admin/doctors` | Create doctor with email, limits, assigned key |
| PATCH | `/api/admin/doctors/:id` | Update doctor limits, key assignment, status, or usage |
| DELETE | `/api/admin/doctors/:id` | Delete doctor |
| GET | `/api/admin/doctors/:id/logs` | Doctor request logs |
| GET | `/api/admin/api-keys` | List named API keys without revealing secrets |
| POST | `/api/admin/api-keys` | Add named Groq/Gemini key |
| PATCH | `/api/admin/api-keys/:id` | Update named key, model, provider, status, or secret |
| DELETE | `/api/admin/api-keys/:id` | Delete named key |
| GET | `/api/admin/stats` | Licensing dashboard counters |
| GET | `/api/admin/registrations` | List synced doctor registrations (+ linked license) |
| DELETE | `/api/admin/registrations/:id` | Delete a registration |
| POST | `/api/admin/registrations/:id/create-cloud-doctor` | Create a cloud AI doctor account from a registration and link them |
| GET | `/api/admin/licenses` | List licenses (key hints only, never raw keys) |
| POST | `/api/admin/licenses` | Generate a serial key (`license_type`: `trial`+`trial_days` or `lifetime`, optional `registration_id`, `note`). The raw key is returned once |
| POST | `/api/admin/licenses/:id/revoke` | Revoke a license |
| DELETE | `/api/admin/licenses/:id` | Delete an unused license |

Cloud AI usage is tracked as **requests per day** and **requests per month** per doctor account (limits set in the admin panel).
