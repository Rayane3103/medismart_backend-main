export const ADMIN_HTML = `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>MediSmart Admin</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/admin.css">
  <script defer src="/admin.js"></script>
</head>
<body>
  <!-- Sign-in -->
  <section class="login-screen" id="loginScreen">
    <div class="login-bg"></div>
    <div class="login-card">
      <div class="login-brand">
        <img src="/admin/logo.png" alt="MediSmart" class="login-logo">
        <div>
          <strong>MediSmart Pro</strong>
          <span>Administration</span>
        </div>
      </div>
      <h1>Connexion administrateur</h1>
      <p class="login-sub">Gestion des licences, inscriptions et comptes IA.</p>
      <form id="loginForm" class="login-form">
        <label>
          <span>Nom d'utilisateur</span>
          <input id="loginUsername" name="username" autocomplete="username" required placeholder="Votre identifiant">
        </label>
        <label>
          <span>Mot de passe</span>
          <input id="loginPassword" name="password" type="password" autocomplete="current-password" required placeholder="••••••••">
        </label>
        <button type="submit" id="loginSubmit">Se connecter</button>
      </form>
      <p class="login-foot">Accès réservé aux administrateurs MediSmart.</p>
    </div>
  </section>

  <!-- App shell -->
  <div class="app-shell hidden" id="appShell">
    <aside class="sidebar">
      <div class="sidebar-brand">
        <img src="/admin/logo.png" alt="" class="sidebar-logo">
        <div>
          <strong>MediSmart Pro</strong>
          <small>The Doctor Edition</small>
        </div>
      </div>
      <nav class="sidebar-nav" id="sidebarNav">
        <button type="button" class="nav-item active" data-view="dashboard"><span class="nav-icon">◉</span> Tableau de bord</button>
        <button type="button" class="nav-item" data-view="registrations"><span class="nav-icon">◎</span> Inscriptions</button>
        <button type="button" class="nav-item" data-view="licenses"><span class="nav-icon">⬡</span> Licences</button>
        <button type="button" class="nav-item" data-view="ai"><span class="nav-icon">◈</span> IA &amp; Médecins</button>
      </nav>
      <div class="sidebar-foot">
        <div class="sidebar-user">
          <span class="user-avatar" id="userAvatar">A</span>
          <div>
            <strong id="userDisplayName">Admin</strong>
            <small>Administrateur</small>
          </div>
        </div>
      </div>
    </aside>

    <div class="main-wrap">
      <header class="topbar">
        <div>
          <p class="page-kicker" id="pageKicker">Vue d'ensemble</p>
          <h1 class="page-title" id="pageTitle">Tableau de bord</h1>
        </div>
        <div class="topbar-actions">
          <button type="button" class="btn ghost" id="refreshButton">Actualiser</button>
          <button type="button" class="btn ghost danger-text" id="logoutButton">Déconnexion</button>
        </div>
      </header>

      <main class="main-content">
        <div class="view" id="view-dashboard">
          <section class="stat-grid" id="licenseMetrics"></section>
          <section class="stat-grid stat-grid--compact" id="metrics"></section>
          <section class="panel panel--hint">
            <h3>Bienvenue sur l'administration MediSmart</h3>
            <p>Gérez les inscriptions des médecins, générez des clés d'activation (essai ou à vie), et configurez l'accès IA avec des limites de requêtes par jour et par mois.</p>
          </section>
        </div>

        <div class="view hidden" id="view-registrations">
          <div class="toolbar">
            <label class="search-field">
              <span>Rechercher</span>
              <input id="regSearchInput" type="search" placeholder="Nom, spécialité, téléphone, email, wilaya…">
            </label>
            <label>
              <span>Statut</span>
              <select id="regStatusFilter">
                <option value="all">Tous</option>
                <option value="pending_activation">En attente d'activation</option>
                <option value="activated">Activés</option>
              </select>
            </label>
            <button type="button" class="btn primary hidden" id="newLicenseButton">Générer une licence</button>
          </div>
          <section class="panel">
            <div class="panel-head">
              <h2>Inscriptions médecins</h2>
              <span id="regCount" class="panel-count">0</span>
            </div>
            <div class="table-wrap" id="regRows"></div>
          </section>
        </div>

        <div class="view hidden" id="view-licenses">
          <div class="toolbar">
            <label class="search-field">
              <span>Rechercher</span>
              <input id="licenseSearchInput" type="search" placeholder="Indice de clé, médecin, note…">
            </label>
            <label>
              <span>Statut</span>
              <select id="licenseStatusFilter">
                <option value="all">Tous</option>
                <option value="generated">Disponibles</option>
                <option value="used">Utilisées</option>
                <option value="revoked">Révoquées</option>
              </select>
            </label>
            <button type="button" class="btn primary" id="newLicenseButtonAlt">Générer une licence</button>
          </div>
          <section class="panel">
            <div class="panel-head">
              <h2>Clés d'activation</h2>
              <span id="licenseCount" class="panel-count">0</span>
            </div>
            <div class="table-wrap" id="licenseRows"></div>
          </section>
        </div>

        <div class="view hidden" id="view-ai">
          <div class="toolbar toolbar--actions">
            <button type="button" class="btn primary" id="newKeyButton">+ Clé API</button>
            <button type="button" class="btn primary" id="newDoctorButton">+ Compte médecin IA</button>
          </div>
          <section class="panel">
            <div class="panel-head"><h2>Clés API nommées</h2><span id="keyCount" class="panel-count">0</span></div>
            <div class="table-wrap" id="keyRows"></div>
          </section>
          <div class="toolbar">
            <label class="search-field">
              <span>Rechercher</span>
              <input id="searchInput" type="search" placeholder="Email, ID médecin, clé…">
            </label>
            <label>
              <span>Clé assignée</span>
              <select id="keyFilter"><option value="all">Toutes</option></select>
            </label>
          </div>
          <section class="panel">
            <div class="panel-head"><h2>Comptes médecins IA</h2><span id="doctorCount" class="panel-count">0</span></div>
            <div class="table-wrap" id="doctorRows"></div>
          </section>
        </div>
      </main>
    </div>
  </div>

  <!-- Modals -->
  <dialog class="modal" id="licenseDialog">
    <form class="modal-card" id="licenseForm">
      <header class="modal-head">
        <div><p class="kicker">Nouvelle licence</p><h2>Générer une clé d'activation</h2></div>
        <button class="icon-close" type="button" data-close-dialog="licenseDialog" aria-label="Fermer">×</button>
      </header>
      <div class="form-grid">
        <label><span>Médecin / inscription</span><select id="licenseRegistration"><option value="">Non liée (tout compte)</option></select></label>
        <label><span>Type de licence</span><select id="licenseType"><option value="lifetime">À vie</option><option value="trial">Essai gratuit</option></select></label>
        <label class="hidden" id="trialDaysWrap"><span>Durée de l'essai (jours)</span><input id="licenseTrialDays" type="number" min="1" max="3650" placeholder="7, 15, 30"></label>
        <label><span>Note (optionnel)</span><input id="licenseNote" placeholder="Réf. paiement, remarque…"></label>
      </div>
      <footer class="modal-foot"><button class="btn ghost" type="button" data-close-dialog="licenseDialog">Annuler</button><button class="btn primary" type="submit">Générer</button></footer>
    </form>
  </dialog>

  <dialog class="modal" id="serialDialog">
    <div class="modal-card">
      <header class="modal-head">
        <div><p class="kicker">Clé générée</p><h2>Copiez la clé maintenant</h2></div>
        <button class="icon-close" type="button" data-close-dialog="serialDialog" aria-label="Fermer">×</button>
      </header>
      <div class="alert alert--warn">Cette clé ne sera affichée qu'une seule fois. Envoyez-la au médecin par email ou téléphone.</div>
      <div class="copy-row">
        <input id="generatedSerialKey" readonly class="serial-input">
        <button class="btn ghost" type="button" data-copy="generatedSerialKey">Copier</button>
      </div>
      <p class="subtle" id="generatedSerialMeta"></p>
      <footer class="modal-foot"><button class="btn primary" type="button" data-close-dialog="serialDialog">Terminé</button></footer>
    </div>
  </dialog>

  <dialog class="modal" id="keyDialog">
    <form class="modal-card" id="keyForm">
      <header class="modal-head">
        <div><p class="kicker" id="keyDialogMode">Créer</p><h2 id="keyDialogTitle">Clé API</h2></div>
        <button class="icon-close" type="button" data-close-dialog="keyDialog" aria-label="Fermer">×</button>
      </header>
      <input id="keyId" type="hidden">
      <div class="form-grid">
        <label><span>Nom</span><input id="keyName" required placeholder="Groq principal, Gemini backup…"></label>
        <label><span>Fournisseur</span><select id="keyProvider"></select></label>
        <label><span>Modèle</span><input id="keyModel" required></label>
        <label><span>Secret API</span><input id="keySecret" type="password" autocomplete="off" placeholder="Coller la clé"></label>
      </div>
      <div class="checks">
        <label class="check"><input id="keyActive" type="checkbox" checked><span>Active</span></label>
        <label class="check hidden" id="clearKeyWrap"><input id="clearKeySecret" type="checkbox"><span>Effacer le secret enregistré</span></label>
      </div>
      <footer class="modal-foot"><button class="btn ghost" type="button" data-close-dialog="keyDialog">Annuler</button><button class="btn primary" type="submit">Enregistrer</button></footer>
    </form>
  </dialog>

  <dialog class="modal" id="doctorDialog">
    <form class="modal-card" id="doctorForm">
      <header class="modal-head">
        <div><p class="kicker" id="doctorDialogMode">Créer</p><h2 id="doctorDialogTitle">Compte médecin IA</h2></div>
        <button class="icon-close" type="button" data-close-dialog="doctorDialog" aria-label="Fermer">×</button>
      </header>
      <input id="doctorId" type="hidden">
      <div class="form-grid">
        <label><span>Email</span><input id="doctorEmail" type="email" required></label>
        <label><span>Clé API assignée</span><select id="doctorAssignedKey"></select></label>
        <label><span>Limite requêtes / mois</span><input id="doctorMonthlyLimit" type="number" min="0" step="1" required></label>
        <label><span>Limite requêtes / jour</span><input id="doctorDailyLimit" type="number" min="0" step="1" required></label>
      </div>
      <div class="checks">
        <label class="check"><input id="doctorActive" type="checkbox" checked><span>Compte actif</span></label>
        <label class="check"><input id="doctorAiEnabled" type="checkbox" checked><span>IA activée</span></label>
      </div>
      <section class="usage-tools hidden" id="doctorUsageTools">
        <p class="subtle">Ajuster l'utilisation enregistrée (requêtes consommées).</p>
        <div class="form-grid">
          <label><span>Requêtes mois (utilisées)</span><input id="setMonthlyUsed" type="number" min="0" placeholder="Laisser vide"></label>
          <label><span>Requêtes jour (utilisées)</span><input id="setDailyUsed" type="number" min="0" placeholder="Laisser vide"></label>
        </div>
        <div class="checks">
          <label class="check"><input id="resetMonthly" type="checkbox"><span>Réinitialiser le mois</span></label>
          <label class="check"><input id="resetDaily" type="checkbox"><span>Réinitialiser aujourd'hui</span></label>
        </div>
      </section>
      <footer class="modal-foot"><button class="btn ghost" type="button" data-close-dialog="doctorDialog">Annuler</button><button class="btn primary" type="submit">Enregistrer</button></footer>
    </form>
  </dialog>

  <dialog class="modal" id="logsDialog">
    <div class="modal-card modal-card--wide">
      <header class="modal-head">
        <div><p class="kicker">Activité</p><h2 id="logsTitle">Journal des requêtes</h2></div>
        <button class="icon-close" type="button" data-close-dialog="logsDialog" aria-label="Fermer">×</button>
      </header>
      <div id="logsRows" class="logs-list"></div>
    </div>
  </dialog>

  <dialog class="modal" id="credentialsDialog">
    <div class="modal-card">
      <header class="modal-head">
        <div><p class="kicker">Identifiants</p><h2>Connexion médecin (app desktop)</h2></div>
        <button class="icon-close" type="button" data-close-dialog="credentialsDialog" aria-label="Fermer">×</button>
      </header>
      <div class="copy-row"><label><span>Doctor ID</span><input id="createdDoctorId" readonly></label><button class="btn ghost" type="button" data-copy="createdDoctorId">Copier</button></div>
      <div class="copy-row"><label><span>Secret</span><input id="createdDoctorSecret" readonly></label><button class="btn ghost" type="button" data-copy="createdDoctorSecret">Copier</button></div>
      <footer class="modal-foot"><button class="btn primary" type="button" data-close-dialog="credentialsDialog">Fermer</button></footer>
    </div>
  </dialog>

  <div class="toast hidden" id="toast"></div>
</body>
</html>`;

