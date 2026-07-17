// Transactional email for MediSmart, via the Brevo HTTP API.
// Brevo (https://www.brevo.com) free tier: 300 emails/day, and — unlike Resend —
// it sends to ANY recipient once you verify a single sender address, with no
// domain/DNS setup. That is why it is used here to reach arbitrary doctors.
//
// ---------------------------------------------------------------------------
// CONFIGURATION — set these as environment variables in Vercel (recommended),
// or, if you prefer, fill the fallback strings just below and redeploy.
//
//   BREVO_API_KEY    API key from Brevo dashboard > SMTP & API > API Keys
//   EMAIL_FROM       the sender address you verified in Brevo > Senders
//   EMAIL_FROM_NAME  display name shown to recipients (default "MediSmart")
//   ADMIN_NOTIFY_TO  inbox that receives install-demand alerts (default = EMAIL_FROM)
//
// Nothing here is secret until you fill it in; keep real keys in Vercel env,
// not in committed code.
// ---------------------------------------------------------------------------

const FALLBACK = {
  BREVO_API_KEY: "",   // e.g. "xkeysib-…"  (leave in Vercel env instead if you can)
  EMAIL_FROM: "",      // e.g. "contact@votre-domaine.com" (must be verified in Brevo)
  EMAIL_FROM_NAME: "MediSmart",
  ADMIN_NOTIFY_TO: "", // e.g. "vous@gmail.com"
};

function cfg(name) {
  return String(process.env[name] || FALLBACK[name] || "").trim();
}

const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

export function emailConfigured() {
  return Boolean(cfg("BREVO_API_KEY") && cfg("EMAIL_FROM"));
}

export function adminNotifyTo() {
  return cfg("ADMIN_NOTIFY_TO") || cfg("EMAIL_FROM");
}

