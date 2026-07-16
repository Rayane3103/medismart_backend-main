export const ADMIN_HTML = `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>MediSmart Admin</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/admin.css?v=__ASSET_VERSION__">
  <script defer src="/admin.js?v=__ASSET_VERSION__"></script>
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
        <button type="button" class="nav-item active" data-view="dashboard">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
          <span>Tableau de bord</span>
        </button>
        <button type="button" class="nav-item" data-view="registrations">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          <span>Inscriptions</span>
        </button>
        <button type="button" class="nav-item" data-view="licenses">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
          <span>Licences</span>
        </button>
        <button type="button" class="nav-item" data-view="updates">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          <span>Mises à jour</span>
        </button>
        <button type="button" class="nav-item" data-view="ai">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a4 4 0 0 1 4 4c0 1.95-1.4 3.58-3.25 3.93L12 22l-.75-12.07A4.001 4.001 0 0 1 12 2z"/><path d="M8 6H4a2 2 0 0 0-2 2v1"/><path d="M16 6h4a2 2 0 0 1 2 2v1"/></svg>
          <span>IA &amp; Médecins</span>
        </button>
      </nav>
      <div class="sidebar-foot">
        <div class="sidebar-user">
          <span class="user-avatar" id="userAvatar">A</span>
          <div class="sidebar-user-text">
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
        <div class="topbar-progress hidden" id="topbarProgress" role="status" aria-label="Actualisation en cours"><i></i></div>
      </header>

      <main class="main-content">
        <div class="view" id="view-dashboard">
          <section class="stat-grid" id="licenseMetrics"></section>
          <section class="stat-grid stat-grid--compact" id="updateMetrics"></section>
          <section class="stat-grid stat-grid--compact" id="metrics"></section>
          <section class="panel panel--hint">
            <h3>Bienvenue sur l'administration MediSmart</h3>
            <p>Gérez les inscriptions, licences, mises à jour desktop (obligatoires / payantes) et l'accès IA.</p>
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

        <div class="view hidden" id="view-updates">
          <div class="toolbar toolbar--actions">
            <button type="button" class="btn primary" id="importGithubReleaseButton">Importer depuis GitHub</button>
            <button type="button" class="btn ghost" id="newReleaseButton">Configurer manuellement</button>
          </div>
          <p class="subtle" style="padding:0 4px 12px">Normalement : taguez une version sur GitHub → le build arrive ici automatiquement. Puis choisissez Obligatoire/Payante et Publier.</p>
          <section class="panel">
            <div class="panel-head">
              <h2>Releases desktop</h2>
              <span id="releaseCount" class="panel-count">0</span>
            </div>
            <div class="table-wrap" id="releaseRows"></div>
          </section>
          <section class="panel" style="margin-top:16px">
            <div class="panel-head">
              <h2>Télémétrie versions</h2>
              <span id="telemetryCount" class="panel-count">0</span>
            </div>
            <p class="subtle" style="padding:0 18px 8px">Versions installées remontées par les apps (sans données cliniques).</p>
            <div class="table-wrap" id="telemetryRows"></div>
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
        <div><p class="kicker">Clé générée</p><h2>Clé d'activation créée</h2></div>
        <button class="icon-close" type="button" data-close-dialog="serialDialog" aria-label="Fermer">×</button>
      </header>
      <div class="alert alert--ok">La clé est enregistrée et reste visible dans l'onglet Licences.</div>
      <div class="copy-row">
        <input id="generatedSerialKey" readonly class="serial-input">
        <button class="btn ghost" type="button" data-copy="generatedSerialKey">Copier</button>
      </div>
      <p class="subtle" id="generatedSerialMeta"></p>
      <footer class="modal-foot"><button class="btn primary" type="button" data-close-dialog="serialDialog">Terminé</button></footer>
    </div>
  </dialog>

  <dialog class="modal" id="licenseEditDialog">
    <form class="modal-card" id="licenseEditForm">
      <header class="modal-head">
        <div><p class="kicker">Licence</p><h2>Modifier la licence</h2></div>
        <button class="icon-close" type="button" data-close-dialog="licenseEditDialog" aria-label="Fermer">×</button>
      </header>
      <input id="licenseEditId" type="hidden">
      <div class="form-grid">
        <label class="full"><span>Clé d'activation</span>
          <div class="copy-row">
            <input id="licenseEditSerial" readonly class="serial-input">
            <button class="btn ghost" type="button" data-copy="licenseEditSerial">Copier</button>
          </div>
        </label>
        <label><span>Statut</span><input id="licenseEditStatus" readonly></label>
        <label><span>Expire le</span><input id="licenseEditExpires" readonly placeholder="—"></label>
        <label><span>Médecin / inscription</span><select id="licenseEditRegistration"><option value="">Non liée (tout compte)</option></select></label>
        <label><span>Type de licence</span><select id="licenseEditType"><option value="lifetime">À vie</option><option value="trial">Essai gratuit</option></select></label>
        <label class="hidden" id="licenseEditTrialWrap"><span>Durée de l'essai (jours)</span><input id="licenseEditTrialDays" type="number" min="1" max="3650"></label>
        <label class="full"><span>Note (optionnel)</span><input id="licenseEditNote" placeholder="Réf. paiement, remarque…"></label>
      </div>
      <p class="subtle">Après modification (ex. essai → à vie), le médecin peut ressaisir la même clé dans Configuration → Activation pour mettre à jour l'application.</p>
      <footer class="modal-foot"><button class="btn ghost" type="button" data-close-dialog="licenseEditDialog">Annuler</button><button class="btn primary" type="submit">Enregistrer</button></footer>
    </form>
  </dialog>

  <dialog class="modal" id="releaseDialog">
    <form class="modal-card" id="releaseForm">
      <header class="modal-head">
        <div><p class="kicker" id="releaseDialogMode">Configurer</p><h2 id="releaseDialogTitle">Mise à jour</h2></div>
        <button class="icon-close" type="button" data-close-dialog="releaseDialog" aria-label="Fermer">×</button>
      </header>
      <input id="releaseId" type="hidden">
      <input id="releaseVersion" type="hidden">
      <input id="releaseChannel" type="hidden" value="stable">
      <input id="releaseSku" type="hidden" value="premium_2026">
      <input id="releaseArtifactUrl" type="hidden">
      <input id="releaseArtifactSignature" type="hidden">
      <input id="releaseMigrationRisk" type="hidden" value="low">
      <p class="subtle" id="releaseAutoHint" style="margin:0 0 12px">Version, fichier et signature viennent du build GitHub. Vous choisissez seulement le type et le déploiement.</p>
      <div class="form-grid">
        <label><span>Version</span><input id="releaseVersionDisplay" readonly></label>
        <label><span>Type de mise à jour</span>
          <select id="releaseSeverity">
            <option value="mandatory">Obligatoire (tous les médecins)</option>
            <option value="paid">Payante (après activation manuelle)</option>
            <option value="paid_mandatory">Payante + obligatoire</option>
          </select>
        </label>
        <label><span>Déploiement %</span><input id="releaseRollout" type="number" min="0" max="100" value="100"></label>
        <label><span>Publier maintenant ?</span>
          <select id="releaseStatus">
            <option value="published">Oui — visible pour les apps</option>
            <option value="draft">Non — brouillon</option>
            <option value="yanked">Retirer</option>
          </select>
        </label>
        <label class="full"><span>Message court (optionnel)</span><input id="releaseNotes" placeholder="Correctif sécurité…"></label>
      </div>
      <footer class="modal-foot"><button class="btn ghost" type="button" data-close-dialog="releaseDialog">Annuler</button><button class="btn primary" type="submit">Enregistrer</button></footer>
    </form>
  </dialog>

  <dialog class="modal" id="entitlementDialog">
    <form class="modal-card" id="entitlementForm">
      <header class="modal-head">
        <div><p class="kicker">Après paiement</p><h2>Activer la mise à jour payante</h2></div>
        <button class="icon-close" type="button" data-close-dialog="entitlementDialog" aria-label="Fermer">×</button>
      </header>
      <input id="entitlementRegId" type="hidden">
      <input id="entitlementSku" type="hidden" value="premium_2026">
      <input id="entitlementChannel" type="hidden" value="stable">
      <p class="subtle" id="entitlementRegLabel" style="margin:0 0 12px"></p>
      <div class="form-grid">
        <label class="full"><span>Note interne (optionnel)</span><input id="entitlementNote" placeholder="Virement reçu le…"></label>
      </div>
      <footer class="modal-foot"><button class="btn ghost" type="button" data-close-dialog="entitlementDialog">Annuler</button><button class="btn primary" type="submit">Activer</button></footer>
    </form>
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

  <dialog class="modal" id="cloudDoctorDialog">
    <div class="modal-card">
      <header class="modal-head">
        <div>
          <p class="kicker">Inscription</p>
          <h2>Créer un compte IA</h2>
        </div>
        <button class="icon-close" type="button" data-close-dialog="cloudDoctorDialog" aria-label="Fermer">×</button>
      </header>
      <p class="subtle" style="margin-bottom:14px">Configurez l'accès IA maintenant ou utilisez les valeurs par défaut. Vous pourrez modifier le compte plus tard dans <strong>IA &amp; Médecins</strong>.</p>
      <div class="panel panel--hint" style="margin-bottom:14px;padding:14px 16px">
        <div class="cell-title" id="cloudDoctorRegName">—</div>
        <div class="cell-sub" id="cloudDoctorRegEmail"></div>
      </div>
      <div class="form-grid">
        <label><span>Clé API assignée</span><select id="cloudDoctorAssignedKey"></select></label>
        <label><span>Limite requêtes / mois</span><input id="cloudDoctorMonthlyLimit" type="number" min="0" step="1"></label>
        <label><span>Limite requêtes / jour</span><input id="cloudDoctorDailyLimit" type="number" min="0" step="1"></label>
      </div>
      <div class="checks">
        <label class="check"><input id="cloudDoctorActive" type="checkbox" checked><span>Compte actif</span></label>
        <label class="check"><input id="cloudDoctorAiEnabled" type="checkbox" checked><span>IA activée</span></label>
      </div>
      <footer class="modal-foot">
        <button class="btn ghost" type="button" data-close-dialog="cloudDoctorDialog">Annuler</button>
        <button class="btn ghost" type="button" id="cloudDoctorSkip">Défauts (sans configurer)</button>
        <button class="btn primary" type="button" id="cloudDoctorSubmit">Créer le compte IA</button>
      </footer>
    </div>
  </dialog>

  <dialog class="modal" id="credentialsDialog">
    <div class="modal-card">
      <header class="modal-head">
        <div><p class="kicker">Connexion</p><h2>Accès IA automatique</h2></div>
        <button class="icon-close" type="button" data-close-dialog="credentialsDialog" aria-label="Fermer">×</button>
      </header>
      <p class="subtle">Les médecins n'ont plus besoin de Doctor ID ni de secret. L'application desktop se connecte automatiquement après activation de licence, si vous avez créé le compte IA et assigné une clé API.</p>
      <div class="copy-row"><label><span>Référence interne</span><input id="createdDoctorId" readonly></label></div>
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
  --bg-sidebar: linear-gradient(180deg, #1e3a8a 0%, #1d4ed8 100%);
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
.login-brand { display: flex; align-items: center; gap: 12px; margin-bottom: 22px; }
.login-logo { width: 48px; height: 48px; border-radius: 8px; object-fit: cover; background: #fff; box-shadow: 0 12px 28px rgba(0,0,0,.18); flex-shrink: 0; }
.login-brand strong { display: block; font-size: 16px; font-weight: 800; letter-spacing: -.01em; }
.login-brand span { color: var(--muted); font-size: 11px; font-weight: 500; }
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

/* Shell — matches desktop nav-sidebar */
.app-shell { display: grid; grid-template-columns: 224px 1fr; min-height: 100vh; }
.sidebar { background: var(--bg-sidebar); color: #e2e8f0; display: flex; flex-direction: column; position: sticky; top: 0; height: 100vh; border-right: 1px solid rgba(255,255,255,.08); }
.sidebar-brand { display: flex; align-items: center; gap: 10px; height: 58px; padding: 0 16px; border-bottom: 1px solid rgba(255,255,255,.08); flex-shrink: 0; }
.sidebar-logo { width: 32px; height: 32px; border-radius: 8px; object-fit: cover; flex-shrink: 0; box-shadow: 0 6px 14px rgba(37,99,235,.18); }
.sidebar-brand strong { display: block; color: #fff; font-size: 13px; font-weight: 800; letter-spacing: -.01em; line-height: 1.2; }
.sidebar-brand small { color: rgba(255,255,255,.6); font-size: 9.5px; font-weight: 500; }
.sidebar-nav { display: flex; flex-direction: column; gap: 4px; flex: 1; padding: 16px 10px; overflow-y: auto; }
.nav-item { display: flex; align-items: center; gap: 10px; width: 100%; padding: 10px 12px; border: 0; border-radius: 10px; background: transparent; color: rgba(255,255,255,.78); font-weight: 500; font-size: 13px; cursor: pointer; text-align: left; transition: background .15s, color .15s; }
.nav-item:hover { background: rgba(255,255,255,.1); color: #fff; }
.nav-item.active { background: #fff; color: #1e40af; font-weight: 600; box-shadow: 0 8px 20px rgba(0,0,0,.18); }
.nav-item.active .nav-icon { color: #2563eb; opacity: 1; }
.nav-icon { width: 18px; height: 18px; flex-shrink: 0; opacity: .85; stroke: currentColor; }
.sidebar-foot { border-top: 1px solid rgba(255,255,255,.08); padding: 12px 14px; flex-shrink: 0; }
.sidebar-user { display: flex; align-items: center; gap: 10px; }
.user-avatar { width: 30px; height: 30px; border-radius: 8px; background: rgba(255,255,255,.15); color: #fff; display: grid; place-items: center; font-weight: 700; font-size: 12px; flex-shrink: 0; }
.sidebar-user-text strong { display: block; color: #fff; font-size: 12px; font-weight: 600; }
.sidebar-user-text small { color: rgba(255,255,255,.55); font-size: 10px; }

.main-wrap { min-width: 0; display: flex; flex-direction: column; }
.topbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 22px 28px 12px; background: var(--card); border-bottom: 1px solid var(--line); position: sticky; top: 0; z-index: 5; }
.page-kicker { margin: 0; font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--primary); }
.page-title { margin: 4px 0 0; font-size: 26px; letter-spacing: -.02em; }
.topbar-actions { display: flex; gap: 10px; flex-wrap: wrap; }
.main-content { padding: 22px 28px 40px; flex: 1; }

.btn { min-height: 40px; padding: 0 16px; border-radius: 10px; border: 1px solid transparent; font-weight: 700; font-size: 13px; cursor: pointer; white-space: nowrap; }
.btn.primary { background: var(--primary); color: #fff; }
.btn.primary:hover:not(:disabled) { background: var(--primary-hover); }
.btn.ghost { background: #fff; border-color: var(--line); color: var(--text); }
.btn.ghost:hover:not(:disabled) { background: #f8fafc; }
.btn.danger { background: var(--danger-bg); color: var(--danger); border-color: #fecaca; }
.btn:disabled { opacity: .55; cursor: not-allowed; }
.danger-text { color: var(--danger); }

/* Busy buttons: the label stays in place but hidden so the button keeps its
   exact width, and the spinner sits centred on top. Nothing reflows on click. */
.btn.is-busy { position: relative; cursor: progress; }
.btn.is-busy .btn-label { visibility: hidden; }
.btn.is-busy .spinner { position: absolute; top: 50%; left: 50%; margin: -7px 0 0 -7px; }
.spinner {
  width: 14px; height: 14px; flex-shrink: 0; border-radius: 50%;
  border: 2px solid currentColor; border-top-color: transparent;
  animation: spin .6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Indeterminate bar under the topbar during a background refresh. */
.topbar-progress { position: absolute; left: 0; right: 0; bottom: -1px; height: 2px; overflow: hidden; background: transparent; }
.topbar-progress.hidden { display: none !important; }
.topbar-progress i { position: absolute; inset: 0; display: block; width: 40%; background: var(--primary); border-radius: 2px; animation: slide 1.1s ease-in-out infinite; }
@keyframes slide { 0% { left: -40%; } 100% { left: 100%; } }

/* Skeletons: shown while a section's first fetch is still in flight, so the
   panel never flashes a false "no results" state before the data lands. */
.skeleton { background: linear-gradient(90deg, #eef2f7 25%, #f8fafc 37%, #eef2f7 63%); background-size: 400% 100%; animation: shimmer 1.3s ease-in-out infinite; border-radius: 6px; }
@keyframes shimmer { 0% { background-position: 100% 50%; } 100% { background-position: 0 50%; } }
.sk-line { height: 11px; margin: 6px 0; }
.sk-cell-title { height: 13px; width: 62%; margin-bottom: 8px; }
.sk-cell-sub { height: 10px; width: 40%; }
.sk-pill { height: 22px; width: 74px; border-radius: 999px; }
.sk-stat strong { display: block; height: 28px; width: 64px; }
.stat-card.is-loading span { opacity: .55; }

@media (prefers-reduced-motion: reduce) {
  .spinner, .skeleton, .topbar-progress i { animation-duration: 0s; }
  .skeleton { background: #eef2f7; }
}

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
.form-grid .full { grid-column: 1 / -1; }
.checks { display: flex; flex-wrap: wrap; gap: 14px; margin: 14px 0; }
.check { display: inline-flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: var(--text); }
.check input { width: 16px; height: 16px; min-height: 16px; }
.modal-foot { display: flex; justify-content: flex-end; gap: 10px; margin-top: 18px; padding-top: 16px; border-top: 1px solid var(--line); }
.alert { padding: 12px 14px; border-radius: 10px; font-size: 13px; line-height: 1.45; margin-bottom: 14px; }
.alert--warn { background: var(--warning-bg); color: #92400e; border: 1px solid #fde68a; }
.alert--ok { background: #ecfdf5; color: #166534; border: 1px solid #bbf7d0; }
.copy-row { display: grid; grid-template-columns: 1fr auto; gap: 10px; align-items: end; margin-bottom: 10px; }
.form-grid textarea { width: 100%; border: 1px solid var(--line); border-radius: 10px; padding: 10px 12px; font: inherit; resize: vertical; min-height: 72px; box-sizing: border-box; }
.subtle { color: var(--muted); font-size: 12.5px; line-height: 1.45; }
.logs-list { display: grid; gap: 8px; max-height: 60vh; overflow: auto; }
.log-row { display: grid; grid-template-columns: 130px 100px 70px 1fr; gap: 10px; align-items: center; padding: 10px 12px; border: 1px solid var(--line); border-radius: 10px; font-size: 12.5px; }
.toast { position: fixed; right: 18px; bottom: 18px; max-width: 360px; background: #0f172a; color: #fff; padding: 12px 16px; border-radius: 12px; font-weight: 700; font-size: 13px; box-shadow: var(--shadow); z-index: 100; }

@media (max-width: 960px) {
  .app-shell { grid-template-columns: 1fr; }
  .sidebar { position: relative; height: auto; }
  .sidebar-nav { flex-direction: row; flex-wrap: wrap; padding: 10px; }
  .nav-item { width: auto; flex: 1 1 calc(50% - 8px); min-width: 140px; }
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
    updates: { kicker: "Desktop", title: "Mises à jour" },
    ai: { kicker: "Intelligence artificielle", title: "IA & Médecins" }
  };

  var REG_STATUS = { pending_activation: "En attente", activated: "Activé" };
  var LIC_STATUS = { generated: "Disponible", used: "Utilisée", revoked: "Révoquée" };
  var REL_SEVERITY = { mandatory: "Obligatoire", paid: "Payante", paid_mandatory: "Payante + obligatoire" };
  var REL_STATUS = { draft: "Brouillon", published: "Publiée", yanked: "Retirée" };

  var state = {
    session: null,
    view: "dashboard",
    rows: [], apiKeys: [], providers: {}, defaults: { monthly_limit: 500, daily_limit: 50 },
    query: "", keyFilter: "all",
    registrations: [], licenses: [], stats: {},
    releases: [], updateStats: {}, heartbeats: [],
    regQuery: "", regStatusFilter: "all",
    licenseQuery: "", licenseStatusFilter: "all",
    editingDoctorId: "", editingKeyId: "", editingLicenseId: "", editingReleaseId: "",
    pendingCloudDoctorRegistrationId: "", pendingEntitlementRegId: "",
    // True until a section's first fetch resolves. Drives skeletons, so a panel
    // shows placeholders rather than a misleading "nothing here" while loading.
    loading: { doctors: true, registrations: true, licenses: true, releases: true, telemetry: true },
    refreshing: false
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
    var res;
    try {
      res = await fetch(path, {
        method: options.method || "GET",
        headers: headers,
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined
      });
    } catch (e) {
      throw new Error("Serveur injoignable — vérifiez votre connexion.");
    }
    var data = await res.json().catch(function () { return {}; });
    if (!res.ok) {
      var error = new Error(data.error || res.statusText || "Erreur");
      // An expired or revoked session can surface from any call, so handle it
      // in one place instead of leaving the panel showing empty tables.
      if (res.status === 401) { error.authExpired = true; handleAuthExpired(); }
      throw error;
    }
    return data;
  }

  function handleAuthExpired() {
    if (!state.session) return;
    saveSession(null);
    showLogin(true);
    showToast("Session expirée — reconnectez-vous.", true);
  }

  // Shows a spinner inside the button while its action runs. The label stays in
  // the DOM (just hidden) and the spinner is overlaid on top, so the button
  // keeps its exact size — a spinner added beside the text would widen small
  // row buttons and shift the whole row.
  function setBusy(btn, busy) {
    if (!btn) return;
    if (busy) {
      if (btn.__busy) return;
      btn.__busy = true;
      btn.__label = btn.innerHTML;
      btn.disabled = true;
      btn.setAttribute("aria-busy", "true");
      btn.classList.add("is-busy");
      btn.innerHTML = '<span class="btn-label">' + btn.__label + '</span><span class="spinner"></span>';
    } else {
      if (!btn.__busy) return;
      btn.__busy = false;
      btn.disabled = false;
      btn.removeAttribute("aria-busy");
      btn.classList.remove("is-busy");
      if (btn.__label != null) btn.innerHTML = btn.__label;
      delete btn.__label;
    }
  }

  // Runs an async action with the button locked and spinning for its full
  // duration. Every click that hits the network goes through this, so no
  // button can look idle while work is in flight.
  async function runBusy(btn, action) {
    setBusy(btn, true);
    try { return await action(); }
    finally { setBusy(btn, false); }
  }

  // A network action triggered from a button: spinner while it runs, toast on
  // success or failure. Returns true when it succeeded.
  async function runAction(btn, action, successMsg) {
    try {
      await runBusy(btn, action);
      if (successMsg) showToast(successMsg);
      return true;
    } catch (e) {
      showToast((e && e.message) || "Erreur", true);
      return false;
    }
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
    ["dashboard","registrations","licenses","updates","ai"].forEach(function (name) {
      var panel = byId("view-" + name);
      if (panel) panel.classList.toggle("hidden", name !== view);
    });
  }

  // ---- loading placeholders -------------------------------------------------

  function skeletonRows(columns, rows) {
    var body = "";
    for (var r = 0; r < rows; r++) {
      var cells = "";
      for (var c = 0; c < columns; c++) {
        cells += '<td><div class="skeleton sk-cell-title"></div><div class="skeleton sk-cell-sub"></div></td>';
      }
      body += "<tr>" + cells + "</tr>";
    }
    return body;
  }

  function skeletonTable(headers, rows) {
    var head = headers.map(function (h) { return "<th>" + escapeHtml(h) + "</th>"; }).join("");
    return '<table class="data-table" aria-busy="true"><thead><tr>' + head + "</tr></thead><tbody>"
      + skeletonRows(headers.length, rows || 4) + "</tbody></table>";
  }

  function skeletonStats(labels) {
    return labels.map(function (label) {
      return '<article class="stat-card is-loading"><span>' + escapeHtml(label)
        + '</span><strong class="skeleton sk-stat"></strong></article>';
    }).join("");
  }

  function setRefreshing(on) {
    state.refreshing = on;
    if (el.topbarProgress) el.topbarProgress.classList.toggle("hidden", !on);
  }

  // ---- data loading ---------------------------------------------------------
  //
  // The five endpoints are independent, so each one renders its own section the
  // moment it lands instead of every panel waiting on the slowest response.

  function applyDoctors(data) {
    state.rows = data.rows || [];
    state.apiKeys = data.api_keys || [];
    state.providers = data.providers || {};
    state.defaults = data.default_limits || state.defaults;
    state.loading.doctors = false;
    renderProviderOptions();
    renderKeyFilter();
    renderDoctorKeyOptions();
    renderMetrics();
    renderKeys();
    renderDoctors();
  }

  function applyRegistrations(data) {
    state.registrations = data.rows || [];
    if (data.stats) state.stats = data.stats;
    state.loading.registrations = false;
    renderLicenseMetrics();
    renderRegistrations();
    // Telemetry rows resolve doctor names through the registration list.
    if (!state.loading.telemetry) renderTelemetry();
  }

  function applyLicenses(data) {
    state.licenses = data.rows || [];
    if (data.stats) state.stats = data.stats;
    state.loading.licenses = false;
    renderLicenseMetrics();
    renderLicenses();
  }

  function applyReleases(data) {
    state.releases = data.rows || [];
    if (data.stats) state.updateStats = data.stats;
    state.loading.releases = false;
    renderUpdateMetrics();
    renderReleases();
  }

  function applyTelemetry(data) {
    state.heartbeats = data.rows || [];
    if (data.stats) state.updateStats = data.stats;
    state.loading.telemetry = false;
    renderUpdateMetrics();
    renderTelemetry();
  }

  var SECTIONS = [
    { key: "doctors", path: "/api/admin/doctors", apply: applyDoctors },
    { key: "registrations", path: "/api/admin/registrations", apply: applyRegistrations },
    { key: "licenses", path: "/api/admin/licenses", apply: applyLicenses },
    { key: "releases", path: "/api/admin/releases", apply: applyReleases },
    { key: "telemetry", path: "/api/admin/update-telemetry", apply: applyTelemetry }
  ];

  // Resolves once every section has settled. Rejects only if all of them failed,
  // so one broken endpoint cannot blank the whole panel.
  async function loadData() {
    setRefreshing(true);
    var failures = [];
    try {
      await Promise.all(SECTIONS.map(function (section) {
        return apiFetch(section.path).then(function (data) {
          section.apply(data);
        }).catch(function (e) {
          failures.push({ key: section.key, error: e });
          // Clear the skeleton: the section is no longer loading, it failed.
          state.loading[section.key] = false;
          renderAll();
        });
      }));
    } finally {
      setRefreshing(false);
    }
    if (failures.length === SECTIONS.length) throw failures[0].error;
    // An expired session already redirected to login and said so.
    var reportable = failures.filter(function (f) { return !f.error.authExpired; });
    if (reportable.length) {
      showToast("Certaines données n'ont pas pu être chargées (" + reportable[0].error.message + ")", true);
    }
  }

  function renderAll() {
    renderProviderOptions();
    renderKeyFilter();
    renderDoctorKeyOptions();
    renderLicenseMetrics();
    renderUpdateMetrics();
    renderMetrics();
    renderKeys();
    renderDoctors();
    renderRegistrations();
    renderLicenses();
    renderReleases();
    renderTelemetry();
  }

  // Refresh after a mutation. The action already reported success, so failures
  // here only mean the on-screen list may be a moment behind.
  function refreshData() {
    return loadData().catch(function (e) {
      if (!e.authExpired) showToast("Actualisation impossible : " + e.message, true);
    });
  }

  function statCard(label, value, accent) {
    return '<article class="stat-card ' + (accent || "") + '"><span>' + escapeHtml(label) + '</span><strong>' + escapeHtml(value) + '</strong></article>';
  }

  var LICENSE_METRIC_LABELS = ["Inscriptions", "En attente d'activation", "Médecins activés", "Licences générées"];
  var UPDATE_METRIC_LABELS = ["Sur dernière stable", "Releases publiées", "Entitlements actifs", "Échecs / alertes update"];
  var AI_METRIC_LABELS = ["Clés API", "Comptes IA", "Comptes actifs", "Requêtes aujourd'hui", "Requêtes ce mois"];

  function renderLicenseMetrics() {
    if (state.loading.registrations && state.loading.licenses) {
      el.licenseMetrics.innerHTML = skeletonStats(LICENSE_METRIC_LABELS);
      return;
    }
    var s = state.stats || {};
    el.licenseMetrics.innerHTML =
      statCard("Inscriptions", s.registrations_total || 0, "accent-blue") +
      statCard("En attente d'activation", s.registrations_pending || 0, "accent-amber") +
      statCard("Médecins activés", s.registrations_activated || 0, "accent-green") +
      statCard("Licences générées", s.licenses_total || 0, "accent-violet");
  }

  function renderUpdateMetrics() {
    if (!el.updateMetrics) return;
    if (state.loading.releases && state.loading.telemetry) {
      el.updateMetrics.innerHTML = skeletonStats(UPDATE_METRIC_LABELS);
      return;
    }
    var s = state.updateStats || {};
    var failures = (state.heartbeats || []).filter(function (h) {
      return String(h.update_status || "").indexOf("fail") !== -1 || String(h.last_error || "").length > 0;
    }).length;
    el.updateMetrics.innerHTML =
      statCard("Sur dernière stable", s.installs_on_latest_stable || 0, "accent-green") +
      statCard("Releases publiées", s.releases_published || 0, "accent-blue") +
      statCard("Entitlements actifs", s.entitlements_active || 0, "accent-violet") +
      statCard("Échecs / alertes update", failures, "accent-amber");
  }

  function renderMetrics() {
    if (state.loading.doctors) { el.metrics.innerHTML = skeletonStats(AI_METRIC_LABELS); return; }
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
    var html = '<option value="">Aucune clé (à assigner plus tard)</option>';
    state.apiKeys.forEach(function (k) {
      html += '<option value="' + escapeHtml(k.id) + '">' + escapeHtml(k.name) + ' — ' + escapeHtml(k.provider_label) + '</option>';
    });
    el.doctorAssignedKey.innerHTML = html;
    if (el.cloudDoctorAssignedKey) el.cloudDoctorAssignedKey.innerHTML = html;
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
    if (state.loading.doctors) {
      el.keyCount.textContent = "…";
      el.keyRows.innerHTML = skeletonTable(["Clé", "Statut", "Modèle", "Assignée", ""], 3);
      return;
    }
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
    if (state.loading.doctors) {
      el.doctorCount.textContent = "…";
      el.doctorRows.innerHTML = skeletonTable(["Compte", "Connexion", "Clé IA", "Requêtes", ""], 4);
      return;
    }
    var rows = filteredDoctors();
    el.doctorCount.textContent = rows.length;
    if (!rows.length) { el.doctorRows.innerHTML = '<div class="empty">Aucun compte médecin IA.</div>'; return; }
    var html = rows.map(function (r) {
      return '<tr><td><div class="cell-title">' + escapeHtml(r.email || "—") + '</div>' +
        (r.active ? badge("green","Actif") : badge("red","Inactif")) +
        (r.ai_enabled ? badge("blue","IA on") : badge("amber","IA off")) + '</td>' +
        '<td><div class="cell-sub">Connexion automatique</div><div class="cell-sub">App desktop après activation</div></td>' +
        '<td><div class="cell-sub">' + escapeHtml(r.assigned_api_key_name || "Aucune") + '</div><div class="cell-sub">' + escapeHtml(r.ai_provider_label || "") + ' ' + escapeHtml(r.ai_model || "") + '</div></td>' +
        '<td>' + usageBars(r.monthly_used, r.monthly_limit, r.daily_used, r.daily_limit) + '</td>' +
        '<td class="row-actions">' +
          '<button class="btn ghost" type="button" data-action="logs" data-id="' + escapeHtml(r.doctor_id) + '">Journal</button>' +
          '<button class="btn ghost" type="button" data-action="edit-doctor" data-id="' + escapeHtml(r.doctor_id) + '">Modifier</button>' +
          '<button class="btn danger" type="button" data-action="delete-doctor" data-id="' + escapeHtml(r.doctor_id) + '">Supprimer</button>' +
        '</td></tr>';
    }).join("");
    el.doctorRows.innerHTML = '<table class="data-table"><thead><tr><th>Compte</th><th>Connexion</th><th>Clé IA</th><th>Requêtes</th><th></th></tr></thead><tbody>' + html + '</tbody></table>';
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
    if (state.loading.registrations) {
      el.regCount.textContent = "…";
      el.regRows.innerHTML = skeletonTable(["Médecin", "Contact", "Licence", "Updates", ""], 5);
      return;
    }
    var rows = filteredRegistrations();
    el.regCount.textContent = rows.length;
    if (!rows.length) { el.regRows.innerHTML = '<div class="empty">Aucune inscription synchronisée pour le moment.</div>'; return; }
    var html = rows.map(function (r) {
      var st = r.status === "activated" ? badge("green", REG_STATUS.activated) : badge("amber", REG_STATUS.pending_activation);
      var lic = r.license ? '<div class="cell-sub">' + escapeHtml(r.license.key_hint) + ' (' + escapeHtml(r.license.license_type) + ')</div>' : '<div class="cell-sub">Pas encore de licence</div>';
      var skus = (r.update_skus || []).length ? (r.update_skus || []).map(function (s) { return badge("violet", s); }).join(" ") : '<div class="cell-sub">Pas de mise à jour payante</div>';
      return '<tr><td><div class="cell-title">' + escapeHtml(r.full_name || "—") + '</div><div class="cell-sub">' + escapeHtml(r.specialty || "") + (r.wilaya ? " · " + escapeHtml(r.wilaya) : "") + '</div></td>' +
        '<td><div class="cell-sub">' + escapeHtml(r.phone || "") + '</div><div class="cell-sub">' + escapeHtml(r.email || "") + '</div></td>' +
        '<td>' + st + (r.cloud_doctor_id ? badge("violet","IA liée") : "") + lic + '</td>' +
        '<td><div class="cell-sub">Canal : ' + escapeHtml(r.update_channel || "stable") + '</div>' +
        '<div class="cell-sub">App : ' + escapeHtml(r.app_version || "—") + '</div>' + skus + '</td>' +
        '<td class="row-actions">' +
          '<button class="btn ghost" type="button" data-action="reg-generate" data-id="' + escapeHtml(r.id) + '">Générer clé</button>' +
          '<button class="btn primary" type="button" data-action="reg-entitle" data-id="' + escapeHtml(r.id) + '">Activer MAJ payante</button>' +
          ((r.update_skus || []).length ? '<button class="btn danger" type="button" data-action="reg-revoke-entitle" data-id="' + escapeHtml(r.id) + '" data-sku="' + escapeHtml((r.update_skus || [])[0] || "premium_2026") + '">Révoquer MAJ</button>' : "") +
          (r.cloud_doctor_id ? "" : '<button class="btn ghost" type="button" data-action="reg-cloud-doctor" data-id="' + escapeHtml(r.id) + '">Créer compte IA</button>') +
          '<button class="btn danger" type="button" data-action="reg-delete" data-id="' + escapeHtml(r.id) + '">Supprimer</button>' +
        '</td></tr>';
    }).join("");
    el.regRows.innerHTML = '<table class="data-table"><thead><tr><th>Médecin</th><th>Contact</th><th>Licence</th><th>Updates</th><th></th></tr></thead><tbody>' + html + '</tbody></table>';
  }

  function filteredLicenses() {
    var q = state.licenseQuery.trim().toLowerCase();
    return state.licenses.filter(function (r) {
      var ok = state.licenseStatusFilter === "all" || r.status === state.licenseStatusFilter;
      var hay = [r.serial_key, r.key_hint, r.registration_name, r.note, r.license_type].join(" ").toLowerCase();
      return ok && (!q || hay.indexOf(q) !== -1);
    });
  }

  function formatLicenseDate(value) {
    if (!value) return "—";
    return String(value).replace("T", " ").replace("+01:00", "").slice(0, 16);
  }

  function renderLicenses() {
    if (state.loading.licenses) {
      el.licenseCount.textContent = "…";
      el.licenseRows.innerHTML = skeletonTable(["Clé", "Type", "Médecin", "Dates", ""], 5);
      return;
    }
    var rows = filteredLicenses();
    el.licenseCount.textContent = rows.length;
    if (!rows.length) { el.licenseRows.innerHTML = '<div class="empty">Aucune licence générée.</div>'; return; }
    var html = rows.map(function (r) {
      var typeBadge = r.license_type === "trial" ? badge("amber", "Essai " + (r.trial_days || "?") + "j") : badge("violet", "À vie");
      var stCls = r.status === "used" ? "green" : r.status === "revoked" ? "red" : "blue";
      var keyDisplay = r.serial_key || r.key_hint || "—";
      var expiryLine = r.license_type === "lifetime"
        ? '<div class="cell-sub">Validité : illimitée</div>'
        : (r.expires_at ? '<div class="cell-sub">Expire : ' + escapeHtml(formatLicenseDate(r.expires_at)) + '</div>' : "");
      return '<tr><td><div class="serial-input" style="font-size:14px">' + escapeHtml(keyDisplay) + '</div>' +
        (!r.serial_key && r.key_hint ? '<div class="cell-sub">Indice seulement (clé non archivée)</div>' : '') +
        '<div class="cell-sub">' + escapeHtml(r.note || "") + '</div></td>' +
        '<td>' + typeBadge + badge(stCls, LIC_STATUS[r.status] || r.status) + '</td>' +
        '<td><div class="cell-sub">' + escapeHtml(r.registration_name || "Non liée") + '</div></td>' +
        '<td><div class="cell-sub">Créée : ' + escapeHtml((r.created_at || "").slice(0,10)) + '</div>' +
        (r.used_at ? '<div class="cell-sub">Utilisée : ' + escapeHtml(formatLicenseDate(r.used_at)) + '</div>' : "") +
        expiryLine + '</td>' +
        '<td class="row-actions">' +
          (keyDisplay !== "—" ? '<button class="btn ghost" type="button" data-action="license-copy" data-id="' + escapeHtml(r.id) + '">Copier</button>' : "") +
          (r.status !== "revoked" ? '<button class="btn ghost" type="button" data-action="license-edit" data-id="' + escapeHtml(r.id) + '">Modifier</button>' : "") +
          (r.status !== "revoked" ? '<button class="btn danger" type="button" data-action="license-revoke" data-id="' + escapeHtml(r.id) + '">Révoquer</button>' : "") +
          (r.status === "generated" ? '<button class="btn danger" type="button" data-action="license-delete" data-id="' + escapeHtml(r.id) + '">Supprimer</button>' : "") +
        '</td></tr>';
    }).join("");
    el.licenseRows.innerHTML = '<table class="data-table"><thead><tr><th>Clé</th><th>Type</th><th>Médecin</th><th>Dates</th><th></th></tr></thead><tbody>' + html + '</tbody></table>';
  }

  function findKey(id) { return state.apiKeys.find(function (k) { return k.id === id; }); }
  function findDoctor(id) { return state.rows.find(function (r) { return r.doctor_id === id; }); }
  function findRegistration(id) { return state.registrations.find(function (r) { return r.id === id; }); }
  function findLicense(id) { return state.licenses.find(function (r) { return r.id === id; }); }
  function findRelease(id) { return state.releases.find(function (r) { return r.id === id; }); }

  function renderReleases() {
    if (!el.releaseRows) return;
    if (state.loading.releases) {
      el.releaseCount.textContent = "…";
      el.releaseRows.innerHTML = skeletonTable(["Version", "Type", "Déploiement", "Date", ""], 3);
      return;
    }
    var rows = state.releases || [];
    el.releaseCount.textContent = rows.length;
    if (!rows.length) { el.releaseRows.innerHTML = '<div class="empty">Aucune release. Cliquez « Importer depuis GitHub » après un tag vX.Y.Z (build Actions terminé), ou attendez l’enregistrement automatique CI.</div>'; return; }
    var html = rows.map(function (r) {
      var sev = REL_SEVERITY[r.severity] || r.severity;
      var stCls = r.status === "published" ? "green" : r.status === "yanked" ? "red" : "amber";
      return '<tr><td><div class="cell-title">v' + escapeHtml(r.version) + '</div><div class="cell-sub">' + escapeHtml(r.channel) + '</div></td>' +
        '<td>' + badge("blue", sev) + badge(stCls, REL_STATUS[r.status] || r.status) +
        (r.sku ? '<div class="cell-sub">SKU : ' + escapeHtml(r.sku) + '</div>' : "") + '</td>' +
        '<td><div class="cell-sub">Rollout : ' + escapeHtml(r.rollout_percent) + '%</div>' +
        '<div class="cell-sub">' + escapeHtml((r.notes || "").slice(0, 80)) + '</div></td>' +
        '<td><div class="cell-sub">' + escapeHtml((r.published_at || r.updated_at || "").slice(0, 16).replace("T", " ")) + '</div></td>' +
        '<td class="row-actions">' +
          '<button class="btn ghost" type="button" data-action="release-edit" data-id="' + escapeHtml(r.id) + '">Modifier</button>' +
          (r.status !== "published" ? '<button class="btn primary" type="button" data-action="release-publish" data-id="' + escapeHtml(r.id) + '">Publier</button>' : "") +
          '<button class="btn danger" type="button" data-action="release-delete" data-id="' + escapeHtml(r.id) + '">Supprimer</button>' +
        '</td></tr>';
    }).join("");
    el.releaseRows.innerHTML = '<table class="data-table"><thead><tr><th>Version</th><th>Type</th><th>Déploiement</th><th>Date</th><th></th></tr></thead><tbody>' + html + '</tbody></table>';
  }

  function renderTelemetry() {
    if (!el.telemetryRows) return;
    if (state.loading.telemetry) {
      el.telemetryCount.textContent = "…";
      el.telemetryRows.innerHTML = skeletonTable(["Médecin", "Version", "Canal", "Statut", "Vu"], 4);
      return;
    }
    var rows = state.heartbeats || [];
    el.telemetryCount.textContent = rows.length;
    if (!rows.length) { el.telemetryRows.innerHTML = '<div class="empty">Aucune télémétrie reçue pour le moment.</div>'; return; }
    var html = rows.map(function (h) {
      var reg = findRegistration(h.registration_id);
      return '<tr><td><div class="cell-title">' + escapeHtml(reg ? reg.full_name : h.registration_id) + '</div></td>' +
        '<td>' + escapeHtml(h.app_version || "—") + '</td>' +
        '<td>' + escapeHtml(h.channel || "—") + '</td>' +
        '<td><div class="cell-sub">' + escapeHtml(h.update_status || "—") + '</div>' +
        (h.last_error ? '<div class="cell-sub">' + escapeHtml(h.last_error) + '</div>' : "") + '</td>' +
        '<td class="cell-sub">' + escapeHtml((h.reported_at || "").slice(0, 16).replace("T", " ")) + '</td></tr>';
    }).join("");
    el.telemetryRows.innerHTML = '<table class="data-table"><thead><tr><th>Médecin</th><th>Version</th><th>Canal</th><th>Statut</th><th>Vu</th></tr></thead><tbody>' + html + '</tbody></table>';
  }

  async function importGithubRelease() {
    setBusy(el.importGithubReleaseButton, true);
    showToast("Import GitHub en cours…");
    try {
      var result = await apiFetch("/api/admin/releases/import-github", { method: "POST", body: {} });
      if (result.release) openReleaseDialog(result.release);
      showToast(result.created ? "Release importée depuis GitHub" : "Release déjà connue — configurez-la");
      refreshData();
    } catch (e) {
      showToast((e && e.message) ? e.message : "Import impossible", true);
    } finally {
      setBusy(el.importGithubReleaseButton, false);
    }
  }

  function openReleaseDialog(release) {
    state.editingReleaseId = release ? release.id : "";
    el.releaseForm.reset();
    el.releaseDialogMode.textContent = release ? "Configurer" : "Configurer";
    el.releaseDialogTitle.textContent = release ? ("v" + release.version) : "Mise à jour";
    el.releaseId.value = release ? release.id : "";
    el.releaseVersion.value = release ? release.version : "";
    el.releaseVersionDisplay.value = release ? ("v" + release.version) : "(importez depuis GitHub)";
    el.releaseChannel.value = release ? release.channel : "stable";
    el.releaseSeverity.value = release ? release.severity : "mandatory";
    el.releaseSku.value = release ? (release.sku || "premium_2026") : "premium_2026";
    el.releaseRollout.value = release ? release.rollout_percent : 100;
    el.releaseStatus.value = release ? (release.status === "draft" ? "draft" : release.status === "yanked" ? "yanked" : "published") : "published";
    el.releaseNotes.value = release ? (release.notes || "") : "";
    el.releaseArtifactUrl.value = release ? (release.artifact_url || "") : "";
    el.releaseArtifactSignature.value = release ? (release.artifact_signature || "") : "";
    el.releaseMigrationRisk.value = release ? (release.migration_risk || "low") : "low";
    var hasArtifacts = Boolean(el.releaseArtifactUrl.value && el.releaseArtifactSignature.value);
    el.releaseAutoHint.textContent = hasArtifacts
      ? ("Fichier et signature déjà présents pour v" + el.releaseVersion.value + ". Choisissez seulement le type et le déploiement.")
      : "Importez d'abord depuis GitHub (bouton en haut), ou attendez le build CI après un tag.";
    el.releaseDialog.showModal();
  }

  async function saveRelease(e) {
    e.preventDefault();
    var btn = el.releaseForm.querySelector('button[type="submit"]');
    setBusy(btn, true);
    try {
      if (!el.releaseVersion.value.trim()) {
        throw new Error("Importez d'abord une release GitHub (version manquante).");
      }
      if (!el.releaseArtifactUrl.value.trim() || !el.releaseArtifactSignature.value.trim()) {
        throw new Error("URL / signature manquantes. Utilisez « Importer depuis GitHub ».");
      }
      var severity = el.releaseSeverity.value;
      var body = {
        version: el.releaseVersion.value.trim(),
        channel: el.releaseChannel.value || "stable",
        severity: severity,
        sku: (severity === "paid" || severity === "paid_mandatory") ? (el.releaseSku.value.trim() || "premium_2026") : "",
        rollout_percent: parseInt(el.releaseRollout.value, 10) || 0,
        status: el.releaseStatus.value,
        notes: el.releaseNotes.value.trim(),
        artifact_url: el.releaseArtifactUrl.value.trim(),
        artifact_signature: el.releaseArtifactSignature.value.trim(),
        migration_risk: el.releaseMigrationRisk.value || "low",
        backup_recommended: (el.releaseMigrationRisk.value || "low") === "high",
      };
      if (state.editingReleaseId) {
        await apiFetch("/api/admin/releases/" + encodeURIComponent(state.editingReleaseId), { method: "PATCH", body: body });
      } else {
        await apiFetch("/api/admin/releases", { method: "POST", body: body });
      }
      el.releaseDialog.close();
      state.editingReleaseId = "";
      showToast("Mise à jour enregistrée");
      refreshData();
    } catch (err) { showToast(err.message, true); }
    finally { setBusy(btn, false); }
  }

  function publishRelease(id, btn) {
    rowAction(btn, "", function () {
      return apiFetch("/api/admin/releases/" + encodeURIComponent(id) + "/publish", { method: "POST" });
    }, "Release publiée");
  }

  function deleteRelease(id, btn) {
    rowAction(btn, "Supprimer cette release ?", function () {
      return apiFetch("/api/admin/releases/" + encodeURIComponent(id), { method: "DELETE" });
    }, "Release supprimée");
  }

  function openEntitlementDialog(regId) {
    var reg = findRegistration(regId);
    if (!reg) { showToast("Inscription introuvable", true); return; }
    state.pendingEntitlementRegId = regId;
    el.entitlementRegId.value = regId;
    el.entitlementRegLabel.textContent = (reg.full_name || "") + " — un clic après confirmation du paiement";
    el.entitlementSku.value = "premium_2026";
    el.entitlementChannel.value = "stable";
    el.entitlementNote.value = "";
    el.entitlementDialog.showModal();
  }

  async function saveEntitlement(e) {
    e.preventDefault();
    var regId = state.pendingEntitlementRegId || el.entitlementRegId.value;
    if (!regId) return;
    var btn = el.entitlementForm.querySelector('button[type="submit"]');
    setBusy(btn, true);
    try {
      await apiFetch("/api/admin/registrations/" + encodeURIComponent(regId) + "/entitlements", {
        method: "POST",
        body: { sku: el.entitlementSku.value.trim() || "premium_2026", note: el.entitlementNote.value.trim() }
      });
      await apiFetch("/api/admin/registrations/" + encodeURIComponent(regId) + "/update-channel", {
        method: "POST",
        body: { channel: el.entitlementChannel.value }
      });
      el.entitlementDialog.close();
      state.pendingEntitlementRegId = "";
      showToast("Mise à jour payante activée");
      refreshData();
    } catch (err) { showToast(err.message, true); }
    finally { setBusy(btn, false); }
  }

  function revokeEntitlement(id, sku, btn) {
    sku = sku || "premium_2026";
    rowAction(btn, "Révoquer l'accès à la mise à jour payante (" + sku + ") ?", function () {
      return apiFetch("/api/admin/registrations/" + encodeURIComponent(id) + "/entitlements/" + encodeURIComponent(sku) + "/revoke", { method: "POST" });
    }, "Entitlement révoqué");
  }

  function openCloudDoctorDialog(regId) {
    var reg = findRegistration(regId);
    if (!reg) { showToast("Inscription introuvable", true); return; }
    if (reg.cloud_doctor_id) { showToast("Un compte IA est déjà lié à cette inscription.", true); return; }
    state.pendingCloudDoctorRegistrationId = regId;
    el.cloudDoctorRegName.textContent = reg.full_name || "—";
    el.cloudDoctorRegEmail.textContent = [reg.specialty, reg.email, reg.phone, reg.wilaya].filter(Boolean).join(" · ") || "—";
    el.cloudDoctorAssignedKey.value = state.apiKeys[0] ? state.apiKeys[0].id : "";
    el.cloudDoctorMonthlyLimit.value = state.defaults.monthly_limit;
    el.cloudDoctorDailyLimit.value = state.defaults.daily_limit;
    el.cloudDoctorActive.checked = true;
    el.cloudDoctorAiEnabled.checked = true;
    el.cloudDoctorDialog.showModal();
  }

  async function submitCloudDoctor(useDefaults) {
    var regId = state.pendingCloudDoctorRegistrationId;
    if (!regId) return;
    var body = {};
    if (!useDefaults) {
      body = {
        assigned_api_key_id: el.cloudDoctorAssignedKey.value,
        monthly_limit: parseInt(el.cloudDoctorMonthlyLimit.value, 10) || 0,
        daily_limit: parseInt(el.cloudDoctorDailyLimit.value, 10) || 0,
        active: el.cloudDoctorActive.checked,
        ai_enabled: el.cloudDoctorAiEnabled.checked,
      };
    }
    setBusy(el.cloudDoctorSubmit, true);
    setBusy(el.cloudDoctorSkip, true);
    try {
      await apiFetch("/api/admin/registrations/" + encodeURIComponent(regId) + "/create-cloud-doctor", { method: "POST", body: body });
      el.cloudDoctorDialog.close();
      state.pendingCloudDoctorRegistrationId = "";
      showToast(useDefaults ? "Compte IA créé (valeurs par défaut)" : "Compte IA créé — connexion automatique activée");
      refreshData();
    } catch (e) { showToast(e.message, true); }
    finally {
      setBusy(el.cloudDoctorSubmit, false);
      setBusy(el.cloudDoctorSkip, false);
    }
  }

  function createCloudDoctor(id) { openCloudDoctorDialog(id); }
  function defaultModel(p) { return state.providers[p] ? state.providers[p].default_model : ""; }

  function openLicenseDialog(regId) {
    el.licenseForm.reset();
    fillLicenseRegistrationSelect(el.licenseRegistration, regId || "");
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

  function syncEditTrialDays() {
    var trial = el.licenseEditType.value === "trial";
    el.licenseEditTrialWrap.classList.toggle("hidden", !trial);
    el.licenseEditTrialDays.required = trial;
  }

  function fillLicenseRegistrationSelect(selectEl, selectedId) {
    var html = '<option value="">Non liée (tout compte)</option>';
    state.registrations.forEach(function (r) {
      html += '<option value="' + escapeHtml(r.id) + '">' + escapeHtml((r.full_name || "?") + (r.specialty ? " — " + r.specialty : "")) + '</option>';
    });
    selectEl.innerHTML = html;
    selectEl.value = selectedId || "";
  }

  function openLicenseEditDialog(id) {
    var lic = findLicense(id);
    if (!lic) { showToast("Licence introuvable", true); return; }
    state.editingLicenseId = id;
    el.licenseEditId.value = lic.id;
    el.licenseEditSerial.value = lic.serial_key || lic.key_hint || "";
    el.licenseEditStatus.value = LIC_STATUS[lic.status] || lic.status || "";
    el.licenseEditExpires.value = lic.license_type === "lifetime"
      ? "Illimitée"
      : formatLicenseDate(lic.expires_at);
    fillLicenseRegistrationSelect(el.licenseEditRegistration, lic.registration_id || "");
    el.licenseEditType.value = lic.license_type === "trial" ? "trial" : "lifetime";
    el.licenseEditTrialDays.value = lic.trial_days || 7;
    el.licenseEditNote.value = lic.note || "";
    syncEditTrialDays();
    el.licenseEditDialog.showModal();
  }

  async function saveLicenseEdit(e) {
    e.preventDefault();
    var id = state.editingLicenseId || el.licenseEditId.value;
    if (!id) return;
    var btn = el.licenseEditForm.querySelector('button[type="submit"]');
    setBusy(btn, true);
    try {
      var body = {
        license_type: el.licenseEditType.value,
        registration_id: el.licenseEditRegistration.value,
        note: el.licenseEditNote.value.trim(),
      };
      if (body.license_type === "trial") {
        body.trial_days = parseInt(el.licenseEditTrialDays.value, 10) || 0;
      }
      var result = await apiFetch("/api/admin/licenses/" + encodeURIComponent(id), { method: "PATCH", body: body });
      el.licenseEditDialog.close();
      state.editingLicenseId = "";
      var lic = result.license || {};
      var msg = lic.license_type === "lifetime"
        ? "Licence mise à jour — à vie"
        : "Licence mise à jour — essai " + (lic.trial_days || "?") + " jours";
      showToast(msg);
      refreshData();
    } catch (err) { showToast(err.message, true); }
    finally { setBusy(btn, false); }
  }

  function copyLicenseKey(id) {
    var lic = findLicense(id);
    if (!lic) return;
    copyText(lic.serial_key || lic.key_hint || "");
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
      // Show the key as soon as the server has it; the table catches up after.
      el.generatedSerialKey.value = result.serial_key || "";
      el.generatedSerialMeta.textContent = result.license ? (result.license.license_type === "trial" ? "Essai " + result.license.trial_days + " jours" : "Licence à vie") : "";
      el.serialDialog.showModal();
      refreshData();
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
      el.keyDialog.close(); showToast("Clé API enregistrée"); refreshData();
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
      var isNew = !state.editingDoctorId;
      if (state.editingDoctorId) result = await apiFetch("/api/admin/doctors/" + encodeURIComponent(state.editingDoctorId), { method: "PATCH", body: body });
      else result = await apiFetch("/api/admin/doctors", { method: "POST", body: body });
      el.doctorDialog.close();
      showToast(isNew && result.doctor
        ? "Compte enregistré — le médecin se connectera automatiquement depuis l'application desktop."
        : "Compte enregistré");
      refreshData();
    } catch (err) { showToast(err.message, true); } finally { setBusy(btn, false); }
  }

  function showCredentials(doctor) {
    el.createdDoctorId.value = doctor.doctor_id || doctor.id || "";
    el.credentialsDialog.showModal();
  }

  // Row actions. Each keeps its button spinning until the request comes back,
  // then refreshes the table in the background.
  async function rowAction(btn, confirmMsg, request, successMsg) {
    if (confirmMsg && !confirm(confirmMsg)) return;
    if (await runAction(btn, request, successMsg)) refreshData();
  }

  function deleteKey(id, btn) {
    rowAction(btn, "Supprimer cette clé API ?", function () {
      return apiFetch("/api/admin/api-keys/" + encodeURIComponent(id), { method: "DELETE" });
    }, "Clé supprimée");
  }

  function deleteDoctor(id, btn) {
    rowAction(btn, "Supprimer ce compte ?", function () {
      return apiFetch("/api/admin/doctors/" + encodeURIComponent(id), { method: "DELETE" });
    }, "Compte supprimé");
  }

  function deleteRegistration(id, btn) {
    rowAction(btn, "Supprimer cette inscription ?", function () {
      return apiFetch("/api/admin/registrations/" + encodeURIComponent(id), { method: "DELETE" });
    }, "Inscription supprimée");
  }

  function revokeLicense(id, btn) {
    rowAction(btn, "Révoquer cette licence ?", function () {
      return apiFetch("/api/admin/licenses/" + encodeURIComponent(id) + "/revoke", { method: "POST" });
    }, "Licence révoquée");
  }

  function deleteLicense(id, btn) {
    rowAction(btn, "Supprimer cette licence non utilisée ?", function () {
      return apiFetch("/api/admin/licenses/" + encodeURIComponent(id), { method: "DELETE" });
    }, "Licence supprimée");
  }

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

  // Passes the clicked button to the handler so it can show its own spinner.
  function handleTableClick(e, map) {
    var btn = e.target.closest("button[data-action]");
    if (!btn || btn.__busy) return;
    var fn = map[btn.dataset.action];
    if (fn) fn(btn.dataset.id, btn);
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
      setCurrentUser(result.user);
      // Reveal the shell with skeletons immediately rather than holding the
      // login button until every table has loaded.
      showLogin(false);
      showToast("Bienvenue, " + (result.user.display_name || result.user.username));
      refreshData();
    } catch (err) { showToast(err.message, true); }
    finally { setBusy(el.loginSubmit, false); }
  }

  function setCurrentUser(user) {
    var label = user.display_name || user.username || "";
    el.userDisplayName.textContent = label;
    el.userAvatar.textContent = (label || "A").charAt(0).toUpperCase();
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

    // Show the shell with skeletons and the remembered identity straight away,
    // and verify the session while the data loads rather than before it. A bad
    // token is caught by the 401 handler, which drops back to login.
    setCurrentUser(session);
    showLogin(false);
    renderAll();

    var data = refreshData();
    try {
      var me = await apiFetch("/api/admin/me");
      setCurrentUser(me.user);
    } catch (e) {
      if (!e.authExpired) { saveSession(null); showLogin(true); }
    }
    await data;
  }

  function bindEvents() {
    el.loginForm.addEventListener("submit", doLogin);
    el.logoutButton.addEventListener("click", function () { runBusy(el.logoutButton, doLogout); });
    el.refreshButton.addEventListener("click", function () {
      runAction(el.refreshButton, loadData, "Actualisé");
    });
    el.sidebarNav.addEventListener("click", function (e) { var n = e.target.closest(".nav-item"); if (n) setView(n.dataset.view); });
    el.newLicenseButtonAlt.addEventListener("click", function () { openLicenseDialog(""); });
    el.importGithubReleaseButton.addEventListener("click", importGithubRelease);
    el.newReleaseButton.addEventListener("click", function () {
      if (!(state.releases || []).length) { showToast("Importez d'abord depuis GitHub", true); return; }
      openReleaseDialog(state.releases[0]);
    });
    el.newKeyButton.addEventListener("click", function () { openKeyDialog(null); });
    el.newDoctorButton.addEventListener("click", function () { openDoctorDialog(null); });
    el.licenseForm.addEventListener("submit", saveLicense);
    el.licenseEditForm.addEventListener("submit", saveLicenseEdit);
    el.releaseForm.addEventListener("submit", saveRelease);
    el.entitlementForm.addEventListener("submit", saveEntitlement);
    el.keyForm.addEventListener("submit", saveKey);
    el.doctorForm.addEventListener("submit", saveDoctor);
    el.cloudDoctorSubmit.addEventListener("click", function () { submitCloudDoctor(false); });
    el.cloudDoctorSkip.addEventListener("click", function () { submitCloudDoctor(true); });
    el.licenseType.addEventListener("change", syncTrialDays);
    el.licenseEditType.addEventListener("change", syncEditTrialDays);
    el.keyProvider.addEventListener("change", function () { if (!state.editingKeyId) el.keyModel.value = defaultModel(el.keyProvider.value); });
    el.regSearchInput.addEventListener("input", function () { state.regQuery = el.regSearchInput.value; renderRegistrations(); });
    el.regStatusFilter.addEventListener("change", function () { state.regStatusFilter = el.regStatusFilter.value; renderRegistrations(); });
    el.licenseSearchInput.addEventListener("input", function () { state.licenseQuery = el.licenseSearchInput.value; renderLicenses(); });
    el.licenseStatusFilter.addEventListener("change", function () { state.licenseStatusFilter = el.licenseStatusFilter.value; renderLicenses(); });
    el.searchInput.addEventListener("input", function () { state.query = el.searchInput.value; renderDoctors(); });
    el.keyFilter.addEventListener("change", function () { state.keyFilter = el.keyFilter.value; renderDoctors(); });
    el.regRows.addEventListener("click", function (e) {
      var btn = e.target.closest("button[data-action]");
      if (!btn || btn.__busy) return;
      var action = btn.dataset.action;
      var id = btn.dataset.id;
      if (action === "reg-generate") openLicenseDialog(id);
      else if (action === "reg-cloud-doctor") createCloudDoctor(id);
      else if (action === "reg-delete") deleteRegistration(id, btn);
      else if (action === "reg-entitle") openEntitlementDialog(id);
      else if (action === "reg-revoke-entitle") revokeEntitlement(id, btn.dataset.sku, btn);
    });
    el.releaseRows.addEventListener("click", function (e) {
      handleTableClick(e, {
        "release-edit": function (id) { openReleaseDialog(findRelease(id)); },
        "release-publish": publishRelease,
        "release-delete": deleteRelease
      });
    });
    el.licenseRows.addEventListener("click", function (e) { handleTableClick(e, { "license-copy": copyLicenseKey, "license-edit": openLicenseEditDialog, "license-revoke": revokeLicense, "license-delete": deleteLicense }); });
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
     "userDisplayName","userAvatar","pageKicker","pageTitle","refreshButton","logoutButton","mainContent","topbarProgress",
     "licenseMetrics","updateMetrics","metrics","regSearchInput","regStatusFilter","regCount","regRows",
     "licenseSearchInput","licenseStatusFilter","licenseCount","licenseRows","newLicenseButtonAlt",
     "newReleaseButton","importGithubReleaseButton","releaseCount","releaseRows","telemetryCount","telemetryRows",
     "newKeyButton","newDoctorButton","keyCount","keyRows","searchInput","keyFilter","doctorCount","doctorRows",
     "licenseDialog","licenseForm","licenseRegistration","licenseType","trialDaysWrap","licenseTrialDays","licenseNote",
     "licenseEditDialog","licenseEditForm","licenseEditId","licenseEditSerial","licenseEditStatus","licenseEditExpires","licenseEditRegistration","licenseEditType","licenseEditTrialWrap","licenseEditTrialDays","licenseEditNote",
     "releaseDialog","releaseForm","releaseDialogMode","releaseDialogTitle","releaseId","releaseVersion","releaseChannel","releaseSeverity","releaseSku","releaseRollout","releaseStatus","releaseNotes","releaseArtifactUrl","releaseArtifactSignature","releaseMigrationRisk",
     "entitlementDialog","entitlementForm","entitlementRegId","entitlementRegLabel","entitlementSku","entitlementChannel","entitlementNote",
     "serialDialog","generatedSerialKey","generatedSerialMeta",
     "keyDialog","keyForm","keyDialogMode","keyDialogTitle","keyId","keyName","keyProvider","keyModel","keySecret","keyActive","clearKeyWrap","clearKeySecret",
     "doctorDialog","doctorForm","doctorDialogMode","doctorDialogTitle","doctorId","doctorEmail","doctorAssignedKey","doctorMonthlyLimit","doctorDailyLimit","doctorActive","doctorAiEnabled","doctorUsageTools","setMonthlyUsed","setDailyUsed","resetMonthly","resetDaily",
     "cloudDoctorDialog","cloudDoctorRegName","cloudDoctorRegEmail","cloudDoctorAssignedKey","cloudDoctorMonthlyLimit","cloudDoctorDailyLimit","cloudDoctorActive","cloudDoctorAiEnabled","cloudDoctorSubmit","cloudDoctorSkip",
     "logsDialog","logsTitle","logsRows","credentialsDialog","createdDoctorId","toast"
    ].forEach(function (id) { el[id] = byId(id); });
    bindEvents();
    setView("dashboard");
    autoConnect();
  }

  document.addEventListener("DOMContentLoaded", init);
})();`;