export const ADMIN_CSS = `:root {
  --primary: #2563eb;
  --primary-hover: #1d4ed8;
  --primary-light: #eff6ff;
  --sidebar: #152347;
  --sidebar-hover: #1e3a6e;
  --success: #10b981;
  --success-bg: #ecfdf5;
  --warning: #f59e0b;
  --warning-bg: #fffbeb;
  --danger: #ef4444;
  --danger-bg: #fef2f2;
  --violet: #7c3aed;
  --violet-bg: #f5f3ff;
  --bg: #f8fafc;
  --card: #ffffff;
  --text: #0f172a;
  --muted: #64748b;
  --line: #e2e8f0;
  --shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
  --radius: 14px;
  font-family: Inter, system-ui, sans-serif;
}
*, *::before, *::after { box-sizing: border-box; }
body { margin: 0; min-height: 100vh; background: var(--bg); color: var(--text); }
button, input, select { font: inherit; }
.hidden { display: none !important; }

/* Login */
.login-screen { min-height: 100vh; display: grid; place-items: center; padding: 24px; position: relative; }
.login-bg { position: fixed; inset: 0; background: linear-gradient(135deg, #eff6ff 0%, #f8fafc 45%, #eef2ff 100%); z-index: 0; }
.login-card { position: relative; z-index: 1; width: min(420px, 100%); background: var(--card); border: 1px solid var(--line); border-radius: 20px; padding: 36px 32px 28px; box-shadow: var(--shadow); }
.login-brand { display: flex; align-items: center; gap: 14px; margin-bottom: 22px; }
.login-logo { width: 52px; height: 52px; border-radius: 14px; object-fit: cover; box-shadow: 0 8px 20px rgba(37,99,235,.18); }
.login-brand strong { display: block; font-size: 18px; letter-spacing: -.02em; }
.login-brand span { color: var(--muted); font-size: 12px; font-weight: 500; }
.login-card h1 { margin: 0 0 8px; font-size: 24px; letter-spacing: -.02em; }
.login-sub { margin: 0 0 22px; color: var(--muted); font-size: 14px; line-height: 1.5; }
.login-form { display: grid; gap: 14px; }
.login-form label { display: grid; gap: 6px; font-size: 13px; font-weight: 600; color: var(--muted); }
.login-form input { min-height: 46px; border: 1px solid var(--line); border-radius: 12px; padding: 0 14px; background: #fff; }
.login-form input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(37,99,235,.12); outline: none; }
.login-form button { min-height: 48px; border: 0; border-radius: 12px; background: var(--primary); color: #fff; font-weight: 700; cursor: pointer; margin-top: 4px; }
.login-form button:hover { background: var(--primary-hover); }
.login-form button:disabled { opacity: .6; cursor: wait; }
.login-foot { margin: 18px 0 0; text-align: center; font-size: 12px; color: var(--muted); }

/* Shell */
.app-shell { display: grid; grid-template-columns: 260px 1fr; min-height: 100vh; }
.sidebar { background: var(--sidebar); color: #e2e8f0; display: flex; flex-direction: column; padding: 20px 14px; position: sticky; top: 0; height: 100vh; }
.sidebar-brand { display: flex; align-items: center; gap: 12px; padding: 8px 10px 20px; border-bottom: 1px solid rgba(255,255,255,.08); margin-bottom: 16px; }
.sidebar-logo { width: 40px; height: 40px; border-radius: 10px; object-fit: cover; }
.sidebar-brand strong { display: block; color: #fff; font-size: 14px; }
.sidebar-brand small { color: #94a3b8; font-size: 10px; }
.sidebar-nav { display: grid; gap: 6px; flex: 1; }
.nav-item { display: flex; align-items: center; gap: 10px; min-height: 44px; padding: 0 14px; border: 0; border-radius: 10px; background: transparent; color: #cbd5e1; font-weight: 600; font-size: 13.5px; cursor: pointer; text-align: left; }
.nav-item:hover { background: var(--sidebar-hover); color: #fff; }
.nav-item.active { background: linear-gradient(90deg, rgba(37,99,235,.35), rgba(37,99,235,.12)); color: #fff; box-shadow: inset 3px 0 0 #60a5fa; }
.nav-icon { opacity: .85; font-size: 12px; }
.sidebar-foot { border-top: 1px solid rgba(255,255,255,.08); padding-top: 14px; }
.sidebar-user { display: flex; align-items: center; gap: 10px; padding: 8px 10px; }
.user-avatar { width: 36px; height: 36px; border-radius: 10px; background: var(--primary); color: #fff; display: grid; place-items: center; font-weight: 800; font-size: 14px; }
.sidebar-user strong { display: block; color: #fff; font-size: 13px; }
.sidebar-user small { color: #94a3b8; font-size: 11px; }

.main-wrap { min-width: 0; display: flex; flex-direction: column; }
.topbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 22px 28px 12px; background: var(--card); border-bottom: 1px solid var(--line); position: sticky; top: 0; z-index: 5; }
.page-kicker { margin: 0; font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--primary); }
.page-title { margin: 4px 0 0; font-size: 26px; letter-spacing: -.02em; }
.topbar-actions { display: flex; gap: 10px; flex-wrap: wrap; }
.main-content { padding: 22px 28px 40px; flex: 1; }

.btn { min-height: 40px; padding: 0 16px; border-radius: 10px; border: 1px solid transparent; font-weight: 700; font-size: 13px; cursor: pointer; white-space: nowrap; }
.btn.primary { background: var(--primary); color: #fff; }
.btn.primary:hover { background: var(--primary-hover); }
.btn.ghost { background: #fff; border-color: var(--line); color: var(--text); }
.btn.ghost:hover { background: #f8fafc; }
.btn.danger { background: var(--danger-bg); color: var(--danger); border-color: #fecaca; }
.btn:disabled { opacity: .55; cursor: not-allowed; }
.danger-text { color: var(--danger); }

.stat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 14px; margin-bottom: 18px; }
.stat-grid--compact { margin-bottom: 22px; }
.stat-card { background: var(--card); border: 1px solid var(--line); border-radius: var(--radius); padding: 16px 18px; box-shadow: 0 1px 2px rgba(15,23,42,.04); }
.stat-card span { display: block; font-size: 12px; font-weight: 600; color: var(--muted); margin-bottom: 8px; }
.stat-card strong { font-size: 28px; line-height: 1; letter-spacing: -.02em; }
.stat-card.accent-blue strong { color: var(--primary); }
.stat-card.accent-green strong { color: var(--success); }
.stat-card.accent-amber strong { color: var(--warning); }
.stat-card.accent-violet strong { color: var(--violet); }

.panel { background: var(--card); border: 1px solid var(--line); border-radius: var(--radius); box-shadow: 0 1px 2px rgba(15,23,42,.04); margin-bottom: 18px; overflow: hidden; }
.panel--hint { padding: 22px 24px; }
.panel--hint h3 { margin: 0 0 8px; font-size: 17px; }
.panel--hint p { margin: 0; color: var(--muted); line-height: 1.55; font-size: 14px; }
.panel-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 16px 20px; border-bottom: 1px solid var(--line); background: #fafbfd; }
.panel-head h2 { margin: 0; font-size: 16px; }
.panel-count { font-size: 12px; font-weight: 700; color: var(--muted); background: #f1f5f9; padding: 4px 10px; border-radius: 999px; }

.toolbar { display: flex; flex-wrap: wrap; gap: 12px; align-items: end; margin-bottom: 14px; }
.toolbar--actions { justify-content: flex-start; }
.search-field { flex: 1; min-width: 220px; }
label { display: grid; gap: 6px; font-size: 12px; font-weight: 700; color: var(--muted); }
input, select { min-height: 42px; border: 1px solid var(--line); border-radius: 10px; padding: 0 12px; background: #fff; color: var(--text); }
input:focus, select:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(37,99,235,.1); outline: none; }

.table-wrap { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
.data-table th { text-align: left; padding: 12px 16px; font-size: 11px; text-transform: uppercase; letter-spacing: .06em; color: var(--muted); background: #fafbfd; border-bottom: 1px solid var(--line); white-space: nowrap; }
.data-table td { padding: 14px 16px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
.data-table tr:hover td { background: #fafcff; }
.cell-title { font-weight: 700; color: var(--text); margin-bottom: 3px; }
.cell-sub { color: var(--muted); font-size: 12px; line-height: 1.4; }
.row-actions { display: flex; flex-wrap: wrap; gap: 6px; justify-content: flex-end; }
.row-actions .btn { min-height: 34px; padding: 0 11px; font-size: 12px; }

.badge { display: inline-flex; align-items: center; min-height: 24px; padding: 0 9px; border-radius: 999px; font-size: 11px; font-weight: 800; margin-right: 4px; margin-bottom: 4px; }
.badge.blue { background: var(--primary-light); color: #1d4ed8; }
.badge.green { background: var(--success-bg); color: #047857; }
.badge.amber { background: var(--warning-bg); color: #b45309; }
.badge.red { background: var(--danger-bg); color: #b91c1c; }
.badge.violet { background: var(--violet-bg); color: #6d28d9; }

.usage { display: grid; gap: 8px; min-width: 140px; }
.usage-line span { font-size: 12px; color: var(--muted); }
.bar { height: 7px; background: #eef2f7; border-radius: 999px; overflow: hidden; margin-top: 4px; }
.bar i { display: block; height: 100%; background: var(--primary); border-radius: 999px; }
.bar.daily i { background: #0ea5e9; }

.code { font-family: ui-monospace, Consolas, monospace; font-size: 11.5px; background: #f8fafc; border: 1px solid var(--line); border-radius: 8px; padding: 6px 8px; word-break: break-all; }
.serial-input { font-family: ui-monospace, Consolas, monospace; font-size: 17px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; }
.empty { padding: 40px 20px; text-align: center; color: var(--muted); }

.modal { border: 0; padding: 0; background: transparent; max-width: min(640px, calc(100% - 24px)); }
.modal::backdrop { background: rgba(15,23,42,.45); backdrop-filter: blur(4px); }
.modal-card { background: #fff; border-radius: 16px; border: 1px solid var(--line); box-shadow: var(--shadow); padding: 20px; }
.modal-card--wide { width: min(760px, calc(100vw - 24px)); }
.modal-head { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 16px; }
.modal-head h2 { margin: 4px 0 0; font-size: 20px; }
.kicker { margin: 0; font-size: 11px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: var(--primary); }
.icon-close { width: 36px; height: 36px; border: 0; border-radius: 10px; background: #f1f5f9; cursor: pointer; font-size: 22px; line-height: 1; color: var(--muted); }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 14px; }
.checks { display: flex; flex-wrap: wrap; gap: 14px; margin: 14px 0; }
.check { display: inline-flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: var(--text); }
.check input { width: 16px; height: 16px; min-height: 16px; }
.modal-foot { display: flex; justify-content: flex-end; gap: 10px; margin-top: 18px; padding-top: 16px; border-top: 1px solid var(--line); }
.alert { padding: 12px 14px; border-radius: 10px; font-size: 13px; line-height: 1.45; margin-bottom: 14px; }
.alert--warn { background: var(--warning-bg); color: #92400e; border: 1px solid #fde68a; }
.copy-row { display: grid; grid-template-columns: 1fr auto; gap: 10px; align-items: end; margin-bottom: 10px; }
.subtle { color: var(--muted); font-size: 12.5px; line-height: 1.45; }
.logs-list { display: grid; gap: 8px; max-height: 60vh; overflow: auto; }
.log-row { display: grid; grid-template-columns: 130px 100px 70px 1fr; gap: 10px; align-items: center; padding: 10px 12px; border: 1px solid var(--line); border-radius: 10px; font-size: 12.5px; }
.toast { position: fixed; right: 18px; bottom: 18px; max-width: 360px; background: #0f172a; color: #fff; padding: 12px 16px; border-radius: 12px; font-weight: 700; font-size: 13px; box-shadow: var(--shadow); z-index: 100; }

@media (max-width: 960px) {
  .app-shell { grid-template-columns: 1fr; }
  .sidebar { position: relative; height: auto; }
  .sidebar-nav { grid-template-columns: repeat(2, minmax(0,1fr)); }
  .form-grid { grid-template-columns: 1fr; }
  .log-row { grid-template-columns: 1fr; }
}
`;