// Very small HTML -> text fallback for the plain-text part (accessibility +
// spam scoring). Not a full parser; good enough for our own templates.
function htmlToText(html) {
  return String(html || "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|tr|h1|h2|h3|li)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Sends one email. Never throws for "not configured" — callers treat that as a
// soft skip so licence generation / lead capture still succeed without email.
// Real Brevo errors DO throw, so an explicit "send" action can report them.
export async function sendEmail({ to, subject, html, text, replyTo }) {
  if (!emailConfigured()) {
    console.warn("[email] Brevo not configured — skipping send to", Array.isArray(to) ? to.join(",") : to);
    return { skipped: true, reason: "not_configured" };
  }

  const recipients = (Array.isArray(to) ? to : [to])
    .map((e) => String(e || "").trim())
    .filter(Boolean)
    .map((email) => ({ email }));
  if (!recipients.length) return { skipped: true, reason: "no_recipient" };

  const payload = {
    sender: { email: cfg("EMAIL_FROM"), name: cfg("EMAIL_FROM_NAME") || "MediSmart" },
    to: recipients,
    subject: String(subject || "MediSmart"),
    htmlContent: html,
    textContent: text || htmlToText(html),
  };
  const rt = String(replyTo || "").trim();
  if (rt) payload.replyTo = { email: rt };

  const res = await fetch(BREVO_ENDPOINT, {
    method: "POST",
    headers: {
      "api-key": cfg("BREVO_API_KEY"),
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("[email] Brevo error", res.status, JSON.stringify(data));
    const e = new Error(data.message || "Envoi de l'email impossible (Brevo).");
    e.status = res.status;
    throw e;
  }
  return { ok: true, messageId: data.messageId || "" };
}

// ---------------------------------------------------------------------------
// Templates. Inline styles only — email clients ignore <style> and never run
// JavaScript, so there is no real "click to clipboard" button inside an email.
// Instead the key sits in a large, high-contrast, monospaced box that is
// trivial to select / long-press-copy on any device, with a clear hint.
// ---------------------------------------------------------------------------

function esc(v) {
  return String(v == null ? "" : v)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const BRAND = "#2563eb";
const INK = "#0f172a";
const MUTED = "#64748b";
const LINE = "#e2e8f0";

function shell(innerHtml) {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#f1f5f9;padding:24px 12px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:${INK};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid ${LINE};border-radius:16px;overflow:hidden;">
    <tr><td style="background:${BRAND};padding:20px 28px;">
      <span style="color:#fff;font-size:18px;font-weight:800;letter-spacing:-0.02em;">MediSmart</span>
      <span style="color:#dbeafe;font-size:12px;font-weight:600;"> &nbsp;Pro</span>
    </td></tr>
    <tr><td style="padding:28px;">${innerHtml}</td></tr>
    <tr><td style="padding:16px 28px 24px;border-top:1px solid ${LINE};">
      <p style="margin:0;color:${MUTED};font-size:12px;line-height:1.5;">
        Cet email vous a été envoyé par MediSmart. Si vous n'êtes pas concerné, ignorez-le.
      </p>
    </td></tr>
  </table>
</body></html>`;
}

// Licence key delivered to a doctor.
export function licenseEmailTemplate({ serialKey, doctorName, licenseType, trialDays }) {
  const hello = doctorName ? `Bonjour Dr ${esc(doctorName)},` : "Bonjour Docteur,";
  const typeLabel = licenseType === "trial"
    ? `licence d'essai de ${esc(trialDays || 7)} jours`
    : "licence à vie";
  const inner = `
    <p style="margin:0 0 8px;font-size:20px;font-weight:800;letter-spacing:-0.02em;">Votre clé d'activation MediSmart</p>
    <p style="margin:0 0 20px;color:${MUTED};font-size:14px;line-height:1.6;">${hello}<br>
      Voici votre ${typeLabel}. Ouvrez MediSmart, puis collez cette clé dans l'écran d'activation.</p>

    <p style="margin:0 0 8px;color:${MUTED};font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;">Votre clé</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 10px;">
      <tr><td style="background:#f8fafc;border:2px dashed ${BRAND};border-radius:12px;padding:18px 16px;text-align:center;">
        <span style="font-family:ui-monospace,Consolas,'Courier New',monospace;font-size:22px;font-weight:800;letter-spacing:0.14em;color:${INK};word-break:break-all;">${esc(serialKey)}</span>
      </td></tr>
    </table>
    <p style="margin:0 0 24px;color:${MUTED};font-size:12px;line-height:1.5;">
      💡 Astuce : appuyez longuement (mobile) ou double-cliquez (ordinateur) sur la clé ci-dessus pour la sélectionner, puis copiez-la.
    </p>

    <p style="margin:0;color:${MUTED};font-size:13px;line-height:1.6;">
      Un souci d'activation ? Répondez simplement à cet email, nous vous aiderons.
    </p>`;
  return shell(inner);
}

// Internal alert when a new install demand arrives from the landing page.
export function installRequestNotificationTemplate(reqData) {
  const row = (label, value) => value
    ? `<tr><td style="padding:6px 0;color:${MUTED};font-size:13px;width:120px;">${esc(label)}</td>
         <td style="padding:6px 0;color:${INK};font-size:13px;font-weight:600;">${esc(value)}</td></tr>`
    : "";
  const fullName = [reqData.prenom, reqData.nom].filter(Boolean).join(" ") || reqData.nom || "—";
  const inner = `
    <p style="margin:0 0 4px;font-size:20px;font-weight:800;letter-spacing:-0.02em;">Nouvelle demande d'installation</p>
    <p style="margin:0 0 20px;color:${MUTED};font-size:14px;">Un médecin vient de télécharger MediSmart depuis le site.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${LINE};">
      ${row("Nom", fullName)}
      ${row("Email", reqData.email)}
      ${row("Téléphone", reqData.telephone)}
      ${row("Spécialité", reqData.specialite)}
      ${row("Cabinet", reqData.cabinet)}
      ${row("Ville", reqData.ville)}
    </table>
    <p style="margin:22px 0 0;color:${MUTED};font-size:12px;line-height:1.5;">
      Retrouvez cette demande dans l'onglet « Demandes d'installation » du panneau d'administration.
    </p>`;
  return shell(inner);
}
