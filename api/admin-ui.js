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
        <button type="button" class="nav-item" data-view="demandes">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          <span>Demandes d'installation</span>
          <span class="nav-badge hidden" id="demandeBadge">0</span>
        </button>
        <button type="button" class="nav-item" data-view="licenses">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
          <span>Licences</span>
        </button>
        <button type="button" class="nav-item" data-view="updates">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          <span>Mises à jour</span>
        </button>
        <button type="button" class="nav-item" data-view="plans">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>
          <span>Plans</span>
        </button>
        <button type="button" class="nav-item" data-view="ai">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a4 4 0 0 1 4 4c0 1.95-1.4 3.58-3.25 3.93L12 22l-.75-12.07A4.001 4.001 0 0 1 12 2z"/><path d="M8 6H4a2 2 0 0 0-2 2v1"/><path d="M16 6h4a2 2 0 0 1 2 2v1"/></svg>
          <span>IA &amp; Médecins</span>
        </button>
        <button type="button" class="nav-item" data-view="ai-management">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18"/><path d="M8 4v6"/></svg>
          <span>Gestion IA</span>
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

        <div class="view hidden" id="view-demandes">
          <div class="toolbar">
            <label class="search-field">
              <span>Rechercher</span>
              <input id="demandeSearchInput" type="search" placeholder="Nom, spécialité, téléphone, email, ville…">
            </label>
            <label>
              <span>Statut</span>
              <select id="demandeStatusFilter">
                <option value="all">Tous</option>
                <option value="new">Nouvelles</option>
                <option value="contacted">Contactées</option>
                <option value="archived">Archivées</option>
              </select>
            </label>
          </div>
          <section class="panel">
            <div class="panel-head">
              <h2>Demandes d'installation</h2>
              <span id="demandeCount" class="panel-count">0</span>
            </div>
            <div class="table-wrap" id="demandeRows"></div>
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

        <div class="view hidden" id="view-plans">
          <p class="subtle" style="padding:0 4px 12px">Plans d'abonnement proposés aux médecins lors de l'inscription sur la version web. Sans effet automatique — le choix n'est qu'une indication pour la validation de l'inscription.</p>
          <div class="ai-content" id="plansContent"></div>
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

        <div class="view hidden" id="view-ai-management">
          <nav class="ai-subnav" id="aiSubNav"></nav>
          <div class="ai-content" id="aiContent"></div>
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
      <footer class="modal-foot">
        <button class="btn ghost" type="button" id="serialSendEmailButton">Envoyer par email</button>
        <button class="btn primary" type="button" data-close-dialog="serialDialog">Terminé</button>
      </footer>
    </div>
  </dialog>

  <dialog class="modal" id="licenseEmailDialog">
    <form class="modal-card" id="licenseEmailForm">
      <header class="modal-head">
        <div><p class="kicker">Licence</p><h2>Envoyer la clé par email</h2></div>
        <button class="icon-close" type="button" data-close-dialog="licenseEmailDialog" aria-label="Fermer">×</button>
      </header>
      <p class="subtle" id="licenseEmailKeyMeta" style="margin-bottom:14px"></p>
      <div class="form-grid">
        <label class="full"><span>Email du médecin</span><input id="licenseEmailAddress" type="email" required placeholder="docteur@exemple.com"></label>
      </div>
      <p class="subtle" style="margin-top:10px">Un email HTML avec la clé et une mise en forme soignée sera envoyé au médecin.</p>
      <footer class="modal-foot"><button class="btn ghost" type="button" data-close-dialog="licenseEmailDialog">Annuler</button><button class="btn primary" type="submit">Envoyer</button></footer>
    </form>
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

  <dialog class="modal" id="aiDoctorConfigDialog">
    <form class="modal-card" id="aiDoctorConfigForm">
      <header class="modal-head">
        <div><p class="kicker">Configuration IA complète</p><h2 id="aiDoctorConfigTitle">Médecin</h2></div>
        <button class="icon-close" type="button" data-close-dialog="aiDoctorConfigDialog" aria-label="Fermer">×</button>
      </header>
      <input id="aiDoctorConfigId" type="hidden">
      <div class="checks">
        <label class="check"><input id="aiDoctorConfigEnabled" type="checkbox"><span>IA activée</span></label>
      </div>
      <div class="form-grid">
        <label><span>AI Plan</span><select id="aiDoctorConfigPlan"><option value="">— Aucun (limites du compte)</option></select></label>
        <label><span>Langue par défaut</span><select id="aiDoctorConfigLanguage"><option value="fr">Français</option><option value="en">English</option><option value="ar">العربية</option></select></label>
        <label><span>Limite requêtes / mois</span><input id="aiDoctorConfigMonthly" type="number" min="0"></label>
        <label><span>Limite requêtes / jour</span><input id="aiDoctorConfigDaily" type="number" min="0"></label>
      </div>
      <h4>Spécialités cliniques</h4>
      <div class="checks" id="aiDoctorConfigSpecialties"></div>
      <h4>Modèles autorisés (optionnel - restreint davantage le Plan ; laisser tout décoché = pas de restriction supplémentaire)</h4>
      <div class="checks" id="aiDoctorConfigModels"></div>
      <h4>Feature Flags désactivés pour ce médecin uniquement</h4>
      <div class="checks" id="aiDoctorConfigFlags"></div>
      <p class="subtle">Prompt Library et Knowledge Base restent globaux (partagés par tâche clinique via le Model Router) - ce médecin reçoit automatiquement le prompt/les guidelines configurés pour chaque tâche.</p>
      <footer class="modal-foot"><button class="btn ghost" type="button" data-close-dialog="aiDoctorConfigDialog">Annuler</button><button class="btn primary" type="submit">Enregistrer</button></footer>
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

  <dialog class="modal" id="regEditDialog">
    <div class="modal-card">
      <header class="modal-head">
        <div>
          <p class="kicker">Inscription</p>
          <h2>Corriger le compte médecin</h2>
        </div>
        <button class="icon-close" type="button" data-close-dialog="regEditDialog" aria-label="Fermer">×</button>
      </header>
      <div class="panel panel--hint" style="margin-bottom:14px;padding:14px 16px">
        <div class="cell-title" id="regEditName">—</div>
        <div class="cell-sub" id="regEditMeta"></div>
        <div class="cell-sub" id="regEditInfo" style="margin-top:8px;line-height:1.7"></div>
      </div>
      <div class="form-grid">
        <label><span>Spécialité</span><select id="regEditSpecialty" autocomplete="off"></select></label>
        <label><span>Forcer la version (mise à jour immédiate)</span><select id="regEditForcedVersion" autocomplete="off"></select></label>
      </div>
      <p class="subtle" style="margin-top:8px">Changer la spécialité verrouille le champ : le bureau ne pourra plus l'écraser au prochain sync, et son module IA basculera automatiquement. Forcer une version pousse ce médecin vers cette version dès son prochain lancement, indépendamment du déploiement progressif normal (une release publiée à cette version doit déjà exister).</p>
      <footer class="modal-foot">
        <button class="btn ghost" type="button" data-close-dialog="regEditDialog">Annuler</button>
        <button class="btn primary" type="button" id="regEditSubmit">Enregistrer</button>
      </footer>
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
        <label><span>Offre IA (AI Management)</span><select id="cloudDoctorAiPlan" autocomplete="off"></select></label>
        <label><span>Clé API legacy (optionnel, ancien système)</span><select id="cloudDoctorAssignedKey" autocomplete="off"></select></label>
        <label><span>Limite requêtes / mois</span><input id="cloudDoctorMonthlyLimit" type="number" min="0" step="1"></label>
        <label><span>Limite requêtes / jour</span><input id="cloudDoctorDailyLimit" type="number" min="0" step="1"></label>
      </div>
      <p class="subtle" style="margin-top:8px">Laissez la clé API legacy sur « Aucune » — l'offre IA ci-dessus active le nouveau système (Prompt Library, Router, OpenRouter, etc).</p>
      <div class="checks">
        <label class="check"><input id="cloudDoctorActive" type="checkbox" checked><span>Compte actif</span></label>
        <label class="check"><input id="cloudDoctorAiEnabled" type="checkbox"><span>IA activée</span></label>
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

  <dialog class="modal" id="aiGenericDialog">
    <form class="modal-card" id="aiGenericForm">
      <header class="modal-head">
        <div><h2 id="aiGenericTitle">Élément</h2></div>
        <button class="icon-close" type="button" data-close-dialog="aiGenericDialog" aria-label="Fermer">×</button>
      </header>
      <div class="form-grid" id="aiGenericFields"></div>
      <footer class="modal-foot"><button class="btn ghost" type="button" data-close-dialog="aiGenericDialog">Annuler</button><button class="btn primary" type="submit">Enregistrer</button></footer>
    </form>
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
.nav-badge { margin-left: auto; min-width: 20px; height: 20px; padding: 0 6px; border-radius: 999px; background: #ef4444; color: #fff; font-size: 11px; font-weight: 800; display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(239,68,68,.4); }
.nav-item.active .nav-badge { background: #ef4444; }
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

.ai-subnav { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
.subnav-item { border: 1px solid var(--line); background: #fff; color: var(--text); padding: 8px 14px; border-radius: 999px; font-size: 12.5px; font-weight: 700; cursor: pointer; }
.subnav-item.active { background: var(--primary); color: #fff; border-color: var(--primary); }
.code-block { background: #0f172a; color: #e2e8f0; padding: 14px 16px; border-radius: 10px; font-size: 12.5px; line-height: 1.5; overflow: auto; max-height: 50vh; white-space: pre-wrap; word-break: break-word; }
.ai-content > section { margin-bottom: 18px; }

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
    demandes: { kicker: "Site web", title: "Demandes d'installation" },
    licenses: { kicker: "Licences", title: "Clés d'activation" },
    updates: { kicker: "Desktop", title: "Mises à jour" },
    plans: { kicker: "Inscriptions", title: "Plans d'abonnement" },
    ai: { kicker: "Intelligence artificielle", title: "IA & Médecins" },
    "ai-management": { kicker: "Intelligence artificielle", title: "Gestion IA" }
  };

  var REG_STATUS = { pending_activation: "En attente", activated: "Activé" };
  var DEMANDE_STATUS = { new: "Nouvelle", contacted: "Contactée", archived: "Archivée" };
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
    demandes: [], demandeUnseen: 0,
    regQuery: "", regStatusFilter: "all",
    licenseQuery: "", licenseStatusFilter: "all",
    demandeQuery: "", demandeStatusFilter: "all",
    editingDoctorId: "", editingKeyId: "", editingLicenseId: "", editingReleaseId: "",
    pendingCloudDoctorRegistrationId: "", pendingEntitlementRegId: "",
    pendingLicenseEmailId: "",
    // True until a section's first fetch resolves. Drives skeletons, so a panel
    // shows placeholders rather than a misleading "nothing here" while loading.
    loading: { doctors: true, registrations: true, licenses: true, releases: true, telemetry: true, demandes: true },
    refreshing: false
  };

  var el = {};
  function byId(id) { return document.getElementById(id); }

  // =========================================================================
  // AI MANAGEMENT — new section, separate from the legacy "IA & Médecins"
  // (data-view="ai") view above. Schema-driven generic CRUD for the simple
  // catalog entities (specialties, tasks, guidelines, flags, plans, models,
  // keys) plus dedicated renderers for Prompts, Router, Usage/Costs/Logs/
  // Audit, Settings and the Testing Playground.
  // =========================================================================

  var CONNECTOR_TYPES = ["openai_compatible", "anthropic", "gemini", "local"];

  // Connector options are unknown until the admin has created some (this is
  // what makes providers unlimited/dynamic instead of a fixed enum) - fields
  // with dynamicOptions:"connectors" are resolved from aiState.connectors at
  // render time instead of a static list (see renderAiGenericFields).
  function connectorSelectOptions() {
    return (aiState.connectors || []).map(function (c) { return { value: c.id, label: c.name + " (" + c.type + ")" }; });
  }

  var AI_ENTITIES = {
    connectors: { base: "/api/admin/ai/connectors", label: "Connecteur fournisseur", columns: ["name", "type", "enabled", "health_status", "priority"], fields: [
      { key: "name", label: "Nom", required: true },
      { key: "type", label: "Type", type: "select", default: "openai_compatible", options: CONNECTOR_TYPES.map(function (v) { return { value: v, label: v }; }) },
      { key: "base_url", label: "Base URL (API)", required: true },
      { key: "azure_api_version", label: "Azure API version (si Azure OpenAI)" },
      { key: "enabled", label: "Activé", type: "checkbox", default: true },
      { key: "priority", label: "Priorité", type: "number", default: 100 },
      { key: "timeout_ms", label: "Timeout (ms)", type: "number", default: 60000 },
      { key: "retries", label: "Retries", type: "number", default: 1 }
    ] },
    specialties: { base: "/api/admin/ai/specialties", label: "Spécialité", columns: ["name", "description", "active"], fields: [
      { key: "name", label: "Nom", required: true },
      { key: "description", label: "Description" },
      { key: "active", label: "Active", type: "checkbox", default: true }
    ] },
    tasks: { base: "/api/admin/ai/tasks", label: "Tâche clinique", columns: ["name", "action_type", "active"], fields: [
      { key: "name", label: "Nom", required: true },
      { key: "description", label: "Description" },
      { key: "action_type", label: "Action type (signal envoyé par le desktop)", type: "select", default: "chat", options: ["chat", "lab_analysis", "pdf_analysis", "ecg_analysis", "image_analysis", "multimodal_analysis", "irm_analysis"].map(function (v) { return { value: v, label: v }; }) },
      { key: "active", label: "Active", type: "checkbox", default: true }
    ] },
    guidelines: { base: "/api/admin/ai/guidelines", label: "Guideline", columns: ["org", "disease", "version", "status", "publication_year"], fields: [
      { key: "org", label: "Organisation", type: "select", options: ["ESC", "AHA", "ACC", "WHO", "ADA", "KDIGO", "GOLD", "ATS", "ERS", "NICE", "EULAR", "ESMO", "IDSA", "Surviving Sepsis Campaign", "CDC"].map(function (v) { return { value: v, label: v }; }), required: true },
      { key: "title", label: "Titre" },
      { key: "disease", label: "Pathologie / sujet" },
      { key: "publication_year", label: "Année de publication", type: "number" },
      { key: "source_url", label: "URL source (document officiel)" },
      { key: "status", label: "Statut", type: "select", default: "draft", options: ["draft", "published", "deprecated"].map(function (v) { return { value: v, label: v }; }) },
      { key: "default_evidence_level", label: "Niveau de preuve par défaut", type: "select", options: ["", "A", "B", "C", "D", "I", "IIa", "IIb", "III"].map(function (v) { return { value: v, label: v || "—" }; }) },
      { key: "default_recommendation_class", label: "Classe de recommandation par défaut", type: "select", options: ["", "I", "IIa", "IIb", "III", "Strong", "Conditional"].map(function (v) { return { value: v, label: v || "—" }; }) },
      { key: "summary_fr", label: "Résumé (Français)", type: "textarea" },
      { key: "summary_en", label: "Summary (English)", type: "textarea" },
      { key: "summary_ar", label: "الملخص (العربية)", type: "textarea" },
      { key: "sections_json", label: "Sections structurées (JSON - recommandations/critères/scores/algorithmes/contre-indications/signaux d'alerte/références)", type: "textarea" }
    ] },
    flags: { base: "/api/admin/ai/flags", label: "Feature flag", idField: "key", columns: ["key", "description", "enabled", "rollout_pct"], fields: [
      { key: "key", label: "Clé", required: true, lockOnEdit: true },
      { key: "description", label: "Description" },
      { key: "enabled", label: "Activé", type: "checkbox" },
      { key: "rollout_pct", label: "Rollout %", type: "number", default: 100 }
    ] },
    plans: { base: "/api/admin/ai/plans", label: "AI Plan", columns: ["name", "monthly_limit", "daily_limit", "rate_limit_per_min", "active"], fields: [
      { key: "name", label: "Nom", required: true },
      { key: "description", label: "Description" },
      { key: "monthly_limit", label: "Limite mensuelle", type: "number", default: 500 },
      { key: "daily_limit", label: "Limite journalière", type: "number", default: 50 },
      { key: "rate_limit_per_min", label: "Rate limit / min", type: "number", default: 10 },
      { key: "active", label: "Actif", type: "checkbox", default: true }
    ] },
    models: { base: "/api/admin/ai/models", label: "Modèle IA", columns: ["name", "provider", "model_id", "enabled", "priority"], fields: [
      { key: "name", label: "Nom", required: true },
      { key: "connector_id", label: "Connecteur", type: "select", dynamicOptions: "connectors" },
      { key: "model_id", label: "ID modèle (ex: openai/gpt-5)", required: true },
      { key: "enabled", label: "Activé", type: "checkbox", default: true },
      { key: "priority", label: "Priorité", type: "number", default: 100 },
      { key: "temperature", label: "Température", type: "number", step: "0.1", default: 0.2 },
      { key: "top_p", label: "Top P", type: "number", step: "0.1", default: 1 },
      { key: "max_tokens", label: "Max tokens", type: "number", default: 2048 },
      { key: "timeout_ms", label: "Timeout (ms)", type: "number", default: 60000 },
      { key: "retry", label: "Retry", type: "number", default: 1 },
      { key: "price_per_million_in", label: "Prix / M tokens (in, $)", type: "number", step: "0.01", default: 0 },
      { key: "price_per_million_out", label: "Prix / M tokens (out, $)", type: "number", step: "0.01", default: 0 },
      { key: "context_window", label: "Fenêtre de contexte", type: "number", default: 128000 },
      { key: "reasoning_level", label: "Reasoning", type: "select", options: ["none", "low", "medium", "high"].map(function (v) { return { value: v, label: v }; }) },
      { key: "vision", label: "Vision", type: "checkbox" },
      { key: "json_mode", label: "JSON mode", type: "checkbox" },
      { key: "streaming", label: "Streaming", type: "checkbox" }
    ] },
    keys: { base: "/api/admin/ai/keys", label: "Clé API fournisseur", columns: ["name", "connector_name", "key_hint", "active"], fields: [
      { key: "name", label: "Nom", required: true },
      { key: "connector_id", label: "Connecteur", type: "select", dynamicOptions: "connectors" },
      { key: "api_key", label: "Secret API (laisser vide pour ne pas changer)", type: "password" },
      { key: "active", label: "Active", type: "checkbox", default: true }
    ] },
    // Account/subscription plans (Plans tab, top-level nav, api/account-plans.js) --
    // NOT part of the "Gestion IA" subnav despite living in this same generic-CRUD
    // config object; renderAiGenericTable/openAiGenericDialog/etc. are entity-key-
    // generic and don't care which top-level view invokes them (see renderPlansView).
    account_plans: { base: "/api/admin/account-plans", label: "Plan", columns: ["name", "price", "currency", "duration_days", "active"], fields: [
      { key: "name", label: "Nom", required: true },
      { key: "description", label: "Description", type: "textarea" },
      { key: "price", label: "Prix", type: "number", step: "0.01", default: 0 },
      { key: "currency", label: "Devise", default: "DZD" },
      { key: "duration_days", label: "Durée (jours)", type: "number", default: 30 },
      { key: "active", label: "Actif", type: "checkbox", default: true }
    ] }
  };

  var AI_SUBVIEWS = ["dashboard", "connectors", "models", "prompts", "specialties", "tasks", "guidelines", "router", "flags", "plans", "keys", "usage", "costs", "logs", "audit", "settings", "playground"];
  var AI_SUBVIEW_LABELS = {
    dashboard: "Tableau de bord", connectors: "Connecteurs", models: "Modèles", prompts: "Prompt Library", specialties: "Spécialités",
    tasks: "Tâches cliniques", guidelines: "Guidelines", router: "Model Router", flags: "Feature Flags",
    plans: "AI Plans", keys: "Clés API", usage: "Usage", costs: "Coûts", logs: "Logs", audit: "Audit",
    settings: "AI Settings", playground: "Testing Playground"
  };

  var aiState = { initialized: false, view: "dashboard", loaded: {}, editingEntity: "", editingId: "", detailPromptId: "",
    specialties: [], tasks: [], guidelines: [], flags: [], plans: [], models: [], keys: [], prompts: [], connectors: [], account_plans: [] };

  // Guidelines store multilingual summary as an object ({fr,en,ar}) and
  // structured excerpts as an array ("sections") - the generic dialog only
  // knows flat field keys, so these two helpers flatten/rebuild just those
  // two composite fields for the "guidelines" entity, keeping the rest of
  // the generic CRUD dialog untouched for every other entity.
  var AI_SUMMARY_LANG_FIELD = /^summary_(fr|en|ar)$/;

  function aiFieldValue(field, row) {
    var langMatch = AI_SUMMARY_LANG_FIELD.exec(field.key);
    if (langMatch && row) return (row.summary && row.summary[langMatch[1]]) || "";
    if (field.key === "sections_json" && row) return JSON.stringify(row.sections || [], null, 2);
    if (row && row[field.key] !== undefined) return row[field.key];
    return field.default !== undefined ? field.default : (field.type === "checkbox" ? false : "");
  }

  function renderAiGenericFields(entityKey, row) {
    var cfg = AI_ENTITIES[entityKey];
    return cfg.fields.map(function (f) {
      var val = aiFieldValue(f, row);
      var locked = row && f.lockOnEdit ? " disabled" : "";
      if (f.type === "checkbox") {
        return '<label class="check"><input type="checkbox" data-field="' + f.key + '"' + (val ? " checked" : "") + locked + '><span>' + escapeHtml(f.label) + '</span></label>';
      }
      if (f.type === "textarea") {
        return '<label class="full"><span>' + escapeHtml(f.label) + '</span><textarea data-field="' + f.key + '" rows="4">' + escapeHtml(val) + '</textarea></label>';
      }
      if (f.type === "select") {
        var options = f.dynamicOptions === "connectors" ? connectorSelectOptions() : f.options;
        var opts = options.map(function (o) { return '<option value="' + escapeHtml(o.value) + '"' + (o.value === val ? " selected" : "") + '>' + escapeHtml(o.label) + '</option>'; }).join("");
        return '<label><span>' + escapeHtml(f.label) + '</span><select data-field="' + f.key + '"' + locked + '>' + opts + '</select></label>';
      }
      var type = f.type === "number" ? "number" : (f.type === "password" ? "password" : "text");
      var step = f.step ? ' step="' + f.step + '"' : "";
      return '<label><span>' + escapeHtml(f.label) + (f.required ? " *" : "") + '</span><input data-field="' + f.key + '" type="' + type + '" value="' + escapeHtml(type === "password" ? "" : val) + '"' + step + locked + (f.required ? " required" : "") + '></label>';
    }).join("");
  }

  async function openAiGenericDialog(entityKey, row) {
    var cfg = AI_ENTITIES[entityKey];
    var needsConnectors = cfg.fields.some(function (f) { return f.dynamicOptions === "connectors"; });
    if (needsConnectors) await loadAiEntity("connectors");
    aiState.editingEntity = entityKey;
    aiState.editingId = row ? row[cfg.idField || "id"] : "";
    el.aiGenericTitle.textContent = (row ? "Modifier — " : "Créer — ") + cfg.label;
    el.aiGenericFields.innerHTML = renderAiGenericFields(entityKey, row);
    el.aiGenericDialog.showModal();
  }

  function collectAiGenericFields(entityKey) {
    var cfg = AI_ENTITIES[entityKey];
    var body = {};
    cfg.fields.forEach(function (f) {
      var input = el.aiGenericFields.querySelector('[data-field="' + f.key + '"]');
      if (!input) return;
      if (f.type === "checkbox") body[f.key] = input.checked;
      else if (f.type === "number") body[f.key] = input.value === "" ? undefined : Number(input.value);
      else body[f.key] = input.value;
    });
    return body;
  }

  async function saveAiGeneric(e) {
    e.preventDefault();
    var entityKey = aiState.editingEntity;
    var cfg = AI_ENTITIES[entityKey];
    var body = collectAiGenericFields(entityKey);
    if (entityKey === "keys" && !body.api_key) delete body.api_key;
    if (entityKey === "guidelines") {
      body.summary = { fr: body.summary_fr || "", en: body.summary_en || "", ar: body.summary_ar || "" };
      delete body.summary_fr; delete body.summary_en; delete body.summary_ar;
      if (body.sections_json) {
        try { body.sections = JSON.parse(body.sections_json); }
        catch (e2) { showToast("JSON des sections invalide : " + e2.message, true); return; }
      }
      delete body.sections_json;
    }
    var id = aiState.editingId;
    var submitBtn = el.aiGenericForm.querySelector('button[type=submit]');
    var success = await runAction(submitBtn, async function () {
      if (id) await apiFetch(cfg.base + "/" + encodeURIComponent(id), { method: "PATCH", body: body });
      else await apiFetch(cfg.base, { method: "POST", body: body });
    }, "Enregistré");
    if (success) { el.aiGenericDialog.close(); await loadAiEntity(entityKey, true); await renderAiView(); }
  }

  async function deleteAiGeneric(entityKey, id, btn) {
    if (!window.confirm("Supprimer cet élément ?")) return;
    var cfg = AI_ENTITIES[entityKey];
    var success = await runAction(btn, async function () {
      await apiFetch(cfg.base + "/" + encodeURIComponent(id), { method: "DELETE" });
    }, "Supprimé");
    if (success) { await loadAiEntity(entityKey, true); await renderAiView(); }
  }

  async function publishAiGuideline(id, btn) {
    var success = await runAction(btn, async function () { await apiFetch("/api/admin/ai/guidelines/" + id + "/publish", { method: "POST" }); }, "Guideline publiée");
    if (success) { await loadAiEntity("guidelines", true); await renderAiView(); }
  }

  async function newVersionAiGuideline(id, btn) {
    var success = await runAction(btn, async function () { await apiFetch("/api/admin/ai/guidelines/" + id + "/new-version", { method: "POST" }); }, "Nouvelle version créée (draft)");
    if (success) { await loadAiEntity("guidelines", true); await renderAiView(); }
  }

  async function deprecateAiGuideline(id, btn) {
    if (!window.confirm("Déprécier cette guideline ? Elle ne sera plus injectée dans le trafic réel.")) return;
    var success = await runAction(btn, async function () { await apiFetch("/api/admin/ai/guidelines/" + id + "/deprecate", { method: "POST" }); }, "Guideline dépréciée");
    if (success) { await loadAiEntity("guidelines", true); await renderAiView(); }
  }

  async function loadAiEntity(entityKey, force) {
    if (aiState.loaded[entityKey] && !force) return aiState[entityKey];
    var cfg = AI_ENTITIES[entityKey];
    var data = await apiFetch(cfg.base);
    aiState[entityKey] = data.rows || [];
    aiState.loaded[entityKey] = true;
    return aiState[entityKey];
  }

  async function loadAiPrompts(force) {
    if (aiState.loaded.prompts && !force) return aiState.prompts;
    var data = await apiFetch("/api/admin/ai/prompts");
    aiState.prompts = data.rows || [];
    aiState.loaded.prompts = true;
    return aiState.prompts;
  }

  function renderAiGenericTable(entityKey) {
    var cfg = AI_ENTITIES[entityKey];
    var rows = aiState[entityKey] || [];
    var idKey = cfg.idField || "id";
    var head = cfg.columns.map(function (c) { return "<th>" + escapeHtml(c) + "</th>"; }).join("") + "<th></th>";
    var body = rows.map(function (r) {
      var cells = cfg.columns.map(function (c) {
        var v = r[c];
        if (typeof v === "boolean") return "<td>" + (v ? badge("green", "oui") : badge("red", "non")) + "</td>";
        if (Array.isArray(v)) return "<td>" + escapeHtml(v.join(", ")) + "</td>";
        return "<td>" + escapeHtml(v == null ? "" : v) + "</td>";
      }).join("");
      var guidelineActions = entityKey === "guidelines"
        ? '<button class="btn ghost" type="button" data-guideline-publish="' + escapeHtml(r.id) + '">Publier</button>' +
          '<button class="btn ghost" type="button" data-guideline-version="' + escapeHtml(r.id) + '">Nouvelle version</button>' +
          '<button class="btn ghost" type="button" data-guideline-deprecate="' + escapeHtml(r.id) + '">Déprécier</button>'
        : "";
      return '<tr>' + cells + '<td class="row-actions">' +
        '<button class="btn ghost" type="button" data-ai-edit="' + entityKey + '" data-id="' + escapeHtml(r[idKey]) + '">Modifier</button>' +
        guidelineActions +
        '<button class="btn danger" type="button" data-ai-delete="' + entityKey + '" data-id="' + escapeHtml(r[idKey]) + '">Supprimer</button></td></tr>';
    }).join("");
    return '<div class="toolbar toolbar--actions"><button class="btn primary" type="button" data-ai-new="' + entityKey + '">+ ' + escapeHtml(cfg.label) + '</button></div>' +
      '<section class="panel"><div class="table-wrap"><table class="data-table"><thead><tr>' + head + '</tr></thead><tbody>' +
      (body || '<tr><td colspan="' + (cfg.columns.length + 1) + '"><div class="empty">Aucun élément.</div></td></tr>') +
      '</tbody></table></div></section>';
  }

  function renderAiSubNav() {
    el.aiSubNav.innerHTML = AI_SUBVIEWS.map(function (v) {
      return '<button type="button" class="subnav-item' + (aiState.view === v ? " active" : "") + '" data-aiview="' + v + '">' + escapeHtml(AI_SUBVIEW_LABELS[v]) + '</button>';
    }).join("");
  }

  async function setAiView(view) {
    aiState.view = view;
    renderAiSubNav();
    el.aiContent.innerHTML = '<div class="empty">Chargement…</div>';
    try { await renderAiView(); }
    catch (e) { el.aiContent.innerHTML = '<div class="empty">' + escapeHtml(e.message || "Erreur") + '</div>'; }
  }

  async function renderAiView() {
    var view = aiState.view;
    if (AI_ENTITIES[view]) {
      await loadAiEntity(view);
      el.aiContent.innerHTML = renderAiGenericTable(view);
      return;
    }
    if (view === "dashboard") return renderAiDashboard();
    if (view === "prompts") return renderAiPrompts();
    if (view === "router") return renderAiRouter();
    if (view === "usage") return renderAiUsage();
    if (view === "costs") return renderAiCosts();
    if (view === "logs") return renderAiLogs();
    if (view === "audit") return renderAiAudit();
    if (view === "settings") return renderAiSettingsView();
    if (view === "playground") return renderAiPlayground();
  }

  async function renderAiDashboard() {
    var models = await loadAiEntity("models");
    var plans = await loadAiEntity("plans");
    var prompts = await loadAiPrompts();
    el.aiContent.innerHTML = '<section class="stat-grid">' +
      statCard("Modèles activés", models.filter(function (m) { return m.enabled; }).length, "accent-blue") +
      statCard("Prompts", prompts.length, "accent-violet") +
      statCard("Plans IA", plans.length, "accent-green") +
      '</section><section class="panel panel--hint"><h3>Gestion IA</h3><p>Configurez modèles, prompt library, router clinique et supervision (usage, coûts, logs, audit) depuis cette section — distincte de « IA & Médecins » qui gère les comptes/clés existants.</p></section>';
  }

  var AI_PROMPT_STATUS_BADGE = { draft: "amber", testing: "blue", published: "green", archived: "red" };

  // Canned Prompt Testing fixtures (Sample Patient/ECG/Laboratory/MRI/CT/
  // X-Ray) - just convenience presets that fill the variables textarea, not
  // new backend behavior; the actual clinical prompts/content are added
  // later per instruction.
  var AI_PROMPT_SAMPLES = {
    "Sample Patient": { patient_age: "54", patient_gender: "M", chief_complaint: "Douleur thoracique", medical_history: "Hypertension, diabète type 2", current_medications: "Metformine, Amlodipine", allergies: "Aucune connue", vital_signs: "TA 145/92, FC 88, T 37.1°C", clinical_notes: "Douleur depuis 2h, irradiant au bras gauche" },
    "Sample ECG": { ecg: "Rythme sinusal 78 bpm, PR 180ms, QRS 90ms, QTc 420ms, pas de sus-décalage ST" },
    "Sample Laboratory": { laboratory_results: "Troponine 0.02 ng/mL, CRP 5 mg/L, Créatinine 0.9 mg/dL, HbA1c 7.2%" },
    "Sample MRI": { mri: "IRM cérébrale: pas de lésion ischémique aiguë, discrets hypersignaux de la substance blanche" },
    "Sample CT": { ct: "TDM thoracique: pas d'embolie pulmonaire, pas de foyer de condensation" },
    "Sample X-Ray": { xray: "Radiographie thoracique: silhouette cardiaque normale, champs pulmonaires clairs" }
  };

  async function renderAiPrompts() {
    var rows = await loadAiPrompts();
    var specialties = await loadAiEntity("specialties");
    var tasks = await loadAiEntity("tasks");
    var specMap = {}; specialties.forEach(function (s) { specMap[s.id] = s.name; });
    var taskMap = {}; tasks.forEach(function (t) { taskMap[t.id] = t.name; });
    var body = rows.map(function (p) {
      return '<tr><td>' + escapeHtml(p.name) + '<div class="cell-sub">' + escapeHtml(p.description || "") + '</div></td>' +
        '<td>' + escapeHtml(specMap[p.specialty_id] || "-") + '</td><td>' + escapeHtml(taskMap[p.task_id] || "-") + '</td>' +
        '<td>' + badge(AI_PROMPT_STATUS_BADGE[p.status] || "amber", p.status) + '</td>' +
        '<td>v' + escapeHtml(p.current_version || 0) + '</td>' +
        '<td class="row-actions">' +
        '<button class="btn ghost" type="button" data-prompt-detail="' + p.id + '">Détails</button>' +
        '<button class="btn ghost" type="button" data-prompt-clone="' + p.id + '">Cloner</button>' +
        '<button class="btn danger" type="button" data-prompt-delete="' + p.id + '">Supprimer</button></td></tr>';
    }).join("");
    el.aiContent.innerHTML =
      '<div class="toolbar toolbar--actions">' +
        '<button class="btn primary" type="button" id="aiNewPromptBtn">+ Prompt</button>' +
        '<button class="btn ghost" type="button" data-prompt-export="json">Exporter JSON</button>' +
        '<button class="btn ghost" type="button" data-prompt-export="yaml">Exporter YAML</button>' +
        '<button class="btn ghost" type="button" data-prompt-export="markdown">Exporter Markdown</button>' +
        '<button class="btn ghost" type="button" id="aiImportPromptsBtn">Importer JSON</button>' +
      '</div>' +
      '<section class="panel"><div class="table-wrap"><table class="data-table"><thead><tr><th>Nom</th><th>Spécialité</th><th>Tâche</th><th>Statut</th><th>Version</th><th></th></tr></thead><tbody>' +
      (body || '<tr><td colspan="6"><div class="empty">Aucun prompt.</div></td></tr>') + '</tbody></table></div></section>' +
      '<section class="panel hidden" id="aiPromptDetailPanel"></section>';
  }

  async function showAiPromptDetail(id) {
    var data = await apiFetch("/api/admin/ai/prompts/" + id);
    var p = data.row, versions = data.versions || [];
    var specialties = aiState.specialties || [];
    var tasks = aiState.tasks || [];
    var models = await loadAiEntity("models");
    var guidelines = await loadAiEntity("guidelines");
    var specOptions = specialties.map(function (s) { return '<option value="' + escapeHtml(s.id) + '"' + (s.id === p.specialty_id ? " selected" : "") + '>' + escapeHtml(s.name) + '</option>'; }).join("");
    var taskOptions = tasks.map(function (t) { return '<option value="' + escapeHtml(t.id) + '"' + (t.id === p.task_id ? " selected" : "") + '>' + escapeHtml(t.name) + '</option>'; }).join("");
    var modelOptionsFor = function (sel) {
      return '<option value="">—</option>' + models.map(function (m) { return '<option value="' + escapeHtml(m.id) + '"' + (m.id === sel ? " selected" : "") + '>' + escapeHtml(m.name) + '</option>'; }).join("");
    };
    var statusOptions = ["draft", "testing", "published", "archived"].map(function (s) { return '<option value="' + s + '"' + (s === p.status ? " selected" : "") + '>' + s + '</option>'; }).join("");
    var versionRows = versions.map(function (v) {
      return '<tr><td><label class="check"><input type="radio" name="aiCompareA" value="' + v.version + '"' + (v.version === versions[1] ? " checked" : "") + '"> v' + v.version + '</label></td>' +
        '<td><label class="check"><input type="radio" name="aiCompareB" value="' + v.version + '"' + (v.version === versions[0] ? " checked" : "") + '"></label></td>' +
        '<td>' + escapeHtml((v.created_by || "") + " · " + (v.created_at || "").slice(0, 16).replace("T", " ")) + '</td>' +
        '<td class="row-actions"><button class="btn ghost" type="button" data-prompt-rollback="' + p.id + '" data-version="' + v.version + '">Rollback</button></td></tr>';
    }).join("");
    var latest = versions[0] || {};
    var sampleButtons = Object.keys(AI_PROMPT_SAMPLES).map(function (label) {
      return '<button class="btn ghost" type="button" data-prompt-sample="' + escapeHtml(label) + '">' + escapeHtml(label) + '</button>';
    }).join(" ");
    var panel = byId("aiPromptDetailPanel");
    panel.classList.remove("hidden");
    panel.innerHTML =
      '<h3>' + escapeHtml(p.name) + " " + badge(AI_PROMPT_STATUS_BADGE[p.status] || "amber", p.status) + '</h3>' +
      '<div class="form-grid">' +
        '<label><span>Nom</span><input id="aiPromptName" value="' + escapeHtml(p.name) + '"></label>' +
        '<label><span>Spécialité (catégorie)</span><select id="aiPromptSpecialty"><option value="">—</option>' + specOptions + '</select></label>' +
        '<label><span>Tâche clinique</span><select id="aiPromptTask"><option value="">—</option>' + taskOptions + '</select></label>' +
        '<label><span>Description</span><input id="aiPromptDescription" value="' + escapeHtml(p.description || "") + '"></label>' +
        '<label><span>Langue</span><input id="aiPromptLanguage" value="' + escapeHtml(p.language || "fr") + '"></label>' +
        '<label><span>Seuil de confiance (0-1)</span><input id="aiPromptConfidence" type="number" step="0.05" min="0" max="1" value="' + escapeHtml(p.confidence_threshold) + '"></label>' +
        '<label><span>Statut</span><select id="aiPromptStatus">' + statusOptions + '</select></label>' +
      '</div>' +
      '<h4>Modèles recommandés</h4>' +
      '<div class="form-grid">' +
        '<label><span>Préféré</span><select id="aiPromptPreferredModel">' + modelOptionsFor(p.preferred_model_id) + '</select></label>' +
        '<label><span>Fallback</span><select id="aiPromptFallbackModel">' + modelOptionsFor(p.fallback_model_id) + '</select></label>' +
        '<label><span>Second fallback</span><select id="aiPromptSecondFallbackModel">' + modelOptionsFor(p.second_fallback_model_id) + '</select></label>' +
      '</div>' +
      '<h4>Guidelines liées</h4>' +
      '<div class="checks">' + guidelines.map(function (g) {
        var checked = (p.guideline_ids || []).indexOf(g.id) !== -1 ? " checked" : "";
        return '<label class="check"><input type="checkbox" class="ai-prompt-guideline" value="' + escapeHtml(g.id) + '"' + checked + '><span>' + escapeHtml(g.org) + '</span></label>';
      }).join("") + '</div>' +
      '<div class="form-grid">' +
        '<label class="full"><span>Variables déclarées (séparées par virgule)</span><input id="aiPromptVariables" value="' + escapeHtml((p.variables || []).join(", ")) + '"></label>' +
        '<label class="full"><span>Expected JSON (exemple de sortie)</span><textarea id="aiPromptExpectedJson" rows="3">' + escapeHtml(p.expected_json || "") + '</textarea></label>' +
      '</div>' +
      '<div class="toolbar toolbar--actions">' +
        '<button class="btn ghost" type="button" id="aiPromptSaveMeta">Enregistrer métadonnées</button>' +
        '<button class="btn primary" type="button" data-prompt-publish="' + p.id + '">Publier</button>' +
        '<button class="btn danger" type="button" data-prompt-archive="' + p.id + '">Archiver</button>' +
      '</div>' +
      '<h4>Historique des versions</h4>' +
      '<div class="table-wrap"><table class="data-table"><thead><tr><th>A</th><th>B</th><th>Créée par</th><th></th></tr></thead><tbody>' + (versionRows || '<tr><td colspan="4"><div class="empty">Aucune version.</div></td></tr>') + '</tbody></table></div>' +
      '<button class="btn ghost" type="button" data-prompt-compare="' + p.id + '">Comparer A / B</button>' +
      '<pre id="aiPromptCompareOutput" class="code-block hidden"></pre>' +
      '<h4>Nouvelle version (courante : v' + (p.current_version || 0) + ')</h4>' +
      '<div class="form-grid">' +
        '<label class="full"><span>System prompt</span><textarea id="aiPromptSystem" rows="3">' + escapeHtml(latest.system_prompt || "") + '</textarea></label>' +
        '<label class="full"><span>Developer prompt</span><textarea id="aiPromptDeveloper" rows="2">' + escapeHtml(latest.developer_prompt || "") + '</textarea></label>' +
        '<label class="full"><span>User template ({{variable}} supporté)</span><textarea id="aiPromptUserTemplate" rows="3">' + escapeHtml(latest.user_template || "") + '</textarea></label>' +
        '<label class="full"><span>Output schema (JSON, optionnel)</span><textarea id="aiPromptOutputSchema" rows="2">' + escapeHtml(latest.output_schema || "") + '</textarea></label>' +
      '</div>' +
      '<button class="btn primary" type="button" id="aiPromptSaveVersion">Enregistrer nouvelle version</button>' +
      '<h4>Prompt Testing</h4>' +
      '<p class="subtle">Échantillons : ' + sampleButtons + '</p>' +
      '<textarea id="aiPromptTestVars" rows="3" placeholder="{&quot;patient_age&quot;:&quot;54&quot;,...}"></textarea>' +
      '<div class="toolbar toolbar--actions">' +
        '<button class="btn ghost" type="button" id="aiPromptTestBtn">Tester le rendu (sans appel IA)</button>' +
        '<button class="btn primary" type="button" id="aiPromptRunAiTestBtn">Exécuter avec IA (latence/coût/confiance)</button>' +
      '</div>' +
      '<pre id="aiPromptTestOutput" class="code-block"></pre>' +
      '<h4>Analytics</h4>' +
      '<div id="aiPromptAnalytics" class="stat-grid"></div>' +
      '<h4>Doctor Feedback</h4>' +
      '<div id="aiPromptFeedback" class="table-wrap"></div>';
    aiState.detailPromptId = p.id;
    loadAiPromptAnalytics(p.id);
    loadAiPromptFeedback(p.id);
  }

  async function loadAiPromptAnalytics(id) {
    try {
      var data = await apiFetch("/api/admin/ai/prompts/" + id + "/analytics");
      var a = data.analytics || {};
      byId("aiPromptAnalytics").innerHTML =
        statCard("Requêtes", a.requests || 0, "accent-blue") +
        statCard("Taux de succès", a.success_rate != null ? Math.round(a.success_rate * 100) + "%" : "-", "accent-green") +
        statCard("Confiance moy.", a.avg_confidence != null ? Math.round(a.avg_confidence * 100) + "%" : "-", "accent-violet") +
        statCard("Latence moy.", (a.avg_latency_ms || 0) + " ms", "accent-amber") +
        statCard("Coût (30j)", "$" + ((a.cost_micros || 0) / 1e6).toFixed(4), "");
    } catch (e) { /* analytics best-effort, non-blocking */ }
  }

  async function loadAiPromptFeedback(id) {
    try {
      var data = await apiFetch("/api/admin/ai/prompts/" + id + "/feedback");
      var rows = (data.rows || []).map(function (f) {
        return '<tr><td>' + escapeHtml((f.at || "").slice(0, 16).replace("T", " ")) + '</td><td>' + escapeHtml(f.rating || "-") + '/5</td><td>' + escapeHtml(f.comment || "") + '</td></tr>';
      }).join("");
      byId("aiPromptFeedback").innerHTML = '<table class="data-table"><thead><tr><th>Date</th><th>Note</th><th>Commentaire</th></tr></thead><tbody>' +
        (rows || '<tr><td colspan="3"><div class="empty">Aucun retour médecin pour le moment.</div></td></tr>') + '</tbody></table>';
    } catch (e) { /* best-effort */ }
  }

  async function createAiPrompt() {
    var name = window.prompt("Nom du nouveau prompt :");
    if (!name) return;
    try {
      await apiFetch("/api/admin/ai/prompts", { method: "POST", body: { name: name } });
      showToast("Prompt créé");
      await loadAiPrompts(true);
      await renderAiPrompts();
    } catch (e) { showToast(e.message, true); }
  }

  async function exportAiPrompts(format) {
    try {
      if (format === "json") {
        var data = await apiFetch("/api/admin/ai/prompts/export");
        downloadText(JSON.stringify(data.export, null, 2), "medismart-ai-prompts.json", "application/json");
        return;
      }
      var res = await fetch("/api/admin/ai/prompts/export?format=" + format, { headers: authHeader() });
      var text = await res.text();
      downloadText(text, "medismart-ai-prompts." + (format === "markdown" ? "md" : format), "text/plain");
    } catch (e) { showToast(e.message, true); }
  }

  function downloadText(text, filename, mime) {
    var blob = new Blob([text], { type: mime });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  async function importAiPrompts() {
    var raw = window.prompt("Collez le JSON exporté :");
    if (!raw) return;
    try {
      var parsed = JSON.parse(raw);
      await apiFetch("/api/admin/ai/prompts/import", { method: "POST", body: { export: parsed } });
      showToast("Import terminé");
      await loadAiPrompts(true);
      await renderAiPrompts();
    } catch (e) { showToast(e.message, true); }
  }

  async function cloneAiPrompt(id, btn) {
    var success = await runAction(btn, async function () { await apiFetch("/api/admin/ai/prompts/" + id + "/clone", { method: "POST" }); }, "Prompt cloné");
    if (success) { await loadAiPrompts(true); await renderAiPrompts(); }
  }

  async function deleteAiPrompt(id, btn) {
    if (!window.confirm("Supprimer ce prompt et tout son historique ?")) return;
    var success = await runAction(btn, async function () { await apiFetch("/api/admin/ai/prompts/" + id, { method: "DELETE" }); }, "Supprimé");
    if (success) { await loadAiPrompts(true); await renderAiPrompts(); }
  }

  async function rollbackAiPrompt(id, version, btn) {
    await runAction(btn, async function () { await apiFetch("/api/admin/ai/prompts/" + id + "/rollback", { method: "POST", body: { version: Number(version) } }); }, "Rollback effectué");
    await showAiPromptDetail(id);
  }

  async function publishAiPrompt(id, btn) {
    var success = await runAction(btn, async function () { await apiFetch("/api/admin/ai/prompts/" + id + "/publish", { method: "POST" }); }, "Prompt publié");
    if (success) { await loadAiPrompts(true); await showAiPromptDetail(id); }
  }

  async function archiveAiPrompt(id, btn) {
    if (!window.confirm("Archiver ce prompt ? Il ne sera plus utilisé pour le trafic réel.")) return;
    var success = await runAction(btn, async function () { await apiFetch("/api/admin/ai/prompts/" + id + "/archive", { method: "POST" }); }, "Prompt archivé");
    if (success) { await loadAiPrompts(true); await showAiPromptDetail(id); }
  }

  async function compareAiPromptVersions(id) {
    var a = byId("aiPromptDetailPanel").querySelector('input[name="aiCompareA"]:checked');
    var b = byId("aiPromptDetailPanel").querySelector('input[name="aiCompareB"]:checked');
    if (!a || !b) { showToast("Sélectionnez deux versions (A et B)", true); return; }
    try {
      var data = await apiFetch("/api/admin/ai/prompts/" + id + "/compare?a=" + a.value + "&b=" + b.value);
      var out = byId("aiPromptCompareOutput");
      out.classList.remove("hidden");
      out.textContent = JSON.stringify(data.diff, null, 2);
    } catch (e) { showToast(e.message, true); }
  }

  async function saveAiPromptMeta() {
    var id = aiState.detailPromptId;
    var guidelineIds = Array.prototype.map.call(byId("aiPromptDetailPanel").querySelectorAll(".ai-prompt-guideline:checked"), function (el2) { return el2.value; });
    var body = {
      name: byId("aiPromptName").value,
      description: byId("aiPromptDescription").value,
      specialty_id: byId("aiPromptSpecialty").value,
      task_id: byId("aiPromptTask").value,
      language: byId("aiPromptLanguage").value,
      confidence_threshold: Number(byId("aiPromptConfidence").value),
      status: byId("aiPromptStatus").value,
      preferred_model_id: byId("aiPromptPreferredModel").value,
      fallback_model_id: byId("aiPromptFallbackModel").value,
      second_fallback_model_id: byId("aiPromptSecondFallbackModel").value,
      guideline_ids: guidelineIds,
      variables: byId("aiPromptVariables").value.split(",").map(function (s) { return s.trim(); }).filter(Boolean),
      expected_json: byId("aiPromptExpectedJson").value
    };
    try { await apiFetch("/api/admin/ai/prompts/" + id, { method: "PATCH", body: body }); showToast("Métadonnées enregistrées"); await loadAiPrompts(true); }
    catch (e) { showToast(e.message, true); }
  }

  async function saveAiPromptVersion() {
    var id = aiState.detailPromptId;
    var body = {
      system_prompt: byId("aiPromptSystem").value,
      developer_prompt: byId("aiPromptDeveloper").value,
      user_template: byId("aiPromptUserTemplate").value,
      output_schema: byId("aiPromptOutputSchema").value
    };
    try {
      await apiFetch("/api/admin/ai/prompts/" + id + "/versions", { method: "POST", body: body });
      showToast("Nouvelle version enregistrée (statut : testing)");
      await loadAiPrompts(true);
      await showAiPromptDetail(id);
    } catch (e) { showToast(e.message, true); }
  }

  function fillAiPromptSample(label) {
    var sample = AI_PROMPT_SAMPLES[label];
    if (!sample) return;
    byId("aiPromptTestVars").value = JSON.stringify(sample, null, 2);
  }

  function readAiPromptTestVars() {
    var raw = byId("aiPromptTestVars").value.trim();
    if (!raw) return {};
    return JSON.parse(raw);
  }

  async function testAiPrompt() {
    var id = aiState.detailPromptId;
    var vars;
    try { vars = readAiPromptTestVars(); } catch (e) { showToast("Variables JSON invalides", true); return; }
    try {
      var data = await apiFetch("/api/admin/ai/prompts/" + id + "/test", { method: "POST", body: { variables: vars } });
      byId("aiPromptTestOutput").textContent = JSON.stringify(data, null, 2);
    } catch (e) { showToast(e.message, true); }
  }

  async function runAiPromptTest(btn) {
    var id = aiState.detailPromptId;
    var vars;
    try { vars = readAiPromptTestVars(); } catch (e) { showToast("Variables JSON invalides", true); return; }
    try {
      var data = await runBusy(btn, function () {
        return apiFetch("/api/admin/ai/prompts/" + id + "/test", { method: "POST", body: { run_ai: true, variables: vars, message: vars.chief_complaint || vars.clinical_notes || "Test" } });
      });
      byId("aiPromptTestOutput").textContent = JSON.stringify(data, null, 2);
    } catch (e) {
      byId("aiPromptTestOutput").textContent = "Erreur: " + e.message;
    }
  }

  async function renderAiRouter() {
    var tasks = await loadAiEntity("tasks");
    var models = await loadAiEntity("models");
    var prompts = await loadAiPrompts();
    var data = await apiFetch("/api/admin/ai/router");
    var rules = {};
    (data.rows || []).forEach(function (r) { rules[r.task_id] = r; });
    var modelOptions = function (sel) { return models.map(function (m) { return '<option value="' + escapeHtml(m.id) + '"' + (m.id === sel ? " selected" : "") + '>' + escapeHtml(m.name) + '</option>'; }).join(""); };
    var promptOptions = function (sel) { return prompts.map(function (p) { return '<option value="' + escapeHtml(p.id) + '"' + (p.id === sel ? " selected" : "") + '>' + escapeHtml(p.name) + '</option>'; }).join(""); };
    var rows = tasks.map(function (t) {
      var r = rules[t.id] || {};
      return '<tr data-task="' + escapeHtml(t.id) + '">' +
        '<td>' + escapeHtml(t.name) + '</td>' +
        '<td><select class="ai-router-model"><option value="">—</option>' + modelOptions(r.primary_model_id) + '</select></td>' +
        '<td><select class="ai-router-prompt"><option value="">—</option>' + promptOptions(r.prompt_id) + '</select></td>' +
        '<td><input class="ai-router-temp" type="number" step="0.1" placeholder="défaut" value="' + (r.temperature_override == null ? "" : escapeHtml(r.temperature_override)) + '"></td>' +
        '<td><input class="ai-router-fallback" type="text" placeholder="ids séparés par virgule" value="' + escapeHtml((r.fallback_model_ids || []).join(",")) + '"></td>' +
        '<td><button class="btn primary" type="button" data-ai-router-save="' + escapeHtml(t.id) + '">Enregistrer</button></td></tr>';
    }).join("");
    el.aiContent.innerHTML =
      '<div class="toolbar toolbar--actions"><button class="btn primary" type="button" id="aiRouterAutoAssignBtn">Auto-assigner depuis la Prompt Library</button></div>' +
      '<section class="panel"><div class="table-wrap"><table class="data-table"><thead><tr><th>Tâche clinique</th><th>Modèle principal</th><th>Version de prompt</th><th>Température</th><th>Fallback (IDs)</th><th></th></tr></thead><tbody>' +
      (rows || '<tr><td colspan="6"><div class="empty">Aucune tâche clinique.</div></td></tr>') + '</tbody></table></div></section>';
  }

  async function autoAssignAiRouter(btn) {
    var success = await runAction(btn, async function () {
      var data = await apiFetch("/api/admin/ai/router/auto-assign", { method: "POST", body: {} });
      showToast(data.assigned + " tâche(s) assignée(s), " + data.skipped.length + " ignorée(s)");
    });
    if (success) await renderAiRouter();
  }

  async function saveAiRouterRow(taskId, btn) {
    var tr = btn.closest("tr");
    var body = {
      primary_model_id: tr.querySelector(".ai-router-model").value,
      prompt_id: tr.querySelector(".ai-router-prompt").value,
      temperature_override: tr.querySelector(".ai-router-temp").value === "" ? null : Number(tr.querySelector(".ai-router-temp").value),
      fallback_model_ids: tr.querySelector(".ai-router-fallback").value.split(",").map(function (s) { return s.trim(); }).filter(Boolean)
    };
    await runAction(btn, async function () { await apiFetch("/api/admin/ai/router/" + taskId, { method: "PUT", body: body }); }, "Règle enregistrée");
  }

  async function renderAiUsage() {
    var data = await apiFetch("/api/admin/ai/usage");
    var rows = (data.by_model || []).map(function (r) {
      return '<tr><td>' + escapeHtml(r.name) + '</td><td>' + escapeHtml(r.requests || 0) + '</td><td>' + escapeHtml(r.tokens_in || 0) + '</td><td>' + escapeHtml(r.tokens_out || 0) + '</td><td>' + escapeHtml(r.errors || 0) + '</td></tr>';
    }).join("");
    el.aiContent.innerHTML = '<section class="panel"><h3>Usage (30 derniers jours)</h3><div class="table-wrap"><table class="data-table"><thead><tr><th>Modèle</th><th>Requêtes</th><th>Tokens in</th><th>Tokens out</th><th>Erreurs</th></tr></thead><tbody>' +
      (rows || '<tr><td colspan="5"><div class="empty">Aucune donnée.</div></td></tr>') + '</tbody></table></div></section>';
  }

  async function renderAiCosts() {
    var data = await apiFetch("/api/admin/ai/costs");
    var rows = (data.rows || []).map(function (r) {
      return '<tr><td>' + escapeHtml(r.name) + '</td><td>' + escapeHtml(r.requests || 0) + '</td><td>$' + escapeHtml((r.cost_usd || 0).toFixed(4)) + '</td></tr>';
    }).join("");
    el.aiContent.innerHTML = '<section class="stat-grid">' + statCard("Coût total (30j)", "$" + (data.total_cost_usd || 0).toFixed(2), "accent-violet") +
      '</section><section class="panel"><div class="table-wrap"><table class="data-table"><thead><tr><th>Modèle</th><th>Requêtes</th><th>Coût</th></tr></thead><tbody>' +
      (rows || '<tr><td colspan="3"><div class="empty">Aucune donnée.</div></td></tr>') + '</tbody></table></div></section>';
  }

  async function renderAiLogs() {
    var data = await apiFetch("/api/admin/ai/logs");
    var rows = (data.rows || []).map(function (l) {
      return '<tr><td>' + escapeHtml((l.at || "").replace("T", " ").slice(0, 19)) + '</td><td>' + escapeHtml(l.action_type || "") + '</td><td>' + escapeHtml(l.details || "") + '</td><td>' + (l.success ? badge("green", "OK") : badge("red", "Erreur")) + '</td></tr>';
    }).join("");
    el.aiContent.innerHTML = '<section class="panel"><h3>Logs IA (7 derniers jours)</h3><div class="table-wrap"><table class="data-table"><thead><tr><th>Date</th><th>Action</th><th>Détails</th><th>Statut</th></tr></thead><tbody>' +
      (rows || '<tr><td colspan="4"><div class="empty">Aucun log.</div></td></tr>') + '</tbody></table></div></section>';
  }

  async function renderAiAudit() {
    var data = await apiFetch("/api/admin/ai/audit");
    var rows = (data.rows || []).map(function (a) {
      return '<tr><td>' + escapeHtml((a.at || "").replace("T", " ").slice(0, 19)) + '</td><td>' + escapeHtml(a.admin_username || "") + '</td><td>' + escapeHtml(a.action || "") + '</td><td>' + escapeHtml(a.entity_type || "") + '</td><td>' + escapeHtml(a.details || "") + '</td></tr>';
    }).join("");
    el.aiContent.innerHTML = '<section class="panel"><h3>Journal d’audit IA</h3><div class="table-wrap"><table class="data-table"><thead><tr><th>Date</th><th>Admin</th><th>Action</th><th>Entité</th><th>Détails</th></tr></thead><tbody>' +
      (rows || '<tr><td colspan="5"><div class="empty">Aucune entrée.</div></td></tr>') + '</tbody></table></div></section>';
  }

  async function renderAiSettingsView() {
    var data = await apiFetch("/api/admin/ai/settings");
    var s = data.settings || {};
    el.aiContent.innerHTML = '<section class="panel"><div class="form-grid">' +
      '<label class="full"><span>Note de sécurité (affichée au médecin)</span><textarea id="aiSettingSafetyNote" rows="2">' + escapeHtml(s.safety_note || "") + '</textarea></label>' +
      '<label><span>Timeout par défaut (ms)</span><input id="aiSettingTimeout" type="number" value="' + escapeHtml(s.default_timeout_ms || 60000) + '"></label>' +
      '<label><span>Retry par défaut</span><input id="aiSettingRetry" type="number" value="' + escapeHtml(s.default_retry || 1) + '"></label>' +
      '</div><label class="check"><input type="checkbox" id="aiSettingPlayground"' + (s.playground_enabled ? " checked" : "") + '><span>Testing Playground activé</span></label>' +
      '<button class="btn primary" type="button" id="aiSettingsSaveBtn">Enregistrer</button></section>';
  }

  async function saveAiSettingsForm(btn) {
    var body = {
      safety_note: byId("aiSettingSafetyNote").value,
      default_timeout_ms: Number(byId("aiSettingTimeout").value),
      default_retry: Number(byId("aiSettingRetry").value),
      playground_enabled: byId("aiSettingPlayground").checked
    };
    await runAction(btn, async function () { await apiFetch("/api/admin/ai/settings", { method: "PATCH", body: body }); }, "Réglages enregistrés");
  }

  async function renderAiPlayground() {
    var tasks = await loadAiEntity("tasks");
    var taskOptions = tasks.map(function (t) { return '<option value="' + escapeHtml(t.id) + '">' + escapeHtml(t.name) + '</option>'; }).join("");
    var actionTypes = ["chat", "ecg_analysis", "lab_analysis", "pdf_analysis", "image_analysis", "irm_analysis", "multimodal_analysis", "prescription", "medication_safety"];
    el.aiContent.innerHTML = '<section class="panel"><div class="form-grid">' +
      '<label><span>Tâche clinique</span><select id="aiPgTask"><option value="">—</option>' + taskOptions + '</select></label>' +
      '<label><span>Action type</span><select id="aiPgAction">' + actionTypes.map(function (a) { return '<option value="' + a + '">' + a + '</option>'; }).join("") + '</select></label>' +
      '</div>' +
      '<label class="full"><span>Message</span><textarea id="aiPgMessage" rows="4" placeholder="Texte à analyser…"></textarea></label>' +
      '<button class="btn primary" type="button" id="aiPgRunBtn">Exécuter</button>' +
      '<h4>Résultat</h4><pre id="aiPgOutput" class="code-block"></pre></section>';
  }

  async function runAiPlayground(btn) {
    var body = {
      task_id: byId("aiPgTask").value,
      action_type: byId("aiPgAction").value,
      message: byId("aiPgMessage").value
    };
    try {
      var data = await runBusy(btn, function () { return apiFetch("/api/admin/ai/playground", { method: "POST", body: body }); });
      byId("aiPgOutput").textContent = JSON.stringify(data, null, 2);
    } catch (e) {
      byId("aiPgOutput").textContent = "Erreur: " + e.message;
    }
  }

  function bindAiManagementEvents() {
    el.aiSubNav.addEventListener("click", function (e) {
      var btn = e.target.closest("button[data-aiview]");
      if (btn) setAiView(btn.dataset.aiview);
    });
    el.aiGenericForm.addEventListener("submit", saveAiGeneric);
    el.aiContent.addEventListener("click", function (e) {
      var btn = e.target.closest("button");
      if (!btn || btn.__busy) return;
      if (btn.dataset.aiNew) { openAiGenericDialog(btn.dataset.aiNew, null); return; }
      if (btn.dataset.aiEdit) {
        var entity = btn.dataset.aiEdit;
        var idKey = AI_ENTITIES[entity].idField || "id";
        var row = (aiState[entity] || []).find(function (r) { return String(r[idKey]) === btn.dataset.id; });
        openAiGenericDialog(entity, row);
        return;
      }
      if (btn.dataset.aiDelete) { deleteAiGeneric(btn.dataset.aiDelete, btn.dataset.id, btn); return; }
      if (btn.dataset.guidelinePublish) { publishAiGuideline(btn.dataset.guidelinePublish, btn); return; }
      if (btn.dataset.guidelineVersion) { newVersionAiGuideline(btn.dataset.guidelineVersion, btn); return; }
      if (btn.dataset.guidelineDeprecate) { deprecateAiGuideline(btn.dataset.guidelineDeprecate, btn); return; }
      if (btn.id === "aiNewPromptBtn") { createAiPrompt(); return; }
      if (btn.dataset.promptExport) { exportAiPrompts(btn.dataset.promptExport); return; }
      if (btn.id === "aiImportPromptsBtn") { importAiPrompts(); return; }
      if (btn.dataset.promptDetail) { showAiPromptDetail(btn.dataset.promptDetail); return; }
      if (btn.dataset.promptClone) { cloneAiPrompt(btn.dataset.promptClone, btn); return; }
      if (btn.dataset.promptDelete) { deleteAiPrompt(btn.dataset.promptDelete, btn); return; }
      if (btn.dataset.promptRollback) { rollbackAiPrompt(btn.dataset.promptRollback, btn.dataset.version, btn); return; }
      if (btn.dataset.promptPublish) { publishAiPrompt(btn.dataset.promptPublish, btn); return; }
      if (btn.dataset.promptArchive) { archiveAiPrompt(btn.dataset.promptArchive, btn); return; }
      if (btn.dataset.promptCompare) { compareAiPromptVersions(btn.dataset.promptCompare); return; }
      if (btn.dataset.promptSample) { fillAiPromptSample(btn.dataset.promptSample); return; }
      if (btn.id === "aiPromptSaveMeta") { saveAiPromptMeta(); return; }
      if (btn.id === "aiPromptSaveVersion") { saveAiPromptVersion(); return; }
      if (btn.id === "aiPromptTestBtn") { testAiPrompt(); return; }
      if (btn.id === "aiPromptRunAiTestBtn") { runAiPromptTest(btn); return; }
      if (btn.dataset.aiRouterSave) { saveAiRouterRow(btn.dataset.aiRouterSave, btn); return; }
      if (btn.id === "aiRouterAutoAssignBtn") { autoAssignAiRouter(btn); return; }
      if (btn.id === "aiSettingsSaveBtn") { saveAiSettingsForm(btn); return; }
      if (btn.id === "aiPgRunBtn") { runAiPlayground(btn); return; }
    });
  }

  // ---- Account/subscription Plans (top-level tab, api/account-plans.js) ----
  // Deliberately outside the "Gestion IA" subnav/aiState.initialized lazy-init
  // path above -- this is its own top-level view, just reusing the same
  // generic entity-CRUD engine (renderAiGenericTable/openAiGenericDialog/
  // saveAiGeneric/deleteAiGeneric are all entity-key-generic, not IA-specific
  // despite the "Ai" naming).
  async function renderPlansView() {
    await loadAiEntity("account_plans");
    el.plansContent.innerHTML = renderAiGenericTable("account_plans");
  }

  function bindPlansEvents() {
    el.plansContent.addEventListener("click", function (e) {
      var btn = e.target.closest("button");
      if (!btn || btn.__busy) return;
      if (btn.dataset.aiNew) { openAiGenericDialog(btn.dataset.aiNew, null); return; }
      if (btn.dataset.aiEdit) {
        var entity = btn.dataset.aiEdit;
        var idKey = AI_ENTITIES[entity].idField || "id";
        var row = (aiState[entity] || []).find(function (r) { return String(r[idKey]) === btn.dataset.id; });
        openAiGenericDialog(entity, row);
        return;
      }
      if (btn.dataset.aiDelete) { deleteAiGeneric(btn.dataset.aiDelete, btn.dataset.id, btn); return; }
    });
  }

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
    ["dashboard","registrations","demandes","licenses","updates","plans","ai","ai-management"].forEach(function (name) {
      var panel = byId("view-" + name);
      if (panel) panel.classList.toggle("hidden", name !== view);
    });
    // Opening the demands tab clears the "unseen" badge.
    if (view === "demandes" && state.demandeUnseen > 0) markDemandesSeen();
    if (view === "ai-management" && !aiState.initialized) { aiState.initialized = true; setAiView(aiState.view || "dashboard"); }
    if (view === "plans") renderPlansView();
  }

  async function markDemandesSeen() {
    state.demandeUnseen = 0;
    renderDemandeBadge();
    try { await apiFetch("/api/admin/install-requests/seen", { method: "POST" }); }
    catch (e) { /* badge already cleared locally; server will resync on next load */ }
  }

  function renderDemandeBadge() {
    if (!el.demandeBadge) return;
    var n = state.demandeUnseen || 0;
    el.demandeBadge.textContent = n > 99 ? "99+" : String(n);
    el.demandeBadge.classList.toggle("hidden", n <= 0);
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

  function applyDemandes(data) {
    state.demandes = data.rows || [];
    state.demandesSeenAt = data.seen_at || "";
    // Don't flash the badge while the demands tab is already open — the user is
    // looking at them, so they aren't "unseen".
    state.demandeUnseen = state.view === "demandes" ? 0 : (data.unseen || 0);
    state.loading.demandes = false;
    renderDemandeBadge();
    renderDemandes();
    if (state.view === "demandes" && (data.unseen || 0) > 0) markDemandesSeen();
  }

  var SECTIONS = [
    { key: "doctors", path: "/api/admin/doctors", apply: applyDoctors },
    { key: "registrations", path: "/api/admin/registrations", apply: applyRegistrations },
    { key: "licenses", path: "/api/admin/licenses", apply: applyLicenses },
    { key: "releases", path: "/api/admin/releases", apply: applyReleases },
    { key: "telemetry", path: "/api/admin/update-telemetry", apply: applyTelemetry },
    { key: "demandes", path: "/api/admin/install-requests", apply: applyDemandes }
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
    renderDemandes();
    renderDemandeBadge();
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
    // The "create AI account" dialog only offers ACTIVE legacy keys (system
    // is deprecated in favor of AI Plans / OpenRouter) - an admin shouldn't
    // be able to accidentally wire a brand-new doctor to a dead named key.
    if (el.cloudDoctorAssignedKey) {
      var activeHtml = '<option value="">Aucune clé (à assigner plus tard)</option>';
      state.apiKeys.filter(function (k) { return k.active; }).forEach(function (k) {
        activeHtml += '<option value="' + escapeHtml(k.id) + '">' + escapeHtml(k.name) + ' — ' + escapeHtml(k.provider_label) + '</option>';
      });
      el.cloudDoctorAssignedKey.innerHTML = activeHtml;
    }
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
        '<td>' + (r.ai_plan_id
          ? '<div class="cell-title">' + badge("violet", escapeHtml(r.plan_label || "AI Plan")) + '</div><div class="cell-sub">AI Management (nouveau système)</div>'
          : '<div class="cell-sub">' + escapeHtml(r.assigned_api_key_name || "Aucune") + '</div><div class="cell-sub">' + escapeHtml(r.ai_provider_label || "") + ' ' + escapeHtml(r.ai_model || "") + ' (legacy)</div>') + '</td>' +
        '<td>' + usageBars(r.monthly_used, r.monthly_limit, r.daily_used, r.daily_limit) + '</td>' +
        '<td class="row-actions">' +
          '<button class="btn ghost" type="button" data-action="logs" data-id="' + escapeHtml(r.doctor_id) + '">Journal</button>' +
          '<button class="btn ghost" type="button" data-action="edit-doctor" data-id="' + escapeHtml(r.doctor_id) + '">Modifier</button>' +
          '<button class="btn primary" type="button" data-action="ai-config-doctor" data-id="' + escapeHtml(r.doctor_id) + '">Config IA</button>' +
          '<button class="btn danger" type="button" data-action="delete-doctor" data-id="' + escapeHtml(r.doctor_id) + '">Supprimer</button>' +
        '</td></tr>';
    }).join("");
    el.doctorRows.innerHTML = '<table class="data-table"><thead><tr><th>Compte</th><th>Connexion</th><th>Offre IA</th><th>Requêtes</th><th></th></tr></thead><tbody>' + html + '</tbody></table>';
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
      el.regRows.innerHTML = skeletonTable(["Médecin", "Contact", "Plan", "Licence", "Updates", ""], 5);
      return;
    }
    var rows = filteredRegistrations();
    el.regCount.textContent = rows.length;
    if (!rows.length) { el.regRows.innerHTML = '<div class="empty">Aucune inscription synchronisée pour le moment.</div>'; return; }
    var html = rows.map(function (r) {
      var st = r.status === "activated" ? badge("green", REG_STATUS.activated) : badge("amber", REG_STATUS.pending_activation);
      var lic = r.license ? '<div class="cell-sub">' + escapeHtml(r.license.key_hint) + ' (' + escapeHtml(r.license.license_type) + ')</div>' : '<div class="cell-sub">Pas encore de licence</div>';
      var skus = (r.update_skus || []).length ? (r.update_skus || []).map(function (s) { return badge("violet", s); }).join(" ") : '<div class="cell-sub">Pas de mise à jour payante</div>';
      var plan = r.requested_plan_name ? badge("blue", r.requested_plan_name) : '<div class="cell-sub">—</div>';
      return '<tr><td><div class="cell-title">' + escapeHtml(r.full_name || "—") + '</div><div class="cell-sub">' + escapeHtml(r.specialty || "") + (r.wilaya ? " · " + escapeHtml(r.wilaya) : "") + '</div></td>' +
        '<td><div class="cell-sub">' + escapeHtml(r.phone || "") + '</div><div class="cell-sub">' + escapeHtml(r.email || "") + '</div></td>' +
        '<td>' + plan + '</td>' +
        '<td>' + st + (r.cloud_doctor_id ? badge("violet","IA liée") : "") + lic + '</td>' +
        '<td><div class="cell-sub">Canal : ' + escapeHtml(r.update_channel || "stable") + '</div>' +
        '<div class="cell-sub">App : ' + escapeHtml(r.app_version || "—") + '</div>' + skus + '</td>' +
        '<td class="row-actions">' +
          '<button class="btn ghost" type="button" data-action="reg-edit" data-id="' + escapeHtml(r.id) + '">Modifier</button>' +
          '<button class="btn ghost" type="button" data-action="reg-generate" data-id="' + escapeHtml(r.id) + '">Générer clé</button>' +
          '<button class="btn primary" type="button" data-action="reg-entitle" data-id="' + escapeHtml(r.id) + '">Activer MAJ payante</button>' +
          ((r.update_skus || []).length ? '<button class="btn danger" type="button" data-action="reg-revoke-entitle" data-id="' + escapeHtml(r.id) + '" data-sku="' + escapeHtml((r.update_skus || [])[0] || "premium_2026") + '">Révoquer MAJ</button>' : "") +
          (r.cloud_doctor_id ? "" : '<button class="btn ghost" type="button" data-action="reg-cloud-doctor" data-id="' + escapeHtml(r.id) + '">Créer compte IA</button>') +
          '<button class="btn danger" type="button" data-action="reg-delete" data-id="' + escapeHtml(r.id) + '">Supprimer</button>' +
        '</td></tr>';
    }).join("");
    el.regRows.innerHTML = '<table class="data-table"><thead><tr><th>Médecin</th><th>Contact</th><th>Plan</th><th>Licence</th><th>Updates</th><th></th></tr></thead><tbody>' + html + '</tbody></table>';
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
          (r.serial_key && r.status !== "revoked" ? '<button class="btn ghost" type="button" data-action="license-email" data-id="' + escapeHtml(r.id) + '">Email</button>' : "") +
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

  function openRegEditDialog(id) {
    var reg = findRegistration(id);
    if (!reg) { showToast("Inscription introuvable", true); return; }
    state.pendingRegEditId = id;
    el.regEditName.textContent = reg.full_name || "—";
    el.regEditMeta.textContent = "Version app actuelle : " + (reg.app_version || "—") +
      (reg.specialty_locked ? " · Spécialité verrouillée par admin" : "");
    var statusLabel = reg.status === "activated" ? REG_STATUS.activated : REG_STATUS.pending_activation;
    el.regEditInfo.innerHTML = [
      ["Statut", statusLabel],
      ["Plan choisi", reg.requested_plan_name || "—"],
      ["Email", reg.email || "—"],
      ["Téléphone", reg.phone || "—"],
      ["Cabinet", reg.clinic_name || "—"],
      ["Adresse", reg.address || "—"],
      ["Wilaya", reg.wilaya || "—"],
      ["Inscrit le", reg.registered_at || "—"],
      ["Dernière synchro", reg.synced_at || "—"],
    ].map(function (row) {
      return '<div><strong>' + escapeHtml(row[0]) + ' :</strong> ' + escapeHtml(row[1]) + '</div>';
    }).join("");

    // Dropdown built from specialties ALREADY IN USE across synced
    // registrations - this is the exact vocabulary the desktop app itself
    // sends (whatever it calls its own modules), so it's guaranteed
    // compatible instead of guessing at an internal desktop enum.
    var specialties = Array.from(new Set(
      state.registrations.map(function (r) { return r.specialty; }).filter(Boolean)
    )).sort();
    if (reg.specialty && specialties.indexOf(reg.specialty) === -1) specialties.push(reg.specialty);
    el.regEditSpecialty.innerHTML = '<option value="">— Aucune</option>' +
      specialties.map(function (s) { return '<option value="' + escapeHtml(s) + '"' + (s === reg.specialty ? " selected" : "") + '>' + escapeHtml(s) + '</option>'; }).join("");

    // Dropdown built from PUBLISHED releases only - forcing a version with
    // no matching published release is a silent no-op (see evaluateUpdateCheck).
    var versions = (state.releases || []).filter(function (r) { return r.status === "published"; })
      .map(function (r) { return r.version; });
    versions = Array.from(new Set(versions)).sort();
    el.regEditForcedVersion.innerHTML = '<option value="">— Aucune (pas de forçage)</option>' +
      versions.map(function (v) { return '<option value="' + escapeHtml(v) + '"' + (v === reg.forced_min_version ? " selected" : "") + '>' + escapeHtml(v) + '</option>'; }).join("");

    el.regEditDialog.showModal();
  }

  async function submitRegEdit() {
    var id = state.pendingRegEditId;
    if (!id) return;
    setBusy(el.regEditSubmit, true);
    try {
      await apiFetch("/api/admin/registrations/" + encodeURIComponent(id), {
        method: "PATCH",
        body: {
          specialty: el.regEditSpecialty.value.trim(),
          forced_min_version: el.regEditForcedVersion.value.trim(),
        },
      });
      el.regEditDialog.close();
      showToast("Compte médecin mis à jour");
      refreshData();
    } catch (err) { showToast(err.message, true); }
    finally { setBusy(el.regEditSubmit, false); }
  }
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

  function filteredDemandes() {
    var q = state.demandeQuery.trim().toLowerCase();
    return state.demandes.filter(function (r) {
      var ok = state.demandeStatusFilter === "all" || r.status === state.demandeStatusFilter;
      var hay = [r.full_name, r.nom, r.prenom, r.specialite, r.phone, r.telephone, r.email, r.ville, r.cabinet].join(" ").toLowerCase();
      return ok && (!q || hay.indexOf(q) !== -1);
    });
  }

  function formatDemandeDate(value) {
    if (!value) return "—";
    return String(value).replace("T", " ").slice(0, 16);
  }

  function renderDemandes() {
    if (!el.demandeRows) return;
    if (state.loading.demandes) {
      el.demandeCount.textContent = "…";
      el.demandeRows.innerHTML = skeletonTable(["Médecin", "Contact", "Cabinet", "Reçue", ""], 5);
      return;
    }
    var rows = filteredDemandes();
    el.demandeCount.textContent = rows.length;
    if (!rows.length) { el.demandeRows.innerHTML = '<div class="empty">Aucune demande d\\'installation pour le moment.</div>'; return; }
    var seenAt = state.demandesSeenAt || "";
    var html = rows.map(function (r) {
      var stCls = r.status === "contacted" ? "green" : r.status === "archived" ? "red" : "amber";
      var isNew = seenAt && (r.created_at || "") > seenAt;
      return '<tr>' +
        '<td><div class="cell-title">' + escapeHtml(r.full_name || r.nom || "—") +
          (isNew ? ' ' + badge("blue", "Nouveau") : "") + '</div>' +
          '<div class="cell-sub">' + escapeHtml(r.specialite || "") + (r.ville ? " · " + escapeHtml(r.ville) : "") + '</div>' +
          badge(stCls, DEMANDE_STATUS[r.status] || r.status) + '</td>' +
        '<td><div class="cell-sub">' + escapeHtml(r.email || "") + '</div><div class="cell-sub">' + escapeHtml(r.telephone || "") + '</div></td>' +
        '<td><div class="cell-sub">' + escapeHtml(r.cabinet || "—") + '</div></td>' +
        '<td><div class="cell-sub">' + escapeHtml(formatDemandeDate(r.created_at)) + '</div></td>' +
        '<td class="row-actions">' +
          (r.email ? '<button class="btn ghost" type="button" data-action="demande-mail" data-id="' + escapeHtml(r.id) + '" data-email="' + escapeHtml(r.email) + '">Écrire</button>' : "") +
          (r.status !== "contacted" ? '<button class="btn ghost" type="button" data-action="demande-contacted" data-id="' + escapeHtml(r.id) + '">Marquer contactée</button>' : "") +
          (r.status !== "archived" ? '<button class="btn ghost" type="button" data-action="demande-archive" data-id="' + escapeHtml(r.id) + '">Archiver</button>' : "") +
          '<button class="btn danger" type="button" data-action="demande-delete" data-id="' + escapeHtml(r.id) + '">Supprimer</button>' +
        '</td></tr>';
    }).join("");
    el.demandeRows.innerHTML = '<table class="data-table"><thead><tr><th>Médecin</th><th>Contact</th><th>Cabinet</th><th>Reçue</th><th></th></tr></thead><tbody>' + html + '</tbody></table>';
  }

  function setDemandeStatus(id, status, btn) {
    rowAction(btn, "", function () {
      return apiFetch("/api/admin/install-requests/" + encodeURIComponent(id), { method: "PATCH", body: { status: status } });
    }, status === "contacted" ? "Demande marquée contactée" : "Demande archivée");
  }

  function deleteDemande(id, btn) {
    rowAction(btn, "Supprimer cette demande ?", function () {
      return apiFetch("/api/admin/install-requests/" + encodeURIComponent(id), { method: "DELETE" });
    }, "Demande supprimée");
  }

  // Opens the doctor's email client pre-addressed to the demand's email.
  function mailDemande(id, email) {
    if (email) window.location.href = "mailto:" + encodeURIComponent(email);
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

  async function openCloudDoctorDialog(regId) {
    var reg = findRegistration(regId);
    if (!reg) { showToast("Inscription introuvable", true); return; }
    if (reg.cloud_doctor_id) { showToast("Un compte IA est déjà lié à cette inscription.", true); return; }
    state.pendingCloudDoctorRegistrationId = regId;
    el.cloudDoctorRegName.textContent = reg.full_name || "—";
    el.cloudDoctorRegEmail.textContent = [reg.specialty, reg.email, reg.phone, reg.wilaya].filter(Boolean).join(" · ") || "—";

    // New subscriptions default onto the new AI Management system (a real
    // AI Plan), never onto the legacy named-key path - that select stays on
    // "Aucune" unless an admin deliberately picks a legacy key instead.
    var plans = await loadAiEntity("plans");
    var cheapest = plans.filter(function (p) { return p.active; })
      .sort(function (a, b) { return (a.monthly_limit || 0) - (b.monthly_limit || 0); })[0];
    el.cloudDoctorAiPlan.innerHTML = '<option value="">— Aucune (limites du compte / legacy)</option>' +
      plans.map(function (p) { return '<option value="' + escapeHtml(p.id) + '">' + escapeHtml(p.name) + '</option>'; }).join("");
    el.cloudDoctorAiPlan.value = cheapest ? cheapest.id : "";
    el.cloudDoctorAssignedKey.value = "";
    el.cloudDoctorMonthlyLimit.value = state.defaults.monthly_limit;
    el.cloudDoctorDailyLimit.value = state.defaults.daily_limit;
    el.cloudDoctorActive.checked = true;
    el.cloudDoctorAiEnabled.checked = false;
    el.cloudDoctorDialog.showModal();
  }

  async function submitCloudDoctor(useDefaults) {
    var regId = state.pendingCloudDoctorRegistrationId;
    if (!regId) return;
    var body = {};
    if (!useDefaults) {
      body = {
        ai_plan_id: el.cloudDoctorAiPlan.value,
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
      // Remember which licence this dialog is for, so "Envoyer par email" knows
      // the id and can prefill the linked doctor's address.
      state.pendingLicenseEmailId = result.license ? result.license.id : "";
      state.pendingLicenseEmail = result.license ? (result.license.registration_email || "") : "";
      el.serialDialog.showModal();
      refreshData();
    } catch (err) { showToast(err.message, true); }
    finally { setBusy(btn, false); }
  }

  // Opens the "send licence by email" dialog for a given licence id, prefilling
  // the doctor's address when the licence is linked to a registration.
  function openLicenseEmailDialog(id, presetEmail) {
    var lic = findLicense(id);
    state.pendingLicenseEmailId = id;
    el.licenseEmailForm.reset();
    var key = lic ? (lic.serial_key || lic.key_hint || "") : el.generatedSerialKey.value;
    el.licenseEmailKeyMeta.textContent = key ? ("Clé : " + key) : "";
    el.licenseEmailAddress.value = presetEmail || (lic && lic.registration_email) || state.pendingLicenseEmail || "";
    el.licenseEmailDialog.showModal();
  }

  async function sendLicenseEmail(e) {
    e.preventDefault();
    var id = state.pendingLicenseEmailId;
    if (!id) { showToast("Licence introuvable", true); return; }
    var btn = el.licenseEmailForm.querySelector('button[type="submit"]');
    var email = el.licenseEmailAddress.value.trim();
    setBusy(btn, true);
    try {
      var result = await apiFetch("/api/admin/licenses/" + encodeURIComponent(id) + "/send-email", {
        method: "POST", body: { email: email }
      });
      el.licenseEmailDialog.close();
      showToast("Clé envoyée à " + (result.sent_to || email));
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
    el.doctorAiEnabled.checked = row ? !!row.ai_enabled : false;
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

  // Doctor AI Configuration: everything a doctor's AI access depends on,
  // from one screen (AI Plan, specialties, per-doctor model restriction,
  // per-doctor flag opt-outs, language, limits) - Prompt Library/Knowledge
  // Base stay global per clinical task (Model Router), surfaced here only
  // as a read-only note so the admin knows they don't need to configure
  // those per doctor.
  async function openAiDoctorConfigDialog(doctor) {
    if (!doctor) return;
    var plans = await loadAiEntity("plans");
    var specialties = await loadAiEntity("specialties");
    var models = await loadAiEntity("models");
    var flags = await loadAiEntity("flags");

    el.aiDoctorConfigId.value = doctor.doctor_id;
    el.aiDoctorConfigTitle.textContent = doctor.email || "Médecin";
    el.aiDoctorConfigEnabled.checked = !!doctor.ai_enabled;
    el.aiDoctorConfigMonthly.value = doctor.monthly_limit || 0;
    el.aiDoctorConfigDaily.value = doctor.daily_limit || 0;
    el.aiDoctorConfigLanguage.value = doctor.default_language || "fr";

    el.aiDoctorConfigPlan.innerHTML = '<option value="">— Aucun (limites du compte)</option>' +
      plans.map(function (p) { return '<option value="' + escapeHtml(p.id) + '"' + (p.id === doctor.ai_plan_id ? " selected" : "") + '>' + escapeHtml(p.name) + '</option>'; }).join("");

    var specialtyIds = doctor.specialty_ids || [];
    el.aiDoctorConfigSpecialties.innerHTML = specialties.map(function (s) {
      var checked = specialtyIds.indexOf(s.id) !== -1 ? " checked" : "";
      return '<label class="check"><input type="checkbox" class="ai-doctor-specialty" value="' + escapeHtml(s.id) + '"' + checked + '><span>' + escapeHtml(s.name) + '</span></label>';
    }).join("");

    var modelOverrides = doctor.allowed_model_ids_override || [];
    el.aiDoctorConfigModels.innerHTML = models.map(function (m) {
      var checked = modelOverrides.indexOf(m.id) !== -1 ? " checked" : "";
      return '<label class="check"><input type="checkbox" class="ai-doctor-model" value="' + escapeHtml(m.id) + '"' + checked + '><span>' + escapeHtml(m.name) + '</span></label>';
    }).join("");

    var disabledFlags = doctor.disabled_flag_keys || [];
    el.aiDoctorConfigFlags.innerHTML = flags.map(function (f) {
      var checked = disabledFlags.indexOf(f.key) !== -1 ? " checked" : "";
      return '<label class="check"><input type="checkbox" class="ai-doctor-flag" value="' + escapeHtml(f.key) + '"' + checked + '><span>' + escapeHtml(f.key) + '</span></label>';
    }).join("") || '<p class="subtle">Aucun feature flag configuré.</p>';

    el.aiDoctorConfigDialog.showModal();
  }

  async function saveAiDoctorConfig(e) {
    e.preventDefault();
    var btn = el.aiDoctorConfigForm.querySelector('button[type="submit"]');
    var id = el.aiDoctorConfigId.value;
    var body = {
      ai_enabled: el.aiDoctorConfigEnabled.checked,
      ai_plan_id: el.aiDoctorConfigPlan.value,
      default_language: el.aiDoctorConfigLanguage.value,
      monthly_limit: parseInt(el.aiDoctorConfigMonthly.value, 10) || 0,
      daily_limit: parseInt(el.aiDoctorConfigDaily.value, 10) || 0,
      specialty_ids: Array.prototype.map.call(el.aiDoctorConfigSpecialties.querySelectorAll(".ai-doctor-specialty:checked"), function (i) { return i.value; }),
      allowed_model_ids_override: Array.prototype.map.call(el.aiDoctorConfigModels.querySelectorAll(".ai-doctor-model:checked"), function (i) { return i.value; }),
      disabled_flag_keys: Array.prototype.map.call(el.aiDoctorConfigFlags.querySelectorAll(".ai-doctor-flag:checked"), function (i) { return i.value; })
    };
    var success = await runAction(btn, async function () {
      await apiFetch("/api/admin/doctors/" + encodeURIComponent(id), { method: "PATCH", body: body });
    }, "Configuration IA enregistrée");
    if (success) { el.aiDoctorConfigDialog.close(); refreshData(); }
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
    el.regEditSubmit.addEventListener("click", submitRegEdit);
    el.cloudDoctorSubmit.addEventListener("click", function () { submitCloudDoctor(false); });
    el.cloudDoctorSkip.addEventListener("click", function () { submitCloudDoctor(true); });
    el.licenseType.addEventListener("change", syncTrialDays);
    el.licenseEditType.addEventListener("change", syncEditTrialDays);
    el.keyProvider.addEventListener("change", function () { if (!state.editingKeyId) el.keyModel.value = defaultModel(el.keyProvider.value); });
    el.regSearchInput.addEventListener("input", function () { state.regQuery = el.regSearchInput.value; renderRegistrations(); });
    el.regStatusFilter.addEventListener("change", function () { state.regStatusFilter = el.regStatusFilter.value; renderRegistrations(); });
    el.licenseSearchInput.addEventListener("input", function () { state.licenseQuery = el.licenseSearchInput.value; renderLicenses(); });
    el.licenseStatusFilter.addEventListener("change", function () { state.licenseStatusFilter = el.licenseStatusFilter.value; renderLicenses(); });
    el.demandeSearchInput.addEventListener("input", function () { state.demandeQuery = el.demandeSearchInput.value; renderDemandes(); });
    el.demandeStatusFilter.addEventListener("change", function () { state.demandeStatusFilter = el.demandeStatusFilter.value; renderDemandes(); });
    el.searchInput.addEventListener("input", function () { state.query = el.searchInput.value; renderDoctors(); });
    el.keyFilter.addEventListener("change", function () { state.keyFilter = el.keyFilter.value; renderDoctors(); });
    el.regRows.addEventListener("click", function (e) {
      var btn = e.target.closest("button[data-action]");
      if (!btn || btn.__busy) return;
      var action = btn.dataset.action;
      var id = btn.dataset.id;
      if (action === "reg-edit") openRegEditDialog(id);
      else if (action === "reg-generate") openLicenseDialog(id);
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
    el.licenseRows.addEventListener("click", function (e) { handleTableClick(e, { "license-copy": copyLicenseKey, "license-email": function (id) { openLicenseEmailDialog(id); }, "license-edit": openLicenseEditDialog, "license-revoke": revokeLicense, "license-delete": deleteLicense }); });
    el.demandeRows.addEventListener("click", function (e) {
      var btn = e.target.closest("button[data-action]");
      if (!btn || btn.__busy) return;
      var action = btn.dataset.action, id = btn.dataset.id;
      if (action === "demande-mail") mailDemande(id, btn.dataset.email);
      else if (action === "demande-contacted") setDemandeStatus(id, "contacted", btn);
      else if (action === "demande-archive") setDemandeStatus(id, "archived", btn);
      else if (action === "demande-delete") deleteDemande(id, btn);
    });
    el.serialSendEmailButton.addEventListener("click", function () {
      openLicenseEmailDialog(state.pendingLicenseEmailId, state.pendingLicenseEmail);
    });
    el.licenseEmailForm.addEventListener("submit", sendLicenseEmail);
    el.keyRows.addEventListener("click", function (e) { handleTableClick(e, { "edit-key": function (id) { openKeyDialog(findKey(id)); }, "delete-key": deleteKey }); });
    el.doctorRows.addEventListener("click", function (e) { handleTableClick(e, { "edit-doctor": function (id) { openDoctorDialog(findDoctor(id)); }, "ai-config-doctor": function (id) { openAiDoctorConfigDialog(findDoctor(id)); }, "logs": openLogs, "delete-doctor": deleteDoctor }); });
    el.aiDoctorConfigForm.addEventListener("submit", saveAiDoctorConfig);
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
     "demandeBadge","demandeSearchInput","demandeStatusFilter","demandeCount","demandeRows",
     "licenseSearchInput","licenseStatusFilter","licenseCount","licenseRows","newLicenseButtonAlt",
     "newReleaseButton","importGithubReleaseButton","releaseCount","releaseRows","telemetryCount","telemetryRows",
     "newKeyButton","newDoctorButton","keyCount","keyRows","searchInput","keyFilter","doctorCount","doctorRows",
     "licenseDialog","licenseForm","licenseRegistration","licenseType","trialDaysWrap","licenseTrialDays","licenseNote",
     "licenseEditDialog","licenseEditForm","licenseEditId","licenseEditSerial","licenseEditStatus","licenseEditExpires","licenseEditRegistration","licenseEditType","licenseEditTrialWrap","licenseEditTrialDays","licenseEditNote",
     "releaseDialog","releaseForm","releaseDialogMode","releaseDialogTitle","releaseId","releaseVersion","releaseChannel","releaseSeverity","releaseSku","releaseRollout","releaseStatus","releaseNotes","releaseArtifactUrl","releaseArtifactSignature","releaseMigrationRisk",
     "entitlementDialog","entitlementForm","entitlementRegId","entitlementRegLabel","entitlementSku","entitlementChannel","entitlementNote",
     "serialDialog","generatedSerialKey","generatedSerialMeta","serialSendEmailButton",
     "licenseEmailDialog","licenseEmailForm","licenseEmailKeyMeta","licenseEmailAddress",
     "keyDialog","keyForm","keyDialogMode","keyDialogTitle","keyId","keyName","keyProvider","keyModel","keySecret","keyActive","clearKeyWrap","clearKeySecret",
     "doctorDialog","doctorForm","doctorDialogMode","doctorDialogTitle","doctorId","doctorEmail","doctorAssignedKey","doctorMonthlyLimit","doctorDailyLimit","doctorActive","doctorAiEnabled","doctorUsageTools","setMonthlyUsed","setDailyUsed","resetMonthly","resetDaily",
     "aiDoctorConfigDialog","aiDoctorConfigForm","aiDoctorConfigId","aiDoctorConfigTitle","aiDoctorConfigEnabled","aiDoctorConfigPlan","aiDoctorConfigLanguage","aiDoctorConfigMonthly","aiDoctorConfigDaily","aiDoctorConfigSpecialties","aiDoctorConfigModels","aiDoctorConfigFlags",
     "regEditDialog","regEditName","regEditMeta","regEditInfo","regEditSpecialty","regEditForcedVersion","regEditSubmit",
     "cloudDoctorDialog","cloudDoctorRegName","cloudDoctorRegEmail","cloudDoctorAiPlan","cloudDoctorAssignedKey","cloudDoctorMonthlyLimit","cloudDoctorDailyLimit","cloudDoctorActive","cloudDoctorAiEnabled","cloudDoctorSubmit","cloudDoctorSkip",
     "logsDialog","logsTitle","logsRows","credentialsDialog","createdDoctorId","toast",
     "aiSubNav","aiContent","aiGenericDialog","aiGenericForm","aiGenericTitle","aiGenericFields",
     "plansContent"
    ].forEach(function (id) { el[id] = byId(id); });
    bindEvents();
    bindAiManagementEvents();
    bindPlansEvents();
    setView("dashboard");
    autoConnect();
  }

  document.addEventListener("DOMContentLoaded", init);
})();`;