export const ADMIN_JS = `(function () {
  "use strict";

  var PAGE_META = {
    dashboard: { kicker: "Vue d'ensemble", title: "Tableau de bord" },
    registrations: { kicker: "Licences", title: "Inscriptions médecins" },
    licenses: { kicker: "Licences", title: "Clés d'activation" },
    ai: { kicker: "Intelligence artificielle", title: "IA & Médecins" }
  };

  var REG_STATUS = { pending_activation: "En attente", activated: "Activé" };
  var LIC_STATUS = { generated: "Disponible", used: "Utilisée", revoked: "Révoquée" };

  var state = {
    session: null,
    view: "dashboard",
    rows: [], apiKeys: [], providers: {}, defaults: { monthly_limit: 500, daily_limit: 50 },
    query: "", keyFilter: "all",
    registrations: [], licenses: [], stats: {},
    regQuery: "", regStatusFilter: "all",
    licenseQuery: "", licenseStatusFilter: "all",
    editingDoctorId: "", editingKeyId: ""
  };

  var el = {};
  function byId(id) { return document.getElementById(id); }

  function escapeHtml(v) {
    return String(v == null ? "" : v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  }

  function showToast(msg, isError) {
    el.toast.textContent = msg;
    el.toast.style.background = isError ? "#b91c1c" : "#0f172a";
    el.toast.classList.remove("hidden");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () { el.toast.classList.add("hidden"); }, 3200);
  }

  function loadSession() {
    try {
      var raw = localStorage.getItem("medismart_admin_session");
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function saveSession(session) {
    state.session = session;
    if (session) localStorage.setItem("medismart_admin_session", JSON.stringify(session));
    else localStorage.removeItem("medismart_admin_session");
  }

  function authHeader() {
    return state.session && state.session.token ? { "X-Admin-Token": state.session.token } : {};
  }

  async function apiFetch(path, options) {
    options = options || {};
    var headers = Object.assign({ "Content-Type": "application/json" }, authHeader(), options.headers || {});
    var res = await fetch(path, { method: options.method || "GET", headers: headers, body: options.body !== undefined ? JSON.stringify(options.body) : undefined });
    var data = await res.json().catch(function () { return {}; });
    if (!res.ok) throw new Error(data.error || res.statusText || "Erreur");
    return data;
  }

  function setBusy(btn, busy) {
    if (!btn) return;
    btn.disabled = busy;
    if (busy) { btn.dataset.label = btn.textContent; btn.textContent = "Patientez…"; }
    else if (btn.dataset.label) { btn.textContent = btn.dataset.label; delete btn.dataset.label; }
  }

  function showLogin(show) {
    el.loginScreen.classList.toggle("hidden", !show);
    el.appShell.classList.toggle("hidden", show);
  }

  function setView(view) {
    state.view = view;
    var meta = PAGE_META[view] || PAGE_META.dashboard;
    el.pageKicker.textContent = meta.kicker;
    el.pageTitle.textContent = meta.title;
    document.querySelectorAll(".nav-item").forEach(function (n) {
      n.classList.toggle("active", n.dataset.view === view);
    });
    ["dashboard","registrations","licenses","ai"].forEach(function (name) {
      var panel = byId("view-" + name);
      if (panel) panel.classList.toggle("hidden", name !== view);
    });
  }

  async function loadData() {
    var results = await Promise.all([
      apiFetch("/api/admin/doctors"),
      apiFetch("/api/admin/registrations"),
      apiFetch("/api/admin/licenses")
    ]);
    state.rows = results[0].rows || [];
    state.apiKeys = results[0].api_keys || [];
    state.providers = results[0].providers || {};
    state.defaults = results[0].default_limits || state.defaults;
    state.registrations = results[1].rows || [];
    state.licenses = results[2].rows || [];
    state.stats = results[2].stats || results[1].stats || {};
    renderAll();
  }

  function renderAll() {
    renderProviderOptions();
    renderKeyFilter();
    renderDoctorKeyOptions();
    renderLicenseMetrics();
    renderMetrics();
    renderKeys();
    renderDoctors();
    renderRegistrations();
    renderLicenses();
  }

  function statCard(label, value, accent) {
    return '<article class="stat-card ' + (accent || "") + '"><span>' + escapeHtml(label) + '</span><strong>' + escapeHtml(value) + '</strong></article>';
  }

  function renderLicenseMetrics() {
    var s = state.stats || {};
    el.licenseMetrics.innerHTML =
      statCard("Inscriptions", s.registrations_total || 0, "accent-blue") +
      statCard("En attente d'activation", s.registrations_pending || 0, "accent-amber") +
      statCard("Médecins activés", s.registrations_activated || 0, "accent-green") +
      statCard("Licences générées", s.licenses_total || 0, "accent-violet");
  }

  function renderMetrics() {
    var totalDoctors = state.rows.length;
    var activeDoctors = state.rows.filter(function (r) { return r.active; }).length;
    var totalKeys = state.apiKeys.length;
    var monthlyReq = state.rows.reduce(function (sum, r) { return sum + (r.monthly_used || 0); }, 0);
    var dailyReq = state.rows.reduce(function (sum, r) { return sum + (r.daily_used || 0); }, 0);
    el.metrics.innerHTML =
      statCard("Clés API", totalKeys, "accent-violet") +
      statCard("Comptes IA", totalDoctors, "accent-blue") +
      statCard("Comptes actifs", activeDoctors, "accent-green") +
      statCard("Requêtes aujourd'hui", dailyReq, "accent-amber") +
      statCard("Requêtes ce mois", monthlyReq, "");
  }

  function renderProviderOptions() {
    el.keyProvider.innerHTML = Object.keys(state.providers).map(function (k) {
      return '<option value="' + escapeHtml(k) + '">' + escapeHtml(state.providers[k].label) + '</option>';
    }).join("");
  }

  function renderKeyFilter() {
    var cur = state.keyFilter || "all";
    var html = '<option value="all">Toutes</option><option value="">Aucune clé</option>';
    state.apiKeys.forEach(function (k) { html += '<option value="' + escapeHtml(k.id) + '">' + escapeHtml(k.name) + '</option>'; });
    el.keyFilter.innerHTML = html;
    el.keyFilter.value = cur;
  }

  function renderDoctorKeyOptions() {
    var html = '<option value="">Aucune clé</option>';
    state.apiKeys.forEach(function (k) {
      html += '<option value="' + escapeHtml(k.id) + '">' + escapeHtml(k.name) + ' — ' + escapeHtml(k.provider_label) + '</option>';
    });
    el.doctorAssignedKey.innerHTML = html;
  }

  function badge(cls, text) { return '<span class="badge ' + cls + '">' + escapeHtml(text) + '</span>'; }

  function usageBars(monthUsed, monthLimit, dayUsed, dayLimit) {
    function pct(u, l) { return l ? Math.min(100, Math.round((u || 0) / l * 100)) : 0; }
    return '<div class="usage">' +
      '<div class="usage-line"><span>Mois : ' + escapeHtml(monthUsed || 0) + ' / ' + escapeHtml(monthLimit || 0) + ' req.</span><div class="bar"><i style="width:' + pct(monthUsed, monthLimit) + '%"></i></div></div>' +
      '<div class="usage-line"><span>Jour : ' + escapeHtml(dayUsed || 0) + ' / ' + escapeHtml(dayLimit || 0) + ' req.</span><div class="bar daily"><i style="width:' + pct(dayUsed, dayLimit) + '%"></i></div></div>' +
    '</div>';
  }

  function renderKeys() {
    el.keyCount.textContent = state.apiKeys.length;
    if (!state.apiKeys.length) { el.keyRows.innerHTML = '<div class="empty">Aucune clé API.</div>'; return; }
    var rows = state.apiKeys.map(function (k) {
      return '<tr><td><div class="cell-title">' + escapeHtml(k.name) + '</div><div class="cell-sub">' + escapeHtml(k.id) + '</div></td>' +
        '<td>' + badge("blue", k.provider_label) + (k.active ? badge("green","Active") : badge("red","Inactive")) + '</td>' +
        '<td><div class="cell-sub">' + escapeHtml(k.model) + '</div>' + (k.has_key ? badge("violet","Secret OK") : badge("amber","Sans secret")) + '</td>' +
        '<td>' + escapeHtml(k.assigned_count || 0) + ' médecin(s)</td>' +
        '<td class="row-actions"><button class="btn ghost" type="button" data-action="edit-key" data-id="' + escapeHtml(k.id) + '">Modifier</button>' +
        '<button class="btn danger" type="button" data-action="delete-key" data-id="' + escapeHtml(k.id) + '">Supprimer</button></td></tr>';
    }).join("");
    el.keyRows.innerHTML = '<table class="data-table"><thead><tr><th>Clé</th><th>Statut</th><th>Modèle</th><th>Assignée</th><th></th></tr></thead><tbody>' + rows + '</tbody></table>';
  }

  function filteredDoctors() {
    var q = state.query.trim().toLowerCase();
    return state.rows.filter(function (r) {
      var keyOk = state.keyFilter === "all" || r.assigned_api_key_id === state.keyFilter;
      var hay = [r.name, r.email, r.doctor_id, r.assigned_api_key_name].join(" ").toLowerCase();
      return keyOk && (!q || hay.indexOf(q) !== -1);
    });
  }

  function renderDoctors() {
    var rows = filteredDoctors();
    el.doctorCount.textContent = rows.length;
    if (!rows.length) { el.doctorRows.innerHTML = '<div class="empty">Aucun compte médecin IA.</div>'; return; }
    var html = rows.map(function (r) {
      return '<tr><td><div class="cell-title">' + escapeHtml(r.email || "—") + '</div>' +
        (r.active ? badge("green","Actif") : badge("red","Inactif")) +
        (r.ai_enabled ? badge("blue","IA on") : badge("amber","IA off")) + '</td>' +
        '<td><div class="code">' + escapeHtml(r.doctor_id) + '</div><div class="code" style="margin-top:6px">' + escapeHtml(r.secret || "") + '</div></td>' +
        '<td><div class="cell-sub">' + escapeHtml(r.assigned_api_key_name || "Aucune") + '</div><div class="cell-sub">' + escapeHtml(r.ai_provider_label || "") + ' ' + escapeHtml(r.ai_model || "") + '</div></td>' +
        '<td>' + usageBars(r.monthly_used, r.monthly_limit, r.daily_used, r.daily_limit) + '</td>' +
        '<td class="row-actions">' +
          '<button class="btn ghost" type="button" data-action="logs" data-id="' + escapeHtml(r.doctor_id) + '">Journal</button>' +
          '<button class="btn ghost" type="button" data-action="edit-doctor" data-id="' + escapeHtml(r.doctor_id) + '">Modifier</button>' +
          '<button class="btn danger" type="button" data-action="delete-doctor" data-id="' + escapeHtml(r.doctor_id) + '">Supprimer</button>' +
        '</td></tr>';
    }).join("");
    el.doctorRows.innerHTML = '<table class="data-table"><thead><tr><th>Compte</th><th>Identifiants</th><th>Clé IA</th><th>Requêtes</th><th></th></tr></thead><tbody>' + html + '</tbody></table>';
  }

  function filteredRegistrations() {
    var q = state.regQuery.trim().toLowerCase();
    return state.registrations.filter(function (r) {
      var ok = state.regStatusFilter === "all" || r.status === state.regStatusFilter;
      var hay = [r.full_name, r.specialty, r.phone, r.email, r.wilaya, r.clinic_name].join(" ").toLowerCase();
      return ok && (!q || hay.indexOf(q) !== -1);
    });
  }

  function renderRegistrations() {
    var rows = filteredRegistrations();
    el.regCount.textContent = rows.length;
    if (!rows.length) { el.regRows.innerHTML = '<div class="empty">Aucune inscription synchronisée pour le moment.</div>'; return; }
    var html = rows.map(function (r) {
      var st = r.status === "activated" ? badge("green", REG_STATUS.activated) : badge("amber", REG_STATUS.pending_activation);
      var lic = r.license ? '<div class="cell-sub">' + escapeHtml(r.license.key_hint) + ' (' + escapeHtml(r.license.license_type) + ')</div>' : '<div class="cell-sub">Pas encore de licence</div>';
      return '<tr><td><div class="cell-title">' + escapeHtml(r.full_name || "—") + '</div><div class="cell-sub">' + escapeHtml(r.specialty || "") + (r.wilaya ? " · " + escapeHtml(r.wilaya) : "") + '</div></td>' +
        '<td><div class="cell-sub">' + escapeHtml(r.phone || "") + '</div><div class="cell-sub">' + escapeHtml(r.email || "") + '</div></td>' +
        '<td>' + st + (r.cloud_doctor_id ? badge("violet","IA liée") : "") + lic + '</td>' +
        '<td><div class="cell-sub">Inscrit : ' + escapeHtml((r.registered_at || "").slice(0,10)) + '</div></td>' +
        '<td class="row-actions">' +
          '<button class="btn ghost" type="button" data-action="reg-generate" data-id="' + escapeHtml(r.id) + '">Générer clé</button>' +
          (r.cloud_doctor_id ? "" : '<button class="btn ghost" type="button" data-action="reg-cloud-doctor" data-id="' + escapeHtml(r.id) + '">Créer compte IA</button>') +
          '<button class="btn danger" type="button" data-action="reg-delete" data-id="' + escapeHtml(r.id) + '">Supprimer</button>' +
        '</td></tr>';
    }).join("");
    el.regRows.innerHTML = '<table class="data-table"><thead><tr><th>Médecin</th><th>Contact</th><th>Statut</th><th>Date</th><th></th></tr></thead><tbody>' + html + '</tbody></table>';
  }

  function filteredLicenses() {
    var q = state.licenseQuery.trim().toLowerCase();
    return state.licenses.filter(function (r) {
      var ok = state.licenseStatusFilter === "all" || r.status === state.licenseStatusFilter;
      var hay = [r.key_hint, r.registration_name, r.note, r.license_type].join(" ").toLowerCase();
      return ok && (!q || hay.indexOf(q) !== -1);
    });
  }

  function renderLicenses() {
    var rows = filteredLicenses();
    el.licenseCount.textContent = rows.length;
    if (!rows.length) { el.licenseRows.innerHTML = '<div class="empty">Aucune licence générée.</div>'; return; }
    var html = rows.map(function (r) {
      var typeBadge = r.license_type === "trial" ? badge("amber", "Essai " + (r.trial_days || "?") + "j") : badge("violet", "À vie");
      var stCls = r.status === "used" ? "green" : r.status === "revoked" ? "red" : "blue";
      return '<tr><td><div class="serial-input" style="font-size:14px">' + escapeHtml(r.key_hint || "") + '</div><div class="cell-sub">' + escapeHtml(r.note || "") + '</div></td>' +
        '<td>' + typeBadge + badge(stCls, LIC_STATUS[r.status] || r.status) + '</td>' +
        '<td><div class="cell-sub">' + escapeHtml(r.registration_name || "Non liée") + '</div></td>' +
        '<td><div class="cell-sub">Créée : ' + escapeHtml((r.created_at || "").slice(0,10)) + '</div>' + (r.used_at ? '<div class="cell-sub">Utilisée : ' + escapeHtml(r.used_at.replace("T"," ").slice(0,16)) + '</div>' : "") + '</td>' +
        '<td class="row-actions">' +
          (r.status !== "revoked" ? '<button class="btn danger" type="button" data-action="license-revoke" data-id="' + escapeHtml(r.id) + '">Révoquer</button>' : "") +
          (r.status === "generated" ? '<button class="btn danger" type="button" data-action="license-delete" data-id="' + escapeHtml(r.id) + '">Supprimer</button>' : "") +
        '</td></tr>';
    }).join("");
    el.licenseRows.innerHTML = '<table class="data-table"><thead><tr><th>Clé</th><th>Type</th><th>Médecin</th><th>Dates</th><th></th></tr></thead><tbody>' + html + '</tbody></table>';
  }

  function findKey(id) { return state.apiKeys.find(function (k) { return k.id === id; }); }
  function findDoctor(id) { return state.rows.find(function (r) { return r.doctor_id === id; }); }
  function findRegistration(id) { return state.registrations.find(function (r) { return r.id === id; }); }
  function defaultModel(p) { return state.providers[p] ? state.providers[p].default_model : ""; }

  function openLicenseDialog(regId) {
    el.licenseForm.reset();
    var html = '<option value="">Non liée (tout compte)</option>';
    state.registrations.forEach(function (r) {
      html += '<option value="' + escapeHtml(r.id) + '">' + escapeHtml((r.full_name || "?") + (r.specialty ? " — " + r.specialty : "")) + '</option>';
    });
    el.licenseRegistration.innerHTML = html;
    el.licenseRegistration.value = regId || "";
    el.licenseType.value = "lifetime";
    syncTrialDays();
    el.licenseDialog.showModal();
  }

  function syncTrialDays() {
    var trial = el.licenseType.value === "trial";
    el.trialDaysWrap.classList.toggle("hidden", !trial);
    el.licenseTrialDays.required = trial;
    if (trial && !el.licenseTrialDays.value) el.licenseTrialDays.value = "7";
  }

  async function saveLicense(e) {
    e.preventDefault();
    var btn = el.licenseForm.querySelector('button[type="submit"]');
    setBusy(btn, true);
    try {
      var body = { license_type: el.licenseType.value, registration_id: el.licenseRegistration.value, note: el.licenseNote.value.trim() };
      if (body.license_type === "trial") body.trial_days = parseInt(el.licenseTrialDays.value, 10) || 0;
      var result = await apiFetch("/api/admin/licenses", { method: "POST", body: body });
      el.licenseDialog.close();
      await loadData();
      el.generatedSerialKey.value = result.serial_key || "";
      el.generatedSerialMeta.textContent = result.license ? (result.license.license_type === "trial" ? "Essai " + result.license.trial_days + " jours" : "Licence à vie") : "";
      el.serialDialog.showModal();
    } catch (err) { showToast(err.message, true); }
    finally { setBusy(btn, false); }
  }

  function openKeyDialog(key) {
    state.editingKeyId = key ? key.id : "";
    el.keyForm.reset();
    el.keyDialogMode.textContent = key ? "Modifier" : "Créer";
    el.keyDialogTitle.textContent = key ? key.name : "Clé API";
    el.keyId.value = key ? key.id : "";
    el.keyName.value = key ? key.name : "";
    el.keyProvider.value = key ? key.provider : "groq";
    el.keyModel.value = key ? key.model : defaultModel(el.keyProvider.value);
    el.keySecret.value = "";
    el.keySecret.required = !key;
    el.keyActive.checked = key ? !!key.active : true;
    el.clearKeyWrap.classList.toggle("hidden", !key);
    el.keyDialog.showModal();
  }

  function openDoctorDialog(row) {
    state.editingDoctorId = row ? row.doctor_id : "";
    el.doctorForm.reset();
    el.doctorDialogMode.textContent = row ? "Modifier" : "Créer";
    el.doctorDialogTitle.textContent = row ? (row.email || "Médecin") : "Compte médecin IA";
    el.doctorId.value = row ? row.doctor_id : "";
    el.doctorEmail.value = row ? row.email || "" : "";
    el.doctorAssignedKey.value = row ? row.assigned_api_key_id || "" : (state.apiKeys[0] ? state.apiKeys[0].id : "");
    el.doctorMonthlyLimit.value = row ? row.monthly_limit : state.defaults.monthly_limit;
    el.doctorDailyLimit.value = row ? row.daily_limit : state.defaults.daily_limit;
    el.doctorActive.checked = row ? !!row.active : true;
    el.doctorAiEnabled.checked = row ? !!row.ai_enabled : true;
    el.doctorUsageTools.classList.toggle("hidden", !row);
    el.doctorDialog.showModal();
  }

  async function saveKey(e) {
    e.preventDefault(); var btn = el.keyForm.querySelector('button[type="submit"]'); setBusy(btn, true);
    try {
      var body = { name: el.keyName.value.trim(), provider: el.keyProvider.value, model: el.keyModel.value.trim(), active: el.keyActive.checked };
      if (el.keySecret.value.trim()) body.api_key = el.keySecret.value.trim();
      if (state.editingKeyId && el.clearKeySecret.checked) body.clear_api_key = true;
      if (state.editingKeyId) await apiFetch("/api/admin/api-keys/" + encodeURIComponent(state.editingKeyId), { method: "PATCH", body: body });
      else await apiFetch("/api/admin/api-keys", { method: "POST", body: body });
      el.keyDialog.close(); await loadData(); showToast("Clé API enregistrée");
    } catch (err) { showToast(err.message, true); } finally { setBusy(btn, false); }
  }

  async function saveDoctor(e) {
    e.preventDefault(); var btn = el.doctorForm.querySelector('button[type="submit"]'); setBusy(btn, true);
    try {
      var body = { email: el.doctorEmail.value.trim(), assigned_api_key_id: el.doctorAssignedKey.value,
        monthly_limit: parseInt(el.doctorMonthlyLimit.value, 10) || 0, daily_limit: parseInt(el.doctorDailyLimit.value, 10) || 0,
        active: el.doctorActive.checked, ai_enabled: el.doctorAiEnabled.checked };
      if (state.editingDoctorId) {
        if (el.setMonthlyUsed.value !== "") body.set_monthly_used = parseInt(el.setMonthlyUsed.value, 10) || 0;
        if (el.setDailyUsed.value !== "") body.set_daily_used = parseInt(el.setDailyUsed.value, 10) || 0;
        if (el.resetMonthly.checked) body.reset_monthly = true;
        if (el.resetDaily.checked) body.reset_daily = true;
      }
      var result;
      if (state.editingDoctorId) result = await apiFetch("/api/admin/doctors/" + encodeURIComponent(state.editingDoctorId), { method: "PATCH", body: body });
      else result = await apiFetch("/api/admin/doctors", { method: "POST", body: body });
      el.doctorDialog.close(); await loadData(); showToast("Compte enregistré");
      if (!state.editingDoctorId && result.doctor) showCredentials(result.doctor);
    } catch (err) { showToast(err.message, true); } finally { setBusy(btn, false); }
  }

  function showCredentials(doctor) {
    el.createdDoctorId.value = doctor.doctor_id || doctor.id || "";
    el.createdDoctorSecret.value = doctor.secret || "";
    el.credentialsDialog.showModal();
  }

  async function deleteKey(id) { if (!confirm("Supprimer cette clé API ?")) return; try { await apiFetch("/api/admin/api-keys/" + encodeURIComponent(id), { method: "DELETE" }); await loadData(); showToast("Clé supprimée"); } catch (e) { showToast(e.message, true); } }
  async function deleteDoctor(id) { if (!confirm("Supprimer ce compte ?")) return; try { await apiFetch("/api/admin/doctors/" + encodeURIComponent(id), { method: "DELETE" }); await loadData(); showToast("Compte supprimé"); } catch (e) { showToast(e.message, true); } }
  async function deleteRegistration(id) { if (!confirm("Supprimer cette inscription ?")) return; try { await apiFetch("/api/admin/registrations/" + encodeURIComponent(id), { method: "DELETE" }); await loadData(); showToast("Inscription supprimée"); } catch (e) { showToast(e.message, true); } }
  async function revokeLicense(id) { if (!confirm("Révoquer cette licence ?")) return; try { await apiFetch("/api/admin/licenses/" + encodeURIComponent(id) + "/revoke", { method: "POST" }); await loadData(); showToast("Licence révoquée"); } catch (e) { showToast(e.message, true); } }
  async function deleteLicense(id) { if (!confirm("Supprimer cette licence non utilisée ?")) return; try { await apiFetch("/api/admin/licenses/" + encodeURIComponent(id), { method: "DELETE" }); await loadData(); showToast("Licence supprimée"); } catch (e) { showToast(e.message, true); } }
  async function createCloudDoctor(id) { if (!confirm("Créer un compte IA pour ce médecin ?")) return; try { var r = await apiFetch("/api/admin/registrations/" + encodeURIComponent(id) + "/create-cloud-doctor", { method: "POST", body: {} }); await loadData(); showToast("Compte IA créé"); if (r.doctor) showCredentials(r.doctor); } catch (e) { showToast(e.message, true); } }

  async function openLogs(id) {
    var row = findDoctor(id);
    el.logsTitle.textContent = row ? row.email : "Journal";
    el.logsRows.innerHTML = '<div class="empty">Chargement…</div>';
    el.logsDialog.showModal();
    try {
      var data = await apiFetch("/api/admin/doctors/" + encodeURIComponent(id) + "/logs");
      var logs = data.rows || [];
      if (!logs.length) { el.logsRows.innerHTML = '<div class="empty">Aucune requête enregistrée.</div>'; return; }
      el.logsRows.innerHTML = logs.map(function (l) {
        return '<div class="log-row"><span class="subtle">' + escapeHtml((l.created_at || "").replace("T"," ").slice(0,16)) + '</span><strong>' + escapeHtml(l.action_type || "") + '</strong>' +
          badge(l.success ? "green" : "red", String(l.credits_used || 0) + " req.") +
          '<span class="subtle">' + escapeHtml(l.details || "") + '</span></div>';
      }).join("");
    } catch (e) { el.logsRows.innerHTML = '<div class="empty">' + escapeHtml(e.message) + '</div>'; }
  }

  function copyText(v) {
    v = String(v || ""); if (!v) return;
    (navigator.clipboard ? navigator.clipboard.writeText(v) : Promise.reject()).then(function () { showToast("Copié"); }).catch(function () {
      var t = document.createElement("textarea"); t.value = v; document.body.appendChild(t); t.select(); document.execCommand("copy"); document.body.removeChild(t); showToast("Copié");
    });
  }

  function handleTableClick(e, map) {
    var btn = e.target.closest("button[data-action]");
    if (!btn) return;
    var fn = map[btn.dataset.action];
    if (fn) fn(btn.dataset.id);
  }

  async function doLogin(e) {
    e.preventDefault();
    setBusy(el.loginSubmit, true);
    try {
      var result = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: el.loginUsername.value.trim(), password: el.loginPassword.value })
      }).then(function (r) { return r.json().then(function (d) { if (!r.ok) throw new Error(d.error || "Connexion impossible"); return d; }); });
      saveSession({ token: result.token, username: result.user.username, display_name: result.user.display_name });
      el.userDisplayName.textContent = result.user.display_name || result.user.username;
      el.userAvatar.textContent = (result.user.display_name || result.user.username || "A").charAt(0).toUpperCase();
      showLogin(false);
      await loadData();
      showToast("Bienvenue, " + (result.user.display_name || result.user.username));
    } catch (err) { showToast(err.message, true); }
    finally { setBusy(el.loginSubmit, false); }
  }

  async function doLogout() {
    try { await apiFetch("/api/admin/logout", { method: "POST" }); } catch (e) {}
    saveSession(null);
    el.loginPassword.value = "";
    showLogin(true);
  }

  async function autoConnect() {
    var session = loadSession();
    if (!session || !session.token) { showLogin(true); return; }
    saveSession(session);
    try {
      var me = await apiFetch("/api/admin/me");
      el.userDisplayName.textContent = me.user.display_name || me.user.username;
      el.userAvatar.textContent = (me.user.display_name || me.user.username || "A").charAt(0).toUpperCase();
      showLogin(false);
      await loadData();
    } catch (e) {
      saveSession(null);
      showLogin(true);
    }
  }

  function bindEvents() {
    el.loginForm.addEventListener("submit", doLogin);
    el.logoutButton.addEventListener("click", doLogout);
    el.refreshButton.addEventListener("click", function () { loadData().then(function () { showToast("Actualisé"); }).catch(function (e) { showToast(e.message, true); }); });
    el.sidebarNav.addEventListener("click", function (e) { var n = e.target.closest(".nav-item"); if (n) setView(n.dataset.view); });
    el.newLicenseButtonAlt.addEventListener("click", function () { openLicenseDialog(""); });
    el.newKeyButton.addEventListener("click", function () { openKeyDialog(null); });
    el.newDoctorButton.addEventListener("click", function () { openDoctorDialog(null); });
    el.licenseForm.addEventListener("submit", saveLicense);
    el.keyForm.addEventListener("submit", saveKey);
    el.doctorForm.addEventListener("submit", saveDoctor);
    el.licenseType.addEventListener("change", syncTrialDays);
    el.keyProvider.addEventListener("change", function () { if (!state.editingKeyId) el.keyModel.value = defaultModel(el.keyProvider.value); });
    el.regSearchInput.addEventListener("input", function () { state.regQuery = el.regSearchInput.value; renderRegistrations(); });
    el.regStatusFilter.addEventListener("change", function () { state.regStatusFilter = el.regStatusFilter.value; renderRegistrations(); });
    el.licenseSearchInput.addEventListener("input", function () { state.licenseQuery = el.licenseSearchInput.value; renderLicenses(); });
    el.licenseStatusFilter.addEventListener("change", function () { state.licenseStatusFilter = el.licenseStatusFilter.value; renderLicenses(); });
    el.searchInput.addEventListener("input", function () { state.query = el.searchInput.value; renderDoctors(); });
    el.keyFilter.addEventListener("change", function () { state.keyFilter = el.keyFilter.value; renderDoctors(); });
    el.regRows.addEventListener("click", function (e) { handleTableClick(e, { "reg-generate": openLicenseDialog, "reg-cloud-doctor": createCloudDoctor, "reg-delete": deleteRegistration }); });
    el.licenseRows.addEventListener("click", function (e) { handleTableClick(e, { "license-revoke": revokeLicense, "license-delete": deleteLicense }); });
    el.keyRows.addEventListener("click", function (e) { handleTableClick(e, { "edit-key": function (id) { openKeyDialog(findKey(id)); }, "delete-key": deleteKey }); });
    el.doctorRows.addEventListener("click", function (e) { handleTableClick(e, { "edit-doctor": function (id) { openDoctorDialog(findDoctor(id)); }, "logs": openLogs, "delete-doctor": deleteDoctor }); });
    document.addEventListener("click", function (e) {
      var close = e.target.closest("[data-close-dialog]");
      if (close) { var d = byId(close.dataset.closeDialog); if (d && d.open) d.close(); }
      var copy = e.target.closest("[data-copy]");
      if (copy) copyText(byId(copy.dataset.copy).value);
    });
  }

  function init() {
    ["loginScreen","loginForm","loginUsername","loginPassword","loginSubmit","appShell","sidebarNav",
     "userDisplayName","userAvatar","pageKicker","pageTitle","refreshButton","logoutButton","mainContent",
     "licenseMetrics","metrics","regSearchInput","regStatusFilter","regCount","regRows",
     "licenseSearchInput","licenseStatusFilter","licenseCount","licenseRows","newLicenseButtonAlt",
     "newKeyButton","newDoctorButton","keyCount","keyRows","searchInput","keyFilter","doctorCount","doctorRows",
     "licenseDialog","licenseForm","licenseRegistration","licenseType","trialDaysWrap","licenseTrialDays","licenseNote",
     "serialDialog","generatedSerialKey","generatedSerialMeta",
     "keyDialog","keyForm","keyDialogMode","keyDialogTitle","keyId","keyName","keyProvider","keyModel","keySecret","keyActive","clearKeyWrap","clearKeySecret",
     "doctorDialog","doctorForm","doctorDialogMode","doctorDialogTitle","doctorId","doctorEmail","doctorAssignedKey","doctorMonthlyLimit","doctorDailyLimit","doctorActive","doctorAiEnabled","doctorUsageTools","setMonthlyUsed","setDailyUsed","resetMonthly","resetDaily",
     "logsDialog","logsTitle","logsRows","credentialsDialog","createdDoctorId","createdDoctorSecret","toast"
    ].forEach(function (id) { el[id] = byId(id); });
    bindEvents();
    setView("dashboard");
    autoConnect();
  }

  document.addEventListener("DOMContentLoaded", init);
})();`;
